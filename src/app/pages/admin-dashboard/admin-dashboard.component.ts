import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { Project } from '../../models/project';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false,
})
export class AdminDashboardComponent implements OnInit {
  projects: Project[] = [];
  errorMessage = '';
  successMessage = '';
  private messageTimerId: ReturnType<typeof setTimeout> | null = null;
  saving = false;
  deletingProject = false;
  uploadingImage = false;
  uploadStatus = '';
  selectedImageFile: File | null = null;

  projectForm: Project = this.emptyProject();
  editingProjectId: string | null = null;
  techStackInput = '';
  showProjectModal = false;
  showDeleteProjectModal = false;
  projectToDelete: Project | null = null;

  constructor(
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    const activeLang = localStorage.getItem('lang') || 'EN';
    this.translate.use(activeLang);
    this.loadAll();
  }

  loadAll(): void {
    this.projectService.getAdminProjects().subscribe({
      next: (projects) => (this.projects = projects),
      error: () => (this.errorMessage = 'Failed to load projects.'),
    });
  }

  openAddProjectModal(): void {
    this.resetProjectForm();
    this.showProjectModal = true;
  }

  openEditProjectModal(project: Project): void {
    this.editingProjectId = project.id ?? null;
    this.projectForm = {
      id: project.id,
      name: project.name?.trim() ? project.name : this.getProjectDisplayName(project),
      description: project.description?.trim()
        ? project.description
        : this.getProjectDisplayDescription(project),
      titleEn: project.titleEn ?? project.name ?? '',
      titleDe: project.titleDe ?? project.name ?? '',
      descriptionEn: project.descriptionEn ?? '',
      descriptionDe: project.descriptionDe ?? '',
      titleKey: project.titleKey ?? '',
      descriptionKey: project.descriptionKey ?? '',
      imageUrl: project.imageUrl,
      techStack: [...project.techStack],
      liveUrl: project.liveUrl ?? '',
      githubUrl: project.githubUrl ?? '',
      sortOrder: project.sortOrder ?? 0,
    };
    this.techStackInput = project.techStack.join(', ');
    this.showProjectModal = true;
    this.uploadStatus = '';
    this.selectedImageFile = null;

    if (!this.projectForm.descriptionEn?.trim() && project.descriptionKey) {
      this.translate.get(project.descriptionKey).subscribe((translated) => {
        if (
          typeof translated === 'string' &&
          translated !== project.descriptionKey &&
          !this.projectForm.descriptionEn?.trim()
        ) {
          this.projectForm.descriptionEn = translated;
          this.projectForm.description = translated;
        }
      });
    }
  }

  closeProjectModal(): void {
    this.showProjectModal = false;
    this.uploadStatus = '';
    this.selectedImageFile = null;
    this.resetProjectForm();
  }

  saveProject(): void {
    this.clearMessages();
    this.saving = true;
    this.projectForm.techStack = this.techStackInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    this.ensureProjectTranslationKeys();

    if (this.editingProjectId) {
      this.projectService
        .updateProject(this.editingProjectId, this.projectForm)
        .subscribe({
          next: () => {
            this.saving = false;
            this.showProjectModal = false;
            this.resetProjectForm();
            this.setSuccessMessage('Project updated successfully.');
            this.loadAll();
          },
          error: () => {
            this.saving = false;
            this.errorMessage = 'Project update failed.';
          },
        });
      return;
    }

    this.projectService.createProject(this.projectForm).subscribe({
      next: () => {
        this.saving = false;
        this.showProjectModal = false;
        this.resetProjectForm();
        this.setSuccessMessage('Project added successfully.');
        this.loadAll();
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Project creation failed.';
      },
    });
  }

  deleteProject(id?: string): void {
    if (!id) {
      return;
    }

    this.projectService.deleteProject(id).subscribe({
      next: () => this.loadAll(),
      error: () => (this.errorMessage = 'Project delete failed.'),
    });
  }

  requestDeleteProject(project: Project): void {
    this.projectToDelete = project;
    this.showDeleteProjectModal = true;
  }

  closeDeleteProjectModal(): void {
    this.projectToDelete = null;
    this.showDeleteProjectModal = false;
  }

  confirmDeleteProject(): void {
    if (!this.projectToDelete?.id) {
      return;
    }
    this.clearMessages();

    this.deletingProject = true;
    this.projectService.deleteProject(this.projectToDelete.id).subscribe({
      next: () => {
        this.deletingProject = false;
        this.closeDeleteProjectModal();
        this.setSuccessMessage('Project deleted successfully.');
        this.loadAll();
      },
      error: () => {
        this.deletingProject = false;
        this.errorMessage = 'Project delete failed.';
      },
    });
  }

  getDeleteProjectDisplayName(): string {
    if (!this.projectToDelete) {
      return '';
    }
    return this.getProjectDisplayName(this.projectToDelete) || 'this project';
  }

  getProjectDisplayName(project: Project): string {
    const lang = (this.translate.currentLang || localStorage.getItem('lang') || 'EN').toUpperCase();
    if (lang === 'DE' && project.titleDe?.trim()) {
      return project.titleDe;
    }
    if (lang === 'EN' && project.titleEn?.trim()) {
      return project.titleEn;
    }

    const translated = this.resolveTranslation(project.titleKey);
    if (translated) {
      return translated;
    }
    return project.name?.trim() || project.titleKey || '';
  }

  getProjectDisplayDescription(project: Project): string {
    const lang = (this.translate.currentLang || localStorage.getItem('lang') || 'EN').toUpperCase();
    if (lang === 'DE' && project.descriptionDe?.trim()) {
      return project.descriptionDe;
    }
    if (lang === 'EN' && project.descriptionEn?.trim()) {
      return project.descriptionEn;
    }

    const translated = this.resolveTranslation(project.descriptionKey);
    if (translated) {
      return translated;
    }
    return project.description?.trim() || '';
  }

  private resolveTranslation(key?: string): string {
    if (!key) {
      return '';
    }

    const translated = this.translate.instant(key);
    return translated !== key ? translated : '';
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/admin/login';
  }

  resetProjectForm(): void {
    this.editingProjectId = null;
    this.projectForm = this.emptyProject();
    this.techStackInput = '';
    this.uploadStatus = '';
    this.selectedImageFile = null;
  }

  onImageFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedImageFile = input.files && input.files.length > 0 ? input.files[0] : null;
    this.uploadStatus = this.selectedImageFile ? `Selected: ${this.selectedImageFile.name}` : '';
  }

  uploadSelectedImage(): void {
    if (!this.selectedImageFile) {
      this.uploadStatus = 'Select an image first.';
      return;
    }

    this.uploadingImage = true;
    this.uploadStatus = 'Uploading image...';

    this.projectService.uploadProjectImage(this.selectedImageFile).subscribe({
      next: (response) => {
        this.uploadingImage = false;
        this.projectForm.imageUrl = response.imageUrl;
        this.uploadStatus = 'Image uploaded and URL filled.';
      },
      error: (error: HttpErrorResponse) => {
        this.uploadingImage = false;
        if (error.status === 413) {
          this.uploadStatus = 'Image is too large. Max allowed is 10MB.';
          return;
        }
        if (error.status === 401 || error.status === 403) {
          this.uploadStatus = 'Upload unauthorized. Please log in again.';
          return;
        }
        if (error.status === 0) {
          this.uploadStatus = 'Backend is unreachable.';
          return;
        }
        const backendMessage =
          typeof error.error === 'string'
            ? error.error
            : error.error?.message || error.error?.error || '';
        this.uploadStatus = backendMessage
          ? `Upload failed: ${backendMessage}`
          : 'Image upload failed.';
      },
    });
  }

  copyImagePath(): void {
    if (!this.projectForm.imageUrl?.trim()) {
      this.uploadStatus = 'No image URL to copy.';
      return;
    }

    navigator.clipboard.writeText(this.projectForm.imageUrl).then(
      () => (this.uploadStatus = 'Image URL copied.'),
      () => (this.uploadStatus = 'Copy failed.')
    );
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    if (this.messageTimerId) {
      clearTimeout(this.messageTimerId);
      this.messageTimerId = null;
    }
  }

  dismissSuccessMessage(): void {
    this.successMessage = '';
    if (this.messageTimerId) {
      clearTimeout(this.messageTimerId);
      this.messageTimerId = null;
    }
  }

  dismissErrorMessage(): void {
    this.errorMessage = '';
  }

  private setSuccessMessage(message: string): void {
    this.successMessage = message;
    if (this.messageTimerId) {
      clearTimeout(this.messageTimerId);
    }
    this.messageTimerId = setTimeout(() => {
      this.successMessage = '';
      this.messageTimerId = null;
    }, 4000);
  }

  private emptyProject(): Project {
    return {
      name: '',
      description: '',
      titleEn: '',
      titleDe: '',
      descriptionEn: '',
      descriptionDe: '',
      titleKey: '',
      descriptionKey: '',
      imageUrl: '',
      techStack: [],
      liveUrl: '',
      githubUrl: '',
      sortOrder: 0,
    };
  }

  private ensureProjectTranslationKeys(): void {
    const cleanName = (this.projectForm.name || 'PROJECT')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const suffix = this.projectForm.sortOrder ?? this.projects.length + 1;
    if (!this.projectForm.titleKey?.trim()) {
      this.projectForm.titleKey = `PROJECTS.TITLE_${cleanName}_${suffix}`;
    }
    if (!this.projectForm.descriptionKey?.trim()) {
      this.projectForm.descriptionKey = `PROJECTS.DESC_${cleanName}_${suffix}`;
    }
    this.projectForm.name = this.projectForm.titleEn?.trim() || this.projectForm.name || '';
    this.projectForm.description = this.projectForm.descriptionEn?.trim() || this.projectForm.description || '';
  }

}

import { Component, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Project } from '../../models/project';
import { AuthService } from '../../services/auth.service';
import { ProjectService } from '../../services/project.service';
import { AdminEditorPageBase } from '../shared/admin-editor-page.base';

@Component({
  selector: 'app-admin-project-editor',
  templateUrl: './admin-project-editor.component.html',
  styleUrls: ['./admin-project-editor.component.css', '../shared/admin-editor-page.shared.css', '../admin-dashboard/admin-dashboard.component.css'],
  standalone: false,
})
export class AdminProjectEditorComponent extends AdminEditorPageBase implements OnInit {
  private static readonly SAVE_MESSAGE_STORAGE_KEY = 'adminProjectEditor.pendingSuccessMessage';
  loading = true;
  saving = false;
  uploadingImage = false;
  uploadStatus = '';
  selectedImageFile: File | null = null;
  projects: Project[] = [];
  projectForm: Project = this.emptyProject();
  techStackInput = '';
  editingProjectId: string | null = null;

  constructor(
    authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly translate: TranslateService
  ) {
    super(authService);
  }

  ngOnInit(): void {
    this.initEditorPage();
    this.route.paramMap.subscribe((params) => {
      this.loadProjectEditor(params);
    });
  }

  get isEditMode(): boolean {
    return !!this.editingProjectId;
  }

  saveProject(): void {
    this.clearMessages();
    this.saving = true;
    this.projectForm.techStack = this.techStackInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    this.projectForm.sortOrder = this.normalizeProjectFormSortOrder(this.projectForm.sortOrder);
    this.ensureProjectTranslationKeys();

    const request = this.editingProjectId
      ? this.projectService.updateProject(this.editingProjectId, this.projectForm)
      : this.projectService.createProject(this.projectForm);

    request.subscribe({
      next: (project) => {
        this.saving = false;
        const successMessage = this.editingProjectId
          ? 'Project updated successfully.'
          : 'Project added successfully.';
        this.editingProjectId = project.id ?? this.editingProjectId;
        this.projectForm = this.mapProjectToForm(project);
        this.techStackInput = project.techStack.join(', ');
        this.selectedImageFile = null;
        this.uploadStatus = '';
        this.successMessage = successMessage;

        if (project.id && this.route.snapshot.paramMap.get('id') !== project.id) {
          sessionStorage.setItem(AdminProjectEditorComponent.SAVE_MESSAGE_STORAGE_KEY, successMessage);
          this.router.navigate(['/admin/projects', project.id], { replaceUrl: true });
          return;
        }
      },
      error: () => {
        this.saving = false;
        this.errorMessage = this.editingProjectId ? 'Project update failed.' : 'Project creation failed.';
      },
    });
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

  private loadProjectEditor(params: ParamMap): void {
    this.loading = true;
    this.clearMessages();
    this.editingProjectId = params.get('id');

    this.projectService.getAdminProjects().subscribe({
      next: (projects) => {
        this.projects = projects;

        if (!this.editingProjectId) {
          this.projectForm = this.emptyProject();
          this.techStackInput = '';
          this.loading = false;
          this.applyPendingSuccessMessage();
          return;
        }

        const project = projects.find((item) => item.id === this.editingProjectId);
        if (!project) {
          this.loading = false;
          this.errorMessage = 'Project not found.';
          return;
        }

        this.projectForm = this.mapProjectToForm(project);
        this.techStackInput = project.techStack.join(', ');
        this.loading = false;
        this.applyPendingSuccessMessage();

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
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'Failed to load projects.';
      },
    });
  }

  private mapProjectToForm(project: Project): Project {
    return {
      id: project.id,
      name: project.name?.trim() ? project.name : this.getProjectDisplayName(project),
      description: project.description?.trim() ? project.description : this.getProjectDisplayDescription(project),
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
      sortOrder: this.getProjectDisplayOrder(project),
    };
  }

  private getProjectDisplayName(project: Project): string {
    const lang = (this.translate.currentLang || localStorage.getItem('lang') || 'EN').toUpperCase();
    if (lang === 'DE' && project.titleDe?.trim()) {
      return project.titleDe;
    }
    if (lang === 'EN' && project.titleEn?.trim()) {
      return project.titleEn;
    }
    return project.name?.trim() || project.titleKey || '';
  }

  private getProjectDisplayDescription(project: Project): string {
    const lang = (this.translate.currentLang || localStorage.getItem('lang') || 'EN').toUpperCase();
    if (lang === 'DE' && project.descriptionDe?.trim()) {
      return project.descriptionDe;
    }
    if (lang === 'EN' && project.descriptionEn?.trim()) {
      return project.descriptionEn;
    }
    return project.description?.trim() || '';
  }

  private getProjectDisplayOrder(project: Project): number {
    return (project.sortOrder ?? 0) + 1;
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
      sortOrder: this.projects.length + 1,
    };
  }

  private ensureProjectTranslationKeys(): void {
    const cleanName = (this.projectForm.titleEn || this.projectForm.name || 'PROJECT')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');

    const suffix = (this.projectForm.sortOrder ?? this.projects.length) + 1;
    if (!this.projectForm.titleKey?.trim()) {
      this.projectForm.titleKey = `PROJECTS.TITLE_${cleanName}_${suffix}`;
    }
    if (!this.projectForm.descriptionKey?.trim()) {
      this.projectForm.descriptionKey = `PROJECTS.DESC_${cleanName}_${suffix}`;
    }
    this.projectForm.name = this.projectForm.titleEn?.trim() || this.projectForm.name || '';
    this.projectForm.description = this.projectForm.descriptionEn?.trim() || this.projectForm.description || '';
  }

  private normalizeProjectFormSortOrder(sortOrder: number | undefined): number {
    const requestedOrder = Number.isFinite(sortOrder) ? Number(sortOrder) : this.projects.length + 1;
    const maxOrder = this.editingProjectId ? this.projects.length : this.projects.length + 1;
    const clampedOrder = Math.max(1, Math.min(Math.trunc(requestedOrder || 1), maxOrder));
    return clampedOrder - 1;
  }
  private applyPendingSuccessMessage(): void {
    const pendingSuccessMessage = sessionStorage.getItem(
      AdminProjectEditorComponent.SAVE_MESSAGE_STORAGE_KEY
    );

    if (!pendingSuccessMessage) {
      return;
    }

    this.successMessage = pendingSuccessMessage;
    sessionStorage.removeItem(AdminProjectEditorComponent.SAVE_MESSAGE_STORAGE_KEY);
  }
}

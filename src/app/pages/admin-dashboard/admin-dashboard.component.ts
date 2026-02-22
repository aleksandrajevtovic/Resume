import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';
import { ContentBlock } from '../../models/content-block';
import { Project } from '../../models/project';
import { AuthService } from '../../services/auth.service';
import { ContentService } from '../../services/content.service';
import { ProjectService } from '../../services/project.service';

interface AboutContentRow {
  index: number;
  enId?: string;
  deId?: string;
  enValue: string;
  deValue: string;
  saving?: boolean;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: false,
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  readonly sidebarBreakpoint = 900;
  sidebarExpanded = true;
  isMobileSidebar = false;
  projects: Project[] = [];
  errorMessage = '';
  successMessage = '';
  private messageTimerId: ReturnType<typeof setTimeout> | null = null;
  saving = false;
  deletingProject = false;
  uploadingImage = false;
  uploadStatus = '';
  selectedImageFile: File | null = null;
  contentBlocks: ContentBlock[] = [];
  aboutRows: AboutContentRow[] = [];
  loadingAboutContent = false;
  canManageAboutContent = true;
  aboutContentErrorMessage = '';

  projectForm: Project = this.emptyProject();
  editingProjectId: string | null = null;
  techStackInput = '';
  showProjectModal = false;
  showDeleteProjectModal = false;
  showAboutModal = false;
  showDeleteAboutModal = false;
  projectToDelete: Project | null = null;
  aboutRowToDelete: AboutContentRow | null = null;
  deletingAbout = false;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly contentService: ContentService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    const activeLang = localStorage.getItem('lang') || 'EN';
    this.translate.use(activeLang);
    this.syncSidebarLayout(true);
    this.loadAll();
  }

  ngOnDestroy(): void {
    this.unlockBodyScroll();
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    event.preventDefault();

    if (this.showDeleteAboutModal && !this.deletingAbout) {
      this.closeDeleteAboutModal();
      return;
    }

    if (this.showDeleteProjectModal && !this.deletingProject) {
      this.closeDeleteProjectModal();
      return;
    }

    if (this.showAboutModal) {
      this.closeAboutModal();
      return;
    }

    if (this.showProjectModal) {
      this.closeProjectModal();
    }
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncSidebarLayout();
  }

  loadAll(): void {
    this.loadingAboutContent = true;
    this.aboutContentErrorMessage = '';
    this.canManageAboutContent = true;
    this.projectService.getAdminProjects().subscribe({
      next: (projects) => (this.projects = projects),
      error: () => (this.errorMessage = 'Failed to load projects.'),
    });
    this.contentService.getAdminContentBlocks().subscribe({
      next: (blocks) => {
        this.contentBlocks = blocks;
        const mappedRows = this.mapAboutRowsFromBlocks(blocks);
        this.aboutRows = mappedRows.length
          ? [mappedRows[0]]
          : [
              {
                index: 1,
                enValue: '',
                deValue: '',
              },
            ];
        this.loadingAboutContent = false;
      },
      error: () => {
        this.loadingAboutContent = false;
        this.canManageAboutContent = false;
        this.aboutRows = [];
        this.aboutContentErrorMessage =
          'About content management is not authorized (403). Enable /api/admin/content in backend admin security.';
      },
    });
  }

  openAddProjectModal(): void {
    this.resetProjectForm();
    this.showProjectModal = true;
    this.syncBodyScrollLock();
  }

  openAboutModal(): void {
    this.showAboutModal = true;
    this.syncBodyScrollLock();
  }

  closeAboutModal(): void {
    this.showAboutModal = false;
    this.syncBodyScrollLock();
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
    this.syncBodyScrollLock();
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
    this.syncBodyScrollLock();
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
            this.syncBodyScrollLock();
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
        this.syncBodyScrollLock();
        this.setSuccessMessage('Project added successfully.');
        this.loadAll();
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Project creation failed.';
      },
    });
  }

  requestDeleteProject(project: Project): void {
    this.projectToDelete = project;
    this.showDeleteProjectModal = true;
    this.syncBodyScrollLock();
  }

  closeDeleteProjectModal(): void {
    this.projectToDelete = null;
    this.showDeleteProjectModal = false;
    this.syncBodyScrollLock();
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

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
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

  saveAboutRow(row: AboutContentRow): void {
    if (!this.canManageAboutContent) {
      this.errorMessage = 'About content endpoint is not authorized.';
      return;
    }

    this.clearMessages();

    const enValue = row.enValue.trim();
    const deValue = row.deValue.trim();

    if (!enValue || !deValue) {
      this.closeAboutModal();
      this.errorMessage = 'Both English and German About text are required.';
      return;
    }

    row.saving = true;
    this.closeAboutModal();

    const enKey = this.buildAboutContentKey('EN', row.index);
    const deKey = this.buildAboutContentKey('DE', row.index);

    const enRequest = row.enId
      ? this.contentService.updateContentBlock(row.enId, { key: enKey, value: enValue })
      : this.contentService.createContentBlock({ key: enKey, value: enValue });

    const deRequest = row.deId
      ? this.contentService.updateContentBlock(row.deId, { key: deKey, value: deValue })
      : this.contentService.createContentBlock({ key: deKey, value: deValue });

    forkJoin([enRequest, deRequest]).subscribe({
      next: ([enBlock, deBlock]) => {
        row.enId = enBlock.id;
        row.deId = deBlock.id;
        row.enValue = enBlock.value;
        row.deValue = deBlock.value;
        row.saving = false;
        this.setSuccessMessage('About text saved successfully.');
        this.loadAll();
      },
      error: () => {
        row.saving = false;
        this.errorMessage = 'Failed to save About text. Check backend /api/admin/content permissions.';
      },
    });
  }

  requestDeleteAboutRow(row: AboutContentRow): void {
    if (!this.canManageAboutContent) {
      this.errorMessage = 'About content endpoint is not authorized.';
      return;
    }

    this.aboutRowToDelete = row;
    this.showDeleteAboutModal = true;
    this.syncBodyScrollLock();
  }

  closeDeleteAboutModal(): void {
    if (this.deletingAbout) {
      return;
    }
    this.aboutRowToDelete = null;
    this.showDeleteAboutModal = false;
    this.syncBodyScrollLock();
  }

  confirmDeleteAboutRow(): void {
    if (!this.aboutRowToDelete) {
      return;
    }

    this.deleteAboutRow(this.aboutRowToDelete);
  }

  private deleteAboutRow(row: AboutContentRow): void {
    if (!this.canManageAboutContent) {
      this.errorMessage = 'About content endpoint is not authorized.';
      return;
    }

    this.clearMessages();
    this.deletingAbout = true;
    this.showDeleteAboutModal = false;
    this.showAboutModal = false;
    this.syncBodyScrollLock();

    const requests: Observable<void>[] = [];
    if (row.enId) {
      requests.push(this.contentService.deleteContentBlock(row.enId));
    }
    if (row.deId) {
      requests.push(this.contentService.deleteContentBlock(row.deId));
    }

    if (!requests.length) {
      this.aboutRows = this.aboutRows.filter((item) => item !== row);
      this.aboutRowToDelete = null;
      this.deletingAbout = false;
      return;
    }

    row.saving = true;
    forkJoin(requests).subscribe({
      next: () => {
        row.saving = false;
        this.aboutRowToDelete = null;
        this.deletingAbout = false;
        this.setSuccessMessage('About text deleted.');
        this.loadAll();
      },
      error: () => {
        row.saving = false;
        this.aboutRowToDelete = null;
        this.deletingAbout = false;
        this.errorMessage = 'Failed to delete About text. Check backend /api/admin/content permissions.';
      },
    });
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

  private mapAboutRowsFromBlocks(blocks: ContentBlock[]): AboutContentRow[] {
    const rowMap = new Map<number, AboutContentRow>();

    for (const block of blocks) {
      const parsed = this.parseAboutContentKey(block.key);
      if (!parsed) {
        continue;
      }

      const row =
        rowMap.get(parsed.index) ??
        {
          index: parsed.index,
          enValue: '',
          deValue: '',
        };

      if (parsed.lang === 'EN') {
        row.enId = block.id;
        row.enValue = block.value ?? '';
      } else {
        row.deId = block.id;
        row.deValue = block.value ?? '';
      }

      rowMap.set(parsed.index, row);
    }

    return Array.from(rowMap.values()).sort((a, b) => a.index - b.index);
  }

  private parseAboutContentKey(key: string): { lang: 'EN' | 'DE'; index: number } | null {
    const match = key.match(/^ABOUT\.(EN|DE)\.SPAN(\d+)$/);
    if (!match) {
      return null;
    }

    return {
      lang: match[1] as 'EN' | 'DE',
      index: Number(match[2]),
    };
  }

  buildAboutContentKey(lang: 'EN' | 'DE', index: number): string {
    return `ABOUT.${lang}.SPAN${index}`;
  }

  private syncBodyScrollLock(): void {
    const hasOpenModal =
      this.showProjectModal || this.showDeleteProjectModal || this.showAboutModal || this.showDeleteAboutModal;

    this.document.body.style.overflow = hasOpenModal ? 'hidden' : '';
  }

  private unlockBodyScroll(): void {
    this.document.body.style.overflow = '';
  }

  private syncSidebarLayout(initial = false): void {
    const nextIsMobile = window.innerWidth < this.sidebarBreakpoint;

    if (initial) {
      this.isMobileSidebar = nextIsMobile;
      this.sidebarExpanded = !nextIsMobile;
      return;
    }

    if (nextIsMobile !== this.isMobileSidebar) {
      this.isMobileSidebar = nextIsMobile;
      this.sidebarExpanded = !nextIsMobile;
      return;
    }

    this.isMobileSidebar = nextIsMobile;
  }

}

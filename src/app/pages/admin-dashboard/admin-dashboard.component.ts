import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin, Observable } from 'rxjs';
import gsap from 'gsap';
import { ContentBlock } from '../../models/content-block';
import { Project } from '../../models/project';
import { AuthService } from '../../services/auth.service';
import { ContentService } from '../../services/content.service';
import { ProjectService } from '../../services/project.service';
import { DocumentScrollLock, runSharedPreloaderIntro } from '../../utils/page-preloader';

interface AboutContentRow {
  index: number;
  enId?: string;
  deId?: string;
  enValue: string;
  deValue: string;
  saving?: boolean;
}

interface ContactContentForm {
  enP1Id?: string;
  enP2Id?: string;
  enBtnId?: string;
  deP1Id?: string;
  deP2Id?: string;
  deBtnId?: string;
  enP1: string;
  enP2: string;
  enBtn: string;
  deP1: string;
  deP2: string;
  deBtn: string;
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
  isPageLoading = true;
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
  showContactModal = false;
  showDeleteAboutModal = false;
  projectToDelete: Project | null = null;
  aboutRowToDelete: AboutContentRow | null = null;
  deletingAbout = false;
  reorderingProjects = false;
  draggedProjectId: string | null = null;
  contactContent: ContactContentForm = this.emptyContactContent();
  loadingContactContent = false;
  contactContentErrorMessage = '';
  private preloaderRafId?: number;
  private preloadTl = gsap.timeline();
  private readonly preloadScrollLock: DocumentScrollLock;

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly authService: AuthService,
    private readonly projectService: ProjectService,
    private readonly contentService: ContentService,
    private readonly translate: TranslateService
  ) {
    this.preloadScrollLock = new DocumentScrollLock(document);
  }

  ngOnInit(): void {
    this.preloadScrollLock.lock();
    this.preloaderRafId = requestAnimationFrame(() => this.preloaderAnim());
    const activeLang = localStorage.getItem('lang') || 'EN';
    this.translate.use(activeLang);
    this.syncSidebarLayout(true);
    this.loadAll();
  }

  ngOnDestroy(): void {
    if (this.preloaderRafId) {
      cancelAnimationFrame(this.preloaderRafId);
    }
    this.preloadTl.kill();
    this.preloadScrollLock.unlock();
    this.unlockBodyScroll();
  }

  @HostListener('window:keydown.escape', ['$event'])
  onEscapeKey(event: Event): void {
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

    if (this.showContactModal) {
      this.closeContactModal();
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
    this.loadingContactContent = true;
    this.aboutContentErrorMessage = '';
    this.contactContentErrorMessage = '';
    this.canManageAboutContent = true;
    this.projectService.getAdminProjects().subscribe({
      next: (projects) => (this.projects = projects),
      error: () => (this.errorMessage = 'Failed to load projects.'),
    });
    this.contentService.getAdminContentBlocks().subscribe({
      next: (blocks) => {
        this.contentBlocks = blocks;
        const mappedRows = this.mapAboutRowsFromBlocks(blocks);
        this.contactContent = this.mapContactContentFromBlocks(blocks);
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
        this.loadingContactContent = false;
      },
      error: () => {
        this.loadingAboutContent = false;
        this.loadingContactContent = false;
        this.canManageAboutContent = false;
        this.aboutRows = [];
        this.contactContent = this.emptyContactContent();
        this.aboutContentErrorMessage =
          'About content management is not authorized (403). Enable /api/admin/content in backend admin security.';
        this.contactContentErrorMessage =
          'Contact content management is not authorized (403). Enable /api/admin/content in backend admin security.';
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

  openContactModal(): void {
    this.showContactModal = true;
    this.syncBodyScrollLock();
  }

  closeContactModal(): void {
    this.showContactModal = false;
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
      sortOrder: this.getProjectDisplayOrder(project),
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
    const normalizedSortOrder = this.normalizeProjectFormSortOrder(this.projectForm.sortOrder);
    this.projectForm.techStack = this.techStackInput
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
    this.projectForm.sortOrder = normalizedSortOrder;
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

  getProjectDisplayOrder(project: Project): number {
    return (project.sortOrder ?? 0) + 1;
  }

  onProjectDragStart(project: Project): void {
    if (this.reorderingProjects || !project.id) {
      return;
    }

    this.draggedProjectId = project.id;
  }

  onProjectDragEnd(): void {
    this.draggedProjectId = null;
  }

  onProjectDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onProjectDrop(targetProject: Project): void {
    if (this.reorderingProjects || !this.draggedProjectId || !targetProject.id) {
      this.draggedProjectId = null;
      return;
    }

    const fromIndex = this.projects.findIndex((project) => project.id === this.draggedProjectId);
    const toIndex = this.projects.findIndex((project) => project.id === targetProject.id);

    this.draggedProjectId = null;

    if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
      return;
    }

    this.reorderProjects(fromIndex, toIndex);
  }

  isDraggedProject(project: Project): boolean {
    return !!project.id && this.draggedProjectId === project.id;
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

  handleComponentSuccess(message: string): void {
    this.setSuccessMessage(message);
  }

  handleComponentError(message: string): void {
    this.clearMessages();
    this.errorMessage = message;
  }

  saveContactContent(): void {
    if (!this.canManageAboutContent) {
      this.errorMessage = 'Contact content endpoint is not authorized.';
      return;
    }

    this.clearMessages();

    const payload = {
      enP1: this.contactContent.enP1.trim(),
      enP2: this.contactContent.enP2.trim(),
      enBtn: this.contactContent.enBtn.trim(),
      deP1: this.contactContent.deP1.trim(),
      deP2: this.contactContent.deP2.trim(),
      deBtn: this.contactContent.deBtn.trim(),
    };

    if (Object.values(payload).some((value) => !value)) {
      this.closeContactModal();
      this.errorMessage = 'All English and German Contact fields are required.';
      return;
    }

    this.contactContent.saving = true;
    this.closeContactModal();

    forkJoin([
      this.upsertContentBlock(this.contactContent.enP1Id, 'CONTACT.EN.P1', payload.enP1),
      this.upsertContentBlock(this.contactContent.enP2Id, 'CONTACT.EN.P2', payload.enP2),
      this.upsertContentBlock(this.contactContent.enBtnId, 'CONTACT.EN.BTN', payload.enBtn),
      this.upsertContentBlock(this.contactContent.deP1Id, 'CONTACT.DE.P1', payload.deP1),
      this.upsertContentBlock(this.contactContent.deP2Id, 'CONTACT.DE.P2', payload.deP2),
      this.upsertContentBlock(this.contactContent.deBtnId, 'CONTACT.DE.BTN', payload.deBtn),
    ]).subscribe({
      next: ([enP1, enP2, enBtn, deP1, deP2, deBtn]) => {
        this.contactContent = {
          enP1Id: enP1.id,
          enP2Id: enP2.id,
          enBtnId: enBtn.id,
          deP1Id: deP1.id,
          deP2Id: deP2.id,
          deBtnId: deBtn.id,
          enP1: enP1.value,
          enP2: enP2.value,
          enBtn: enBtn.value,
          deP1: deP1.value,
          deP2: deP2.value,
          deBtn: deBtn.value,
          saving: false,
        };
        this.setSuccessMessage('Contact text saved successfully.');
        this.loadAll();
      },
      error: () => {
        this.contactContent.saving = false;
        this.errorMessage = 'Failed to save Contact text. Check backend /api/admin/content permissions.';
      },
    });
  }

  deleteContactContent(): void {
    if (!this.canManageAboutContent) {
      this.errorMessage = 'Contact content endpoint is not authorized.';
      return;
    }

    const ids = [
      this.contactContent.enP1Id,
      this.contactContent.enP2Id,
      this.contactContent.enBtnId,
      this.contactContent.deP1Id,
      this.contactContent.deP2Id,
      this.contactContent.deBtnId,
    ].filter((id): id is string => !!id);

    this.clearMessages();
    this.contactContent.saving = true;
    this.closeContactModal();

    if (!ids.length) {
      this.contactContent = this.emptyContactContent();
      this.setSuccessMessage('Contact text reset to translation fallback.');
      return;
    }

    forkJoin(ids.map((id) => this.contentService.deleteContentBlock(id))).subscribe({
      next: () => {
        this.contactContent = this.emptyContactContent();
        this.setSuccessMessage('Contact text deleted.');
        this.loadAll();
      },
      error: () => {
        this.contactContent.saving = false;
        this.errorMessage = 'Failed to delete Contact text. Check backend /api/admin/content permissions.';
      },
    });
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
      sortOrder: this.projects.length + 1,
    };
  }

  private emptyContactContent(): ContactContentForm {
    return {
      enP1: '',
      enP2: '',
      enBtn: '',
      deP1: '',
      deP2: '',
      deBtn: '',
    };
  }

  private ensureProjectTranslationKeys(): void {
    const cleanName = (this.projectForm.name || 'PROJECT')
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

  private reorderProjects(fromIndex: number, toIndex: number): void {
    const previousProjects = this.projects.map((project) => ({ ...project, techStack: [...project.techStack] }));
    const reordered = [...this.projects];
    const [movedProject] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedProject);

    this.projects = reordered.map((project, index) => ({
      ...project,
      techStack: [...project.techStack],
      sortOrder: index,
    }));
    this.reorderingProjects = true;
    this.clearMessages();

    const updates = this.projects
      .filter((project) => !!project.id)
      .map((project) =>
        this.projectService.updateProject(project.id!, this.createProjectPayload(project))
      );

    forkJoin(updates).subscribe({
      next: (projects) => {
        this.projects = [...projects].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        this.reorderingProjects = false;
        this.setSuccessMessage('Project order updated.');
      },
      error: () => {
        this.projects = previousProjects;
        this.reorderingProjects = false;
        this.errorMessage = 'Failed to update project order.';
      },
    });
  }

  private createProjectPayload(project: Project): Project {
    return {
      id: project.id,
      name: project.name ?? '',
      description: project.description ?? '',
      titleEn: project.titleEn ?? '',
      titleDe: project.titleDe ?? '',
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

  private mapContactContentFromBlocks(blocks: ContentBlock[]): ContactContentForm {
    const getBlock = (key: string) => blocks.find((block) => block.key === key);
    const enP1 = getBlock('CONTACT.EN.P1');
    const enP2 = getBlock('CONTACT.EN.P2');
    const enBtn = getBlock('CONTACT.EN.BTN');
    const deP1 = getBlock('CONTACT.DE.P1');
    const deP2 = getBlock('CONTACT.DE.P2');
    const deBtn = getBlock('CONTACT.DE.BTN');

    return {
      enP1Id: enP1?.id,
      enP2Id: enP2?.id,
      enBtnId: enBtn?.id,
      deP1Id: deP1?.id,
      deP2Id: deP2?.id,
      deBtnId: deBtn?.id,
      enP1: enP1?.value ?? '',
      enP2: enP2?.value ?? '',
      enBtn: enBtn?.value ?? '',
      deP1: deP1?.value ?? '',
      deP2: deP2?.value ?? '',
      deBtn: deBtn?.value ?? '',
    };
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

  private upsertContentBlock(id: string | undefined, key: string, value: string): Observable<ContentBlock> {
    return id
      ? this.contentService.updateContentBlock(id, { key, value })
      : this.contentService.createContentBlock({ key, value });
  }

  private syncBodyScrollLock(): void {
    const hasOpenModal =
      this.showProjectModal ||
      this.showDeleteProjectModal ||
      this.showAboutModal ||
      this.showContactModal ||
      this.showDeleteAboutModal;

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

  private preloaderAnim(): void {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.set('.admin-dashboard-shell', { opacity: 0 });
    gsap.set('.admin-topbar', {
      opacity: 0,
      y: reduceMotion ? 0 : -12,
    });
    gsap.set('.admin-layout', {
      opacity: 0,
      y: reduceMotion ? 0 : 14,
    });

    this.preloadTl.clear();
    runSharedPreloaderIntro(this.preloadTl, reduceMotion);
    this.preloadTl.to(
      '.admin-dashboard-shell',
      {
        duration: reduceMotion ? 0.18 : 0.4,
        opacity: 1,
        ease: 'power2.out',
      },
      '<'
    );
    this.preloadTl.to(
      '.admin-topbar',
      {
        duration: reduceMotion ? 0.18 : 0.38,
        opacity: 1,
        y: 0,
        clearProps: 'transform',
        ease: 'power2.out',
      },
      '<+0.14'
    );
    this.preloadTl.to(
      '.admin-layout',
      {
        duration: reduceMotion ? 0.2 : 0.48,
        opacity: 1,
        y: 0,
        clearProps: 'transform',
        ease: 'power3.out',
      },
      '<+0.05'
    );
    this.preloadTl.call(() => {
      this.isPageLoading = false;
      this.preloadScrollLock.unlock();
    });
  }
}

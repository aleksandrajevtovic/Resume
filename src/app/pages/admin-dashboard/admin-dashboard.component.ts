import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { forkJoin } from 'rxjs';
import gsap from 'gsap';
import { ContentBlock } from '../../models/content-block';
import { Project } from '../../models/project';
import { AuthService } from '../../services/auth.service';
import { ContentService } from '../../services/content.service';
import { ProjectService } from '../../services/project.service';
import { DocumentScrollLock, runSharedPreloaderIntro } from '../../utils/page-preloader';

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
  contentBlocks: ContentBlock[] = [];
  loadingAboutContent = false;
  canManageAboutContent = true;
  aboutContentErrorMessage = '';
  showDeleteProjectModal = false;
  projectToDelete: Project | null = null;
  reorderingProjects = false;
  draggedProjectId: string | null = null;
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

    if (this.showDeleteProjectModal && !this.deletingProject) {
      this.closeDeleteProjectModal();
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
        this.loadingAboutContent = false;
        this.loadingContactContent = false;
      },
      error: () => {
        this.loadingAboutContent = false;
        this.loadingContactContent = false;
        this.canManageAboutContent = false;
        this.aboutContentErrorMessage =
          'About content management is not authorized (403). Enable /api/admin/content in backend admin security.';
        this.contactContentErrorMessage =
          'Contact content management is not authorized (403). Enable /api/admin/content in backend admin security.';
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

  private syncBodyScrollLock(): void {
    this.document.body.style.overflow = this.showDeleteProjectModal ? 'hidden' : '';
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

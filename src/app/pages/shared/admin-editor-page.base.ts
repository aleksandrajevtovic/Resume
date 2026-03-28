import { Directive, HostListener } from '@angular/core';
import { AuthService } from '../../services/auth.service';

@Directive()
export abstract class AdminEditorPageBase {
  readonly sidebarBreakpoint = 900;
  sidebarExpanded = true;
  isMobileSidebar = false;
  errorMessage = '';
  successMessage = '';

  protected constructor(protected readonly authService: AuthService) {}

  protected initEditorPage(): void {
    this.syncSidebarLayout(true);
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncSidebarLayout();
  }

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/admin/login';
  }

  dismissSuccessMessage(): void {
    this.successMessage = '';
  }

  dismissErrorMessage(): void {
    this.errorMessage = '';
  }

  protected clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
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

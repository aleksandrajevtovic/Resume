import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-sidebar',
  templateUrl: './admin-sidebar.component.html',
  styleUrls: ['./admin-sidebar.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule],
})
export class AdminSidebarComponent {
  @Input() expanded = true;
  @Input() isMobile = false;

  @Output() toggleRequested = new EventEmitter<void>();
  @Output() logoutRequested = new EventEmitter<void>();

  @HostBinding('class')
  get hostClasses(): string {
    const classes = ['admin-sidebar-host'];
    if (this.isMobile) {
      classes.push('admin-sidebar-host--mobile');
    }
    if (this.isMobile && this.expanded) {
      classes.push('admin-sidebar-host--mobile-expanded');
    }
    return classes.join(' ');
  }

  onToggle(): void {
    this.toggleRequested.emit();
  }

  onLogout(): void {
    this.logoutRequested.emit();
  }
}

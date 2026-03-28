import { Routes } from '@angular/router';
import { AdminAuthGuard } from './guards/admin-auth.guard';
import { AdminAboutEditorComponent } from './pages/admin-about-editor/admin-about-editor.component';
import { AdminContactEditorComponent } from './pages/admin-contact-editor/admin-contact-editor.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminProjectEditorComponent } from './pages/admin-project-editor/admin-project-editor.component';
import { AdminRegisterComponent } from './pages/admin-register/admin-register.component';
import { ErrorComponent } from './pages/error/error.component';
import { HomeComponent } from './pages/home/home.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';

export const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' },
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'datenschutz', component: PrivacyPolicyComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin/register', component: AdminRegisterComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/about', component: AdminAboutEditorComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/contact', component: AdminContactEditorComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/projects/new', component: AdminProjectEditorComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/projects/:id', component: AdminProjectEditorComponent, canActivate: [AdminAuthGuard] },
  { path: '**', component: ErrorComponent },
];

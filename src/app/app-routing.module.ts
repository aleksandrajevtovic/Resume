import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { ErrorComponent } from './pages/error/error.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminAboutEditorComponent } from './pages/admin-about-editor/admin-about-editor.component';
import { AdminContactEditorComponent } from './pages/admin-contact-editor/admin-contact-editor.component';
import { AdminProjectEditorComponent } from './pages/admin-project-editor/admin-project-editor.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { AdminAuthGuard } from './guards/admin-auth.guard';

const routes: Routes = [
  { path: '', component: HomeComponent, pathMatch: 'full' }, // pathMatch is explicitly 'full'
  { path: 'privacy-policy', component: PrivacyPolicyComponent },
  { path: 'datenschutz', component: PrivacyPolicyComponent },
  { path: 'admin/login', component: AdminLoginComponent },
  { path: 'admin', component: AdminDashboardComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/about', component: AdminAboutEditorComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/contact', component: AdminContactEditorComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/projects/new', component: AdminProjectEditorComponent, canActivate: [AdminAuthGuard] },
  { path: 'admin/projects/:id', component: AdminProjectEditorComponent, canActivate: [AdminAuthGuard] },
  { path: '**', component: ErrorComponent }, // No pathMatch needed for wildcard route
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

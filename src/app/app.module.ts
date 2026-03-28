import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { FormsModule } from '@angular/forms';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { NgxCursorModule } from 'ngx-cursor';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './pages/home/home.component';
import { HeroComponent } from './components/hero/hero.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { PreloaderComponent } from './components/preloader/preloader.component';
import { AboutComponent } from './components/about/about.component';
import { FooterComponent } from './components/footer/footer.component';
import { ContactComponent } from './components/contact/contact.component';
import { WorkComponent } from './components/work/work.component';
import { AmbientShapesComponent } from './components/ambient-shapes/ambient-shapes.component';
import { AdminSidebarComponent } from './components/admin-sidebar/admin-sidebar.component';
import { AdminCvManagerComponent } from './components/admin-cv-manager/admin-cv-manager.component';
import { ConfirmModalComponent } from './components/confirm-modal/confirm-modal.component';
import { ErrorComponent } from './pages/error/error.component';
import { AdminLoginComponent } from './pages/admin-login/admin-login.component';
import { AdminAboutEditorComponent } from './pages/admin-about-editor/admin-about-editor.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminContactEditorComponent } from './pages/admin-contact-editor/admin-contact-editor.component';
import { AdminProjectEditorComponent } from './pages/admin-project-editor/admin-project-editor.component';
import { PrivacyPolicyComponent } from './pages/privacy-policy/privacy-policy.component';
import { authTokenInterceptor } from './interceptors/auth-token.interceptor';

@NgModule({ declarations: [
        AppComponent,
        HomeComponent,
        HeroComponent,
        NavigationComponent,
        PreloaderComponent,
        AboutComponent,
        FooterComponent,
        ContactComponent,
        WorkComponent,
        AmbientShapesComponent,
        AdminSidebarComponent,
        AdminCvManagerComponent,
        ConfirmModalComponent,
        ErrorComponent,
        AdminLoginComponent,
        AdminAboutEditorComponent,
        AdminDashboardComponent,
        AdminContactEditorComponent,
        AdminProjectEditorComponent,
        PrivacyPolicyComponent,
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        AppRoutingModule,
        FormsModule,
        NgxCursorModule,
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: HttpLoaderFactory,
                deps: [HttpClient],
            },
        })], providers: [provideHttpClient(withInterceptors([authTokenInterceptor]))] })
export class AppModule {}

export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

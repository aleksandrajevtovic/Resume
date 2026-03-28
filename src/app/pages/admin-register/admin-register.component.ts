import { CommonModule, DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterModule } from '@angular/router';
import gsap from 'gsap';
import { AuthService } from '../../services/auth.service';
import { DocumentScrollLock, runSharedPreloaderIntro } from '../../utils/page-preloader';

@Component({
  selector: 'app-admin-register',
  templateUrl: './admin-register.component.html',
  styleUrls: ['../admin-login/admin-login.component.css', './admin-register.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class AdminRegisterComponent implements OnInit, OnDestroy {
  username = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  showConfirmPassword = false;
  errorMessage = '';
  isLoading = false;
  isCheckingStatus = true;
  registrationOpen = false;
  isPageLoading = true;
  private preloaderRafId?: number;
  private tlLoad = gsap.timeline();
  private readonly preloadScrollLock: DocumentScrollLock;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document
  ) {
    this.preloadScrollLock = new DocumentScrollLock(document);
  }

  ngOnInit(): void {
    this.preloadScrollLock.lock();
    this.preloaderRafId = requestAnimationFrame(() => this.preloaderAnim());
    this.loadRegistrationStatus();
  }

  ngOnDestroy(): void {
    if (this.preloaderRafId) {
      cancelAnimationFrame(this.preloaderRafId);
    }
    this.tlLoad.kill();
    this.preloadScrollLock.unlock();
  }

  submit(): void {
    this.errorMessage = '';

    if (!this.registrationOpen) {
      this.errorMessage = 'Registration is closed. Sign in with your admin account.';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;
    this.authService.register(this.username.trim(), this.password).subscribe({
      next: () => {
        this.isLoading = false;
        this.router.navigate(['/admin']);
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        if (error.status === 0) {
          this.errorMessage = 'Backend is not reachable. Start backend on port 8081.';
          return;
        }
        if (error.status === 409) {
          this.errorMessage = 'That username is already taken.';
          return;
        }
        if (error.status === 403) {
          this.registrationOpen = false;
          this.errorMessage = 'Registration is already closed. Sign in instead.';
          return;
        }
        this.errorMessage = 'Registration failed.';
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  private loadRegistrationStatus(): void {
    this.authService.getRegistrationStatus().subscribe({
      next: (response) => {
        this.registrationOpen = response.registrationOpen;
        this.isCheckingStatus = false;
      },
      error: () => {
        this.registrationOpen = false;
        this.isCheckingStatus = false;
        this.errorMessage = 'Could not check registration status.';
      },
    });
  }

  private preloaderAnim(): void {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.set('.admin-login', { opacity: 0 });
    gsap.set('.admin-login__logo', {
      opacity: 0,
      y: reduceMotion ? 0 : -12,
    });
    gsap.set('.admin-login__card', {
      opacity: 0,
      y: reduceMotion ? 0 : 16,
      scale: reduceMotion ? 1 : 0.985,
    });

    this.tlLoad.clear();
    runSharedPreloaderIntro(this.tlLoad, reduceMotion);
    this.tlLoad.to(
      '.admin-login',
      {
        duration: reduceMotion ? 0.18 : 0.45,
        opacity: 1,
        ease: 'power2.out',
      },
      '<'
    );
    this.tlLoad.to(
      '.admin-login__logo',
      {
        duration: reduceMotion ? 0.18 : 0.4,
        opacity: 1,
        y: 0,
        ease: 'power2.out',
      },
      '<+0.18'
    );
    this.tlLoad.to(
      '.admin-login__card',
      {
        duration: reduceMotion ? 0.2 : 0.5,
        opacity: 1,
        y: 0,
        scale: 1,
        ease: 'power3.out',
      },
      '<+0.05'
    );
    this.tlLoad.call(() => {
      this.isPageLoading = false;
      this.preloadScrollLock.unlock();
    });
  }
}

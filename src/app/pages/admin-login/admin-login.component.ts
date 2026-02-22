import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import gsap from 'gsap';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-login',
  templateUrl: './admin-login.component.html',
  styleUrls: ['./admin-login.component.css'],
  standalone: false,
})
export class AdminLoginComponent implements OnInit, OnDestroy {
  username = '';
  password = '';
  showPassword = false;
  errorMessage = '';
  isLoading = false;
  isPageLoading = true;
  private originalBodyOverflow = '';
  private originalHtmlOverflow = '';
  private hasUnlockedScroll = false;
  private preloaderRafId?: number;
  private tlLoad = gsap.timeline();

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    @Inject(DOCUMENT) private readonly document: Document
  ) {}

  ngOnInit(): void {
    this.lockScroll();
    this.preloaderRafId = requestAnimationFrame(() => this.preloaderAnim());
  }

  ngOnDestroy(): void {
    if (this.preloaderRafId) {
      cancelAnimationFrame(this.preloaderRafId);
    }
    this.tlLoad.kill();
    this.unlockScroll();
  }

  submit(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.authService.login(this.username, this.password).subscribe({
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
        this.errorMessage = 'Invalid credentials.';
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
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
    this.tlLoad.to('.wave-animation', {
      delay: reduceMotion ? 0.95 : 1.95,
      duration: 0.35,
      opacity: 0,
    });
    this.tlLoad.to('.preloader', {
      delay: 0.25,
      duration: reduceMotion ? 0.15 : 0.24,
      opacity: 0,
      ease: 'power2.out',
    });
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
      this.unlockScroll();
    });
  }

  private lockScroll(): void {
    const body = this.document.body;
    const html = this.document.documentElement;

    this.originalBodyOverflow = body.style.overflow;
    this.originalHtmlOverflow = html.style.overflow;
    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
  }

  private unlockScroll(): void {
    if (this.hasUnlockedScroll) {
      return;
    }

    this.hasUnlockedScroll = true;
    this.document.body.style.overflow = this.originalBodyOverflow;
    this.document.documentElement.style.overflow = this.originalHtmlOverflow;
  }
}

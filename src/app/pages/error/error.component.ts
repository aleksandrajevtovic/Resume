import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import gsap from 'gsap';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.css'],
    standalone: false
})
export class ErrorComponent implements OnInit, OnDestroy {
  isLoading = true;
  private originalBodyOverflow = '';
  private originalHtmlOverflow = '';
  private hasUnlockedScroll = false;
  private preloaderRafId?: number;
  private tlLoad = gsap.timeline();

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}

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

  private preloaderAnim(): void {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    gsap.set('.error-shell', { opacity: 0, y: reduceMotion ? 0 : 10 });
    gsap.set('.navbar-content .logo, .nav-list', {
      opacity: 0,
      y: reduceMotion ? 0 : -14,
    });
    gsap.set('.error-card', {
      opacity: 0,
      y: reduceMotion ? 0 : 18,
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
      '.error-shell',
      {
        duration: reduceMotion ? 0.18 : 0.45,
        opacity: 1,
        y: 0,
        ease: 'power2.out',
      },
      '<'
    );
    this.tlLoad.to(
      '.navbar-content .logo, .nav-list',
      {
        duration: reduceMotion ? 0.18 : 0.45,
        opacity: 1,
        y: 0,
        stagger: reduceMotion ? 0 : 0.06,
        ease: 'power2.out',
      },
      '<+0.2'
    );
    this.tlLoad.to(
      '.error-card',
      {
        duration: reduceMotion ? 0.2 : 0.55,
        opacity: 1,
        y: 0,
        scale: 1,
        ease: 'power3.out',
      },
      '<+0.06'
    );
    this.tlLoad.call(() => {
      this.isLoading = false;
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

import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import gsap from 'gsap';
import { DocumentScrollLock, runSharedPreloaderIntro } from '../../utils/page-preloader';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {
  private originalScrollRestoration?: ScrollRestoration;
  private finalTopResetTimer?: number;
  private heroLoadedRafIds: number[] = [];
  private readonly preloadScrollLock: DocumentScrollLock;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.preloadScrollLock = new DocumentScrollLock(document);
  }
  tlLoad = gsap.timeline();

  ngOnInit(): void {
    this.disableScrollRestoration();
    this.resetToTop();
    this.preloadScrollLock.lock();
    requestAnimationFrame(() => this.preloaderAnim());
  }

  ngOnDestroy(): void {
    this.tlLoad.kill();
    this.setHeroLoaded(false);
    this.heroLoadedRafIds.forEach((id) => cancelAnimationFrame(id));
    this.heroLoadedRafIds = [];
    if (this.finalTopResetTimer) {
      window.clearTimeout(this.finalTopResetTimer);
    }
    this.restoreScrollRestoration();
    this.preloadScrollLock.unlock();
  }

  preloaderAnim(): void {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.resetToTop();

    gsap.set('.home-shell', { opacity: 0 });
    gsap.set('.navbar-content .logo, .navbar-content .nav-list', {
      opacity: 0,
      y: reduceMotion ? 0 : -18,
    });
    gsap.set('.hero h1.hero-title', {
      opacity: 0,
      y: reduceMotion ? 0 : '14vh',
    });
    gsap.set('.hero h1.hero-title .hero-title-line__inner', {
      opacity: 0,
      y: reduceMotion ? 0 : 42,
    });
    gsap.set('.hero .scroll-indicator, .hero .my-switcher', {
      opacity: 0,
      y: reduceMotion ? 0 : 8,
    });

    this.tlLoad.eventCallback('onComplete', () => {
      this.ensureHeroLoaded();
      this.resetToTop();
      this.preloadScrollLock.unlock();
      this.finalTopResetTimer = window.setTimeout(() => this.resetToTop(), 60);
    });

    runSharedPreloaderIntro(this.tlLoad, reduceMotion);
    this.tlLoad.to('.preloader', {
      zIndex: -1,
      pointerEvents: 'none',
    });
    this.tlLoad.to(
      '.home-shell',
      {
        duration: reduceMotion ? 0.18 : 0.55,
        opacity: 1,
        ease: 'power2.out',
      },
      '<'
    );
    this.tlLoad.to(
      '.navbar-content .logo, .navbar-content .nav-list',
      {
        duration: reduceMotion ? 0.18 : 0.5,
        opacity: 1,
        y: 0,
        stagger: reduceMotion ? 0 : 0.06,
        ease: 'power2.out',
      },
      '<+0.24'
    );
    this.tlLoad.to(
      '.hero h1.hero-title',
      {
        duration: reduceMotion ? 0.2 : 0.75,
        opacity: 1,
        y: 0,
        ease: 'power3.out',
      },
      '<+0.03'
    );
    this.tlLoad.to(
      '.hero h1.hero-title .hero-title-line__inner',
      {
        duration: reduceMotion ? 0.18 : 0.7,
        opacity: 1,
        y: 0,
        stagger: reduceMotion ? 0 : 0.08,
        ease: 'power3.out',
      },
      '<+0.04'
    );
    this.tlLoad.to(
      '.hero .scroll-indicator, .hero .my-switcher',
      {
        duration: reduceMotion ? 0.16 : 0.35,
        opacity: 1,
        y: 0,
        stagger: reduceMotion ? 0 : 0.05,
        ease: 'power2.out',
      },
      '<+0.18'
    );
    this.tlLoad.call(() => this.ensureHeroLoaded());
  }

  private resetToTop(): void {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }

  private setHeroLoaded(isLoaded: boolean): void {
    this.document.querySelectorAll('.hero').forEach((el) => {
      el.classList.toggle('hero-loaded', isLoaded);
    });
  }

  private ensureHeroLoaded(): void {
    this.setHeroLoaded(true);
    // Re-apply across a few frames in case the hero renders slightly later than the timeline call.
    [1, 2, 3].forEach(() => {
      const rafId = requestAnimationFrame(() => this.setHeroLoaded(true));
      this.heroLoadedRafIds.push(rafId);
    });
  }

  private disableScrollRestoration(): void {
    if (!('scrollRestoration' in window.history)) {
      return;
    }

    this.originalScrollRestoration = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';
  }

  private restoreScrollRestoration(): void {
    if (!('scrollRestoration' in window.history) || !this.originalScrollRestoration) {
      return;
    }

    window.history.scrollRestoration = this.originalScrollRestoration;
  }

}

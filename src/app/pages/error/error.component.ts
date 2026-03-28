import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import gsap from 'gsap';
import { AmbientShapesComponent } from '../../components/ambient-shapes/ambient-shapes.component';
import { NavigationComponent } from '../../components/navigation/navigation.component';
import { PreloaderComponent } from '../../components/preloader/preloader.component';
import { DocumentScrollLock, runSharedPreloaderIntro } from '../../utils/page-preloader';

@Component({
    selector: 'app-error',
    templateUrl: './error.component.html',
    styleUrls: ['./error.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule, NavigationComponent, AmbientShapesComponent, PreloaderComponent]
})
export class ErrorComponent implements OnInit, OnDestroy {
  isLoading = true;
  private preloaderRafId?: number;
  private tlLoad = gsap.timeline();
  private readonly preloadScrollLock: DocumentScrollLock;

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    this.preloadScrollLock = new DocumentScrollLock(document);
  }

  ngOnInit(): void {
    this.preloadScrollLock.lock();
    this.preloaderRafId = requestAnimationFrame(() => this.preloaderAnim());
  }

  ngOnDestroy(): void {
    if (this.preloaderRafId) {
      cancelAnimationFrame(this.preloaderRafId);
    }
    this.tlLoad.kill();
    this.preloadScrollLock.unlock();
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
    runSharedPreloaderIntro(this.tlLoad, reduceMotion);
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
      this.preloadScrollLock.unlock();
    });
  }
}

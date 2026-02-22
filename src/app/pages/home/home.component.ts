import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import gsap from 'gsap';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {
  private originalBodyOverflow = '';
  private originalHtmlOverflow = '';

  constructor(@Inject(DOCUMENT) private readonly document: Document) {}
  tlLoad = gsap.timeline();

  ngOnInit(): void {
    this.lockScroll();
    this.preloaderAnim();
  }

  ngOnDestroy(): void {
    this.tlLoad.kill();
    this.unlockScroll();
  }

  preloaderAnim(): void {
    this.tlLoad.eventCallback('onComplete', () => this.unlockScroll());

    this.tlLoad.to('.wave-animation', {
      delay: 2.5,
      duration: 0.5,
      opacity: 0,
    });
    this.tlLoad.to('.preloader', {
      delay: 0.7,
      duration: 1,
      y: '100%',
      ease: 'power4.out',
    });
    this.tlLoad.to('.preloader', {
      zIndex: -1,
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
    this.document.body.style.overflow = this.originalBodyOverflow;
    this.document.documentElement.style.overflow = this.originalHtmlOverflow;
  }
}

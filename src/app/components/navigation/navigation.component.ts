import { DOCUMENT } from '@angular/common';
import { Component, HostListener, Inject, OnDestroy, OnInit } from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import { AuthService } from '../../services/auth.service';

gsap.registerPlugin(ScrollTrigger);

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css'],
    standalone: false
})
export class NavigationComponent implements OnInit, OnDestroy {
  activeSection: 'about' | 'projects' | 'contact' | null = null;
  isAtTop = true;
  private sectionObserver?: IntersectionObserver;

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private readonly authService: AuthService
  ) {}
  tl = gsap.timeline({
    defaults: { duration: 0.75, reversed: true, ease: 'Power2.easeOut' },
  });

  ngOnInit() {
    this.navAnim();
    this.updateTopState();
    this.initSectionObserver();
    this.updateActiveSectionFromScroll();
  }

  navAnim(): void {
    this.tl.fromTo(
      '.nav-small',
      { opacity: 0, top: '-100%' },
      { opacity: 1, top: '0%' }
    );
  }
  openMenu() {
    // this.tl.reversed() ? this.tl.play() : this.tl.reverse();
    this.tl.reversed() ? this.tl.play() : this.tl.reverse();
    return console.log('clicked');
  }
  closeMenu() {
    this.tl.reversed() ? this.tl.play() : this.tl.reverse();
    return console.log('closed');
  }

  isAdminLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  setActiveSection(section: 'about' | 'projects' | 'contact'): void {
    this.activeSection = section;
  }

  scrollToSection(event: Event, section: 'about' | 'projects' | 'contact'): void {
    event.preventDefault();
    this.setActiveSection(section);

    const el = this.document.getElementById(section);
    if (!el) {
      return;
    }

    const top = window.scrollY + el.getBoundingClientRect().top - 8;
    window.scrollTo({
      top: Math.max(0, top),
      behavior: 'smooth',
    });
  }

  @HostListener('window:scroll')
  onWindowScroll(): void {
    this.updateTopState();
    this.updateActiveSectionFromScroll();
  }

  ngOnDestroy(): void {
    this.sectionObserver?.disconnect();
  }

  private initSectionObserver(): void {
    if (!('IntersectionObserver' in window)) {
      return;
    }

    const sections = ['about', 'projects', 'contact']
      .map((id) => this.document.getElementById(id))
      .filter((el): el is HTMLElement => !!el);

    if (!sections.length) {
      return;
    }

    this.sectionObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (!visibleEntries.length) {
          return;
        }

        const id = visibleEntries[0].target.id as 'about' | 'projects' | 'contact';
        this.activeSection = id;
      },
      {
        root: null,
        rootMargin: '-20% 0px -55% 0px',
        threshold: [0.15, 0.35, 0.6],
      }
    );

    sections.forEach((section) => this.sectionObserver?.observe(section));
  }

  private updateActiveSectionFromScroll(): void {
    const ids: Array<'about' | 'projects' | 'contact'> = ['about', 'projects', 'contact'];
    const markerY = window.innerHeight * 0.32;

    let current: 'about' | 'projects' | 'contact' | null = null;

    for (const id of ids) {
      const el = this.document.getElementById(id);
      if (!el) {
        continue;
      }

      const rect = el.getBoundingClientRect();
      if (rect.top <= markerY) {
        current = id;
      }
    }

    if (!current) {
      const aboutEl = this.document.getElementById('about');
      if (aboutEl && aboutEl.getBoundingClientRect().top <= window.innerHeight * 0.8) {
        current = 'about';
      }
    }

    this.activeSection = current;
  }

  private updateTopState(): void {
    this.isAtTop = window.scrollY < 24;
  }
  // closeMenu() {
  //   this.tl.timeScale(2.5);
  // this.tl.reverse();
  //   return console.log('closed');
  // }
}

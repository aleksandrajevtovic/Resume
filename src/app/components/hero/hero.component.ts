import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import gsap from 'gsap';

import ScrollTrigger from 'gsap/ScrollTrigger';
import { DOCUMENT } from '@angular/common';

gsap.registerPlugin(ScrollTrigger);
@Component({
    selector: 'app-hero',
    templateUrl: './hero.component.html',
    styleUrls: ['./hero.component.css'],
    standalone: false
})
export class HeroComponent implements OnInit, OnDestroy {
  private heroTimeline?: gsap.core.Timeline;
  private viewportRefreshTimeout?: ReturnType<typeof setTimeout>;
  private readonly handleViewportRefresh = () => this.refreshHeroScroll();
  heroLine1 = 'Software';
  heroLine2 = 'Developer';
  heroLine3 = '';

  constructor(
    @Inject(DOCUMENT) private document: Document,
    public translate: TranslateService
  ) {
    translate.addLangs(['EN', 'DE']);
    translate.setDefaultLang('EN');
  }
  switchLang(lang: string) {
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.setHeroLines(lang);
    // window.location.reload();
  }
  lang: any;
  ngOnInit() {
    this.lang = localStorage.getItem('lang') || 'EN';
    this.activeLang = this.lang;
    this.translate.use(this.lang);
    this.setHeroLines(this.lang);
    this.scrollAnim();
    this.bindViewportRefresh();
    this.queueViewportRefresh();
  }

  click = true;
  status = 'Enable';
  activeLang: string = 'EN';

  changeLangSwitch(lang: string) {
    this.click = !this.click;
    this.status = this.click ? 'Enable' : 'Disable';
    this.activeLang = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);
    this.setHeroLines(lang);

  }

  private setHeroLines(lang: string): void {
    if (lang === 'DE') {
      this.heroLine1 = 'Software';
      this.heroLine2 = 'Entwicklerin';
      this.heroLine3 = '';
      return;
    }

    this.heroLine1 = 'Software';
    this.heroLine2 = 'Developer';
    this.heroLine3 = '';
  }

  scrollAnim(): void {
    if (!this.document.querySelector('.about')) {
      return;
    }

    this.heroTimeline?.scrollTrigger?.kill();
    this.heroTimeline?.kill();

    this.heroTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '.about',
        scrub: 0.9,
        start: 'top 82%',
        end: 'top 50%',
        invalidateOnRefresh: true,
      },
    });

    this.heroTimeline.fromTo(
      '.hero h1, .scroll-indicator',
      { opacity: 1 },
      { opacity: 0 }
    );
    // this.tlH.fromTo(
    //   '.hero h1',
    //   { color: 'rgba(255,255,255,1' },
    //   { color: 'rgba(255,255,255,0' }
    // );
  }

  ngOnDestroy(): void {
    const windowRef = this.document.defaultView;

    windowRef?.removeEventListener('load', this.handleViewportRefresh);
    windowRef?.removeEventListener('resize', this.handleViewportRefresh);
    windowRef?.removeEventListener('orientationchange', this.handleViewportRefresh);
    windowRef?.visualViewport?.removeEventListener('resize', this.handleViewportRefresh);
    windowRef?.visualViewport?.removeEventListener('scroll', this.handleViewportRefresh);

    if (this.viewportRefreshTimeout) {
      clearTimeout(this.viewportRefreshTimeout);
    }

    this.heroTimeline?.scrollTrigger?.kill();
    this.heroTimeline?.kill();
  }

  private bindViewportRefresh(): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return;
    }

    windowRef.addEventListener('load', this.handleViewportRefresh, { passive: true });
    windowRef.addEventListener('resize', this.handleViewportRefresh, { passive: true });
    windowRef.addEventListener('orientationchange', this.handleViewportRefresh, { passive: true });
    windowRef.visualViewport?.addEventListener('resize', this.handleViewportRefresh, { passive: true });
    windowRef.visualViewport?.addEventListener('scroll', this.handleViewportRefresh, { passive: true });
  }

  private queueViewportRefresh(): void {
    const windowRef = this.document.defaultView;
    if (!windowRef) {
      return;
    }

    windowRef.requestAnimationFrame(() => {
      this.refreshHeroScroll();
      this.viewportRefreshTimeout = setTimeout(() => this.refreshHeroScroll(), 250);
    });
  }

  private refreshHeroScroll(): void {
    if (this.viewportRefreshTimeout) {
      clearTimeout(this.viewportRefreshTimeout);
    }

    this.viewportRefreshTimeout = setTimeout(() => {
      ScrollTrigger.refresh();
    }, 80);
  }


}

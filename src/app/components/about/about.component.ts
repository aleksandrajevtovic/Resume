import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import gsap from 'gsap';
import { Subscription } from 'rxjs';

import ScrollTrigger from 'gsap/ScrollTrigger';
import { DOCUMENT } from '@angular/common';
import { ContentService } from '../../services/content.service';

gsap.registerPlugin(ScrollTrigger);
@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    standalone: false
})
export class AboutComponent implements OnInit, OnDestroy {
  private aboutTimeline?: gsap.core.Timeline;
  private readonly subscriptions = new Subscription();
  private contentMap: Record<string, string> = {};
  private readonly fallbackSpanCount = 7;
  aboutSpans: string[] = [];

  constructor(
    @Inject(DOCUMENT) private document: Document,
    private readonly translate: TranslateService,
    private readonly contentService: ContentService
  ) {}

  ngOnInit() {
    this.setAboutSpansForLanguage(this.getCurrentLang());
    this.loadAboutContent();
    this.subscriptions.add(
      this.translate.onLangChange.subscribe((event: LangChangeEvent) => {
        this.setAboutSpansForLanguage(event.lang);
      })
    );
    this.scrollAboutText();
  }

  scrollAboutText(): void {
    this.aboutTimeline?.scrollTrigger?.kill();
    this.aboutTimeline?.kill();

    const matches = this.document.querySelectorAll('.highlight');
    if (!matches.length) {
      return;
    }

    this.aboutTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: '#about',
        scrub: true,
        start: 'top center',
        end: 'bottom 40%',
      },
    });

    this.aboutTimeline.to(matches, {
      backgroundPositionX: '0%',
      ease: 'none',
      stagger: 1,
    });
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.aboutTimeline?.scrollTrigger?.kill();
    this.aboutTimeline?.kill();
  }

  private loadAboutContent(): void {
    this.subscriptions.add(
      this.contentService.getPublicContentMap().subscribe({
        next: (contentMap) => {
          this.contentMap = contentMap;
          this.setAboutSpansForLanguage(this.getCurrentLang());
        },
        error: () => {
          // Keep translation-file fallback if backend content is unavailable.
          this.setAboutSpansForLanguage(this.getCurrentLang());
        },
      })
    );
  }

  private setAboutSpansForLanguage(lang: string): void {
    const normalizedLang = (lang || 'EN').toUpperCase();
    const prefix = `ABOUT.${normalizedLang}.SPAN`;

    const dynamicSpans = Object.entries(this.contentMap)
      .map(([key, value]) => {
        if (!key.startsWith(prefix)) {
          return null;
        }

        const suffix = key.slice(prefix.length);
        if (!/^\d+$/.test(suffix)) {
          return null;
        }

        return {
          index: Number(suffix),
          value: value?.trim() ?? '',
        };
      })
      .filter((item): item is { index: number; value: string } => !!item)
      .filter((item) => item.value.length > 0)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.value);

    if (dynamicSpans.length) {
      this.aboutSpans = dynamicSpans;
      this.reinitAboutAnimation();
      return;
    }

    this.aboutSpans = Array.from({ length: this.fallbackSpanCount }, (_, i) =>
      this.translate.instant(`ABOUT.SPAN${i + 1}`)
    ).filter((value) => typeof value === 'string' && value.trim().length > 0);

    this.reinitAboutAnimation();
  }

  private getCurrentLang(): string {
    return this.translate.currentLang || localStorage.getItem('lang') || 'EN';
  }

  private reinitAboutAnimation(): void {
    setTimeout(() => this.scrollAboutText());
  }
}

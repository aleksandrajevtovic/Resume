import { CommonModule, DOCUMENT } from '@angular/common';
import { Component, Inject, OnDestroy, OnInit } from '@angular/core';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import gsap from 'gsap';
import { Subscription } from 'rxjs';

import ScrollTrigger from 'gsap/ScrollTrigger';
import { ContentService } from '../../services/content.service';

gsap.registerPlugin(ScrollTrigger);
@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    standalone: true,
    imports: [CommonModule]
})
export class AboutComponent implements OnInit, OnDestroy {
  private aboutTimeline?: gsap.core.Timeline;
  private readonly subscriptions = new Subscription();
  private contentMap: Record<string, string> = {};
  private readonly fallbackSpanCount = 7;
  private readonly highlightEase = gsap.parseEase('power3.out');
  aboutReady = false;
  aboutSpans: string[] = [];
  aboutTokens: Array<{ text: string; isWord: boolean }> = [];

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

    const textContainer = this.document.querySelector<HTMLElement>('#about .text-container');
    const matches = Array.from(this.document.querySelectorAll<HTMLElement>('.highlight-word'));

    if (!textContainer || !matches.length) {
      this.aboutReady = false;
      return;
    }

    this.updateWordHighlight(matches, 0);
    this.aboutReady = true;

    this.aboutTimeline = gsap.timeline({
      scrollTrigger: {
        trigger: textContainer,
        scrub: true,
        start: 'top 82%',
        end: 'bottom 38%',
        invalidateOnRefresh: true,
        onUpdate: (self) => this.updateWordHighlight(matches, self.progress),
      },
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
      this.aboutTokens = this.buildAboutTokens(this.aboutSpans);
      this.reinitAboutAnimation();
      return;
    }

    this.aboutSpans = Array.from({ length: this.fallbackSpanCount }, (_, i) =>
      this.translate.instant(`ABOUT.SPAN${i + 1}`)
    ).filter((value) => typeof value === 'string' && value.trim().length > 0);
    this.aboutTokens = this.buildAboutTokens(this.aboutSpans);

    this.reinitAboutAnimation();
  }

  private getCurrentLang(): string {
    return this.translate.currentLang || localStorage.getItem('lang') || 'EN';
  }

  private reinitAboutAnimation(): void {
    this.aboutReady = false;
    setTimeout(() => this.scrollAboutText());
  }

  private updateWordHighlight(words: HTMLElement[], progress: number): void {
    if (!words.length) {
      return;
    }

    const clampedProgress = gsap.utils.clamp(0, 1, progress);
    words.forEach((word, index) => {
      const revealWindow = clampedProgress * words.length;
      const localProgress = gsap.utils.clamp(0, 1, (revealWindow - index + 1.15) / 1.35);
      const easedProgress = this.highlightEase(localProgress);
      const brightness = 120 + Math.round(127 * easedProgress);
      const accent = 170 + Math.round(85 * easedProgress);
      const opacity = 0.36 + easedProgress * 0.64;
      const blur = (1 - easedProgress) * 3.5;
      const translateY = (1 - easedProgress) * 16;
      const scale = 0.985 + easedProgress * 0.015;
      const glow = easedProgress * 18;

      word.style.color = `rgba(${brightness}, ${brightness}, ${accent}, ${opacity})`;
      word.style.opacity = `${0.52 + easedProgress * 0.48}`;
      word.style.filter = `blur(${blur}px)`;
      word.style.transform = `translate3d(0, ${translateY}px, 0) scale(${scale})`;
      word.style.textShadow = `0 0 ${glow}px rgba(247, 245, 255, ${easedProgress * 0.18})`;
    });
  }

  private buildAboutTokens(spans: string[]): Array<{ text: string; isWord: boolean }> {
    const text = spans
      .map((span) => span.replace(/\s+/g, ' ').trim())
      .filter((span) => span.length > 0)
      .join(' ')
      .trim();

    if (!text) {
      return [];
    }

    return text
      .split(/(\s+)/)
      .filter((token) => token.length > 0)
      .map((token) => ({
        text: token,
        isWord: !/^\s+$/.test(token),
      }));
  }
}

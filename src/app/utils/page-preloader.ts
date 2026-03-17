import gsap from 'gsap';

const PRELOADER_TIMING = {
  waveFadeDuration: 0.35,
  waveFadeDelay: {
    reduced: 0.7,
    default: 1.35,
  },
  preloaderFadeDelay: 0.14,
  preloaderFadeDuration: {
    reduced: 0.15,
    default: 0.24,
  },
} as const;

export class DocumentScrollLock {
  private originalBodyOverflow = '';
  private originalHtmlOverflow = '';
  private unlocked = false;

  constructor(private readonly document: Document) {}

  lock(): void {
    const body = this.document.body;
    const html = this.document.documentElement;

    this.originalBodyOverflow = body.style.overflow;
    this.originalHtmlOverflow = html.style.overflow;
    this.unlocked = false;

    body.style.overflow = 'hidden';
    html.style.overflow = 'hidden';
  }

  unlock(): void {
    if (this.unlocked) {
      return;
    }

    this.unlocked = true;
    this.document.body.style.overflow = this.originalBodyOverflow;
    this.document.documentElement.style.overflow = this.originalHtmlOverflow;
  }
}

export function runSharedPreloaderIntro(timeline: gsap.core.Timeline, reduceMotion: boolean): void {
  timeline.to('.wave-animation', {
    delay: reduceMotion ? PRELOADER_TIMING.waveFadeDelay.reduced : PRELOADER_TIMING.waveFadeDelay.default,
    duration: PRELOADER_TIMING.waveFadeDuration,
    opacity: 0,
  });

  timeline.to('.preloader', {
    delay: PRELOADER_TIMING.preloaderFadeDelay,
    duration: reduceMotion
      ? PRELOADER_TIMING.preloaderFadeDuration.reduced
      : PRELOADER_TIMING.preloaderFadeDuration.default,
    opacity: 0,
    ease: 'power2.out',
  });
}

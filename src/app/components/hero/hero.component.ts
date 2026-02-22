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
    // window.location.reload();
  }
  lang: any;
  ngOnInit() {
    this.lang = localStorage.getItem('lang') || 'EN';
    this.activeLang = this.lang;
    this.translate.use(this.lang);
    this.scrollAnim();
  }
  heroLine1 = 'Frontend';
  heroLine2 = 'Web';
  heroLine3 = 'Developer';

  click = true;
  status = 'Enable';
  activeLang: string = 'EN';

  changeLangSwitch(lang: string) {
    this.click = !this.click;
    this.status = this.click ? 'Enable' : 'Disable';
    this.activeLang = lang;
    this.translate.use(lang);
    localStorage.setItem('lang', lang);

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
    this.heroTimeline?.scrollTrigger?.kill();
    this.heroTimeline?.kill();
  }


}

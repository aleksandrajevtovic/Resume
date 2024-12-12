import { Component, Inject, OnInit } from '@angular/core';
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
export class HeroComponent implements OnInit {
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
    this.scrollAnim();
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

  }

  tlH = gsap.timeline({
    scrollTrigger: {
      trigger: '.about',
      // markers: { startColor: 'yellow', endColor: 'green' },
      scrub: true,
      start: '2%',
      end: '7%',
    },
  });
  scrollAnim(): void {
    this.tlH.fromTo(
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


}

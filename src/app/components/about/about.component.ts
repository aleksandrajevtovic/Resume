import { Component, Inject, OnInit } from '@angular/core';
import gsap from 'gsap';

import ScrollTrigger from 'gsap/ScrollTrigger';
import { DOCUMENT } from '@angular/common';

gsap.registerPlugin(ScrollTrigger);
@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css'],
})
export class AboutComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  tlH = gsap.timeline({
    scrollTrigger: {
      trigger: '.about-page',
      // markers: { startColor: 'yellow', endColor: 'yellow' },
      scrub: true,
      start: '3%',
      end: '15%',
    },
  });

  ngOnInit() {
    this.scrollAnim();
    this.scrollAnimRemove();
  }

  scrollAnim(): void {
    this.tlH.fromTo('.hero h1', { opacity: 1 }, { opacity: 0 });
    this.tlH.fromTo(
      '.highlight',
      { color: 'rgba(255,255,255,0.2' },
      { color: 'rgba(255,255,255,1', stagger: 1 }
    );
  }

  tlHRemove = gsap.timeline({
    scrollTrigger: {
      trigger: '.about-page',
 // markers: { startColor: 'pink', endColor: 'pink' },
      scrub: true,
      start: '7%',
      end: '20%',
    },
  });

  scrollAnimRemove(): void {
    this.tlHRemove.to('.highlight', { color: 'rgba(255,255,255,0.4', stagger: 1 });
  }

}

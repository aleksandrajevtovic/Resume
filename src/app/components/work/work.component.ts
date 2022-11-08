import { Component, OnInit } from '@angular/core';
import gsap from 'gsap';

import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
  selector: 'app-work',
  templateUrl: './work.component.html',
  styleUrls: ['./work.component.css'],
})
export class WorkComponent implements OnInit {
  constructor() {}

  ngOnInit() {
    this.scrollPinAnim();
    this.scrollRevealFromBottom();
  }
  tlScrollPin1: any;
  scrollPinAnim(): void {
    this.tlScrollPin1 = gsap.timeline({
      scrollTrigger: {
        trigger: '#about',
        start: '35%',
        end: '100%',
        pin: true,
        pinSpacing: false,
      },
    });
    this.tlScrollPin1.to('#projects', {
      backgroundColor: '#2e2e4c',
      position: 'relative',
      zIndex: '2',
    });
  }

  tlScrRev1: any;
  tlScrRev2: any;
  tlScrRev3: any;
  tlScrRev4: any;
  tlScrRev5: any;
  scrollRevealFromBottom(): void {
    this.tlScrRev1 = gsap.timeline({
      scrollTrigger: {
        trigger: '.flex-section-1',
        start: 'top bottom',
        end: 'center 85%',
        scrub: 1,
      },
    });
    this.tlScrRev1.fromTo(
      '.flex-section-1',
      { y: 100, autoAlpha: 0 },
      { y: 0, autoAlpha: 1 }
    );

    this.tlScrRev2 = gsap.timeline({
      scrollTrigger: {
        trigger: '.flex-section-2',
        start: 'top bottom',
        end: 'center 85%',
        scrub: 1,
      },
    });
    this.tlScrRev2.fromTo(
      '.flex-section-2',
      { y: 150, autoAlpha: 0 },
      { y: 0, autoAlpha: 1 }
    );

    this.tlScrRev3 = gsap.timeline({
      scrollTrigger: {
        trigger: '.flex-section-3',
        start: 'top bottom',
        end: 'center 85%',
        scrub: 1,
      },
    });
    this.tlScrRev3.fromTo(
      '.flex-section-3',
      { y: 150, autoAlpha: 0 },
      { y: 0, autoAlpha: 1 }
    );

    this.tlScrRev4 = gsap.timeline({
      scrollTrigger: {
        trigger: '.flex-section-4',
        start: 'top bottom',
        end: 'center 85%',
        scrub: 1,
      },
    });
    this.tlScrRev4.fromTo(
      '.flex-section-4',
      { y: 150, autoAlpha: 0 },
      { y: 0, autoAlpha: 1 }
    );

    this.tlScrRev5 = gsap.timeline({
      scrollTrigger: {
        trigger: '.flex-section-5',
        start: 'top bottom',
        end: 'center 85%',
        scrub: 1,
      },
    });
    this.tlScrRev5.fromTo(
      '.flex-section-5',
      { y: 150, autoAlpha: 0 },
      { y: 0, autoAlpha: 1 }
    );


  }
  // flex-section-1
}

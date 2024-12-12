import { Component, Inject, OnInit } from '@angular/core';
import gsap from 'gsap';

import ScrollTrigger from 'gsap/ScrollTrigger';
import { DOCUMENT } from '@angular/common';

gsap.registerPlugin(ScrollTrigger);
@Component({
    selector: 'app-about',
    templateUrl: './about.component.html',
    styleUrls: ['./about.component.css'],
    standalone: false
})
export class AboutComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {}

  // const matches = this.document.querySelectorAll(".highlight");
  // target= this.target.forEach((".highlight") => {
  //   tl=gsap.to(".highlight", {
  //     backgroundPositionX: "0%",
  //     stagger: 1,
  //     scrollTrigger: {
  //       trigger: ".highlight",
  //       scrub: true,
  //       start: "top center",
  //       end: "bottom 40%",
  //     },
  //   });
  // });

  ngOnInit() {
    this.scrollAboutText();
    // this.scrollAnimRemove();
  }
  scrollAboutText(): void {
    const matches = this.document.querySelectorAll('.highlight');

    matches.forEach((target) => {
      gsap.to('.highlight', {
        backgroundPositionX: '0%',
        stagger: 1,
        scrollTrigger: {
          trigger: '.highlight',
          scrub: true,
          start: 'top center',
          end: 'bottom 0%',
        },
      });
    });
  }

  // tlHRemove = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: '.about-page',
  // markers: { startColor: 'pink', endColor: 'pink' },
  //     scrub: true,
  //     start: '7%',
  //     end: '20%',
  //   },
  // });

  // scrollAnimRemove(): void {
  //   this.tlHRemove.to('.highlight', { color: 'rgba(255,255,255,0.4', stagger: 1 });
  // }
}

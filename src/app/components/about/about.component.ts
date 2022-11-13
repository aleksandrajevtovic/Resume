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

  // tlH = gsap.timeline({
  //   scrollTrigger: {
  //     trigger: '.about-page',
  // markers: { startColor: 'yellow', endColor: 'yellow' },
  //     scrub: true,
  //     start: '3%',
  //     end: '15%',
  //   },
  // });
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
    // this.scrollAnim();
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
          end: 'bottom 20%',
        },
      });
    });
  }

  // scrollAnim(): void {
  //   this.tlH.fromTo('.hero h1', { opacity: 1 }, { opacity: 0 });
  //   this.tlH.fromTo(
  //     '.highlight',
  //     { color: 'rgba(255,255,255,0.2' },
  //     { color: 'rgba(255,255,255,1', stagger: 1 }
  //   );
  // }

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

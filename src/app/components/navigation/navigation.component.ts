import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

@Component({
    selector: 'app-navigation',
    templateUrl: './navigation.component.html',
    styleUrls: ['./navigation.component.css'],
    standalone: false
})
export class NavigationComponent implements OnInit {
  constructor(@Inject(DOCUMENT) private document: Document) {}
  tl = gsap.timeline({
    defaults: { duration: 0.75, reversed: true, ease: 'Power2.easeOut' },
  });

  ngOnInit() {
    this.navAnim();
  }

  navAnim(): void {
    this.tl.fromTo(
      '.nav-small',
      { opacity: 0, top: '-100%' },
      { opacity: 1, top: '0%' }
    );
  }
  openMenu() {
    // this.tl.reversed() ? this.tl.play() : this.tl.reverse();
    this.tl.reversed() ? this.tl.play() : this.tl.reverse();
    return console.log('clicked');
  }
  closeMenu() {
    this.tl.reversed() ? this.tl.play() : this.tl.reverse();
    return console.log('closed');
  }
  // closeMenu() {
  //   this.tl.timeScale(2.5);
  // this.tl.reverse();
  //   return console.log('closed');
  // }
}

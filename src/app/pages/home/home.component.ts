import { Component, OnInit } from '@angular/core';
import gsap from 'gsap';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  constructor() {}
  tlLoad = gsap.timeline();

  ngOnInit(): void {
    this.preloaderAnim();
  }

  preloaderAnim(): void {
    this.tlLoad.to('.wave-animation', {
      delay: 2.5,
      duration: 0.5,
      opacity: 0,
    });
    this.tlLoad.to('.preloader', {
      delay: 0.7,
      duration: 1,
      y: '100%',
      ease: 'power4.out',
    });
    this.tlLoad.to('.preloader', {
      zIndex: -1,
    });
  }
}

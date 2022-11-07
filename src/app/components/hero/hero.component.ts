import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrls: ['./hero.component.css'],
})
export class HeroComponent implements OnInit {
  constructor(public translate: TranslateService) {
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
  }
}

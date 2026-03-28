import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ContentService } from '../../services/content.service';

@Component({
    selector: 'app-contact',
    templateUrl: './contact.component.html',
    styleUrls: ['./contact.component.css'],
    standalone: false
})
export class ContactComponent implements OnInit {
  contentMap: Record<string, string> = {};

  constructor(
    private readonly contentService: ContentService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.contentService.getPublicContentMap().subscribe({
      next: (contentMap) => (this.contentMap = contentMap),
      error: () => undefined,
    });
  }

  getContactText(part: 'P1' | 'P2' | 'BTN'): string {
    const currentLang = (this.translate.currentLang || localStorage.getItem('lang') || 'EN').toUpperCase();
    const key = `CONTACT.${currentLang}.${part}`;
    const adminValue = this.contentMap[key];

    if (adminValue?.trim()) {
      return adminValue;
    }

    return this.translate.instant(`CONTACT.${part}`);
  }
}

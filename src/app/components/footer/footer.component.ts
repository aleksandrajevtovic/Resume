import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';

@Component({
    selector: 'app-footer',
    templateUrl: './footer.component.html',
    styleUrls: ['./footer.component.css'],
    standalone: true,
    imports: [CommonModule, RouterModule, TranslateModule]
})
export class FooterComponent implements OnInit {
  @Input() centered = false;
  @Input() showSocial = true;
  @Input() compact = false;
  @Input() showPrivacyLink = true;
  currentYear: number;

  constructor() {
    this.currentYear = new Date().getFullYear();
  }

  ngOnInit(): void {}
}

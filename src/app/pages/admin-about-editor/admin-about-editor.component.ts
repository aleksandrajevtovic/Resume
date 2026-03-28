import { Component, OnInit } from '@angular/core';
import { forkJoin, Observable } from 'rxjs';
import { ContentBlock } from '../../models/content-block';
import { AuthService } from '../../services/auth.service';
import { ContentService } from '../../services/content.service';
import { TranslateService } from '@ngx-translate/core';
import { AdminEditorPageBase } from '../shared/admin-editor-page.base';

interface AboutEditorForm {
  index: number;
  enId?: string;
  deId?: string;
  enValue: string;
  deValue: string;
}

@Component({
  selector: 'app-admin-about-editor',
  templateUrl: './admin-about-editor.component.html',
  styleUrls: ['./admin-about-editor.component.css', '../shared/admin-editor-page.shared.css', '../admin-dashboard/admin-dashboard.component.css'],
  standalone: false,
})
export class AdminAboutEditorComponent extends AdminEditorPageBase implements OnInit {
  loading = true;
  saving = false;
  deleting = false;
  aboutForm: AboutEditorForm = this.emptyAboutForm();

  constructor(
    authService: AuthService,
    private readonly contentService: ContentService,
    private readonly translate: TranslateService
  ) {
    super(authService);
  }

  ngOnInit(): void {
    this.initEditorPage();
    this.loadAboutContent();
  }

  saveAboutContent(): void {
    this.clearMessages();

    const enValue = this.aboutForm.enValue.trim();
    const deValue = this.aboutForm.deValue.trim();

    if (!enValue || !deValue) {
      this.errorMessage = 'Both English and German About text are required.';
      return;
    }

    this.saving = true;

    forkJoin([
      this.upsertContentBlock(this.aboutForm.enId, this.buildAboutContentKey('EN', this.aboutForm.index), enValue),
      this.upsertContentBlock(this.aboutForm.deId, this.buildAboutContentKey('DE', this.aboutForm.index), deValue),
    ]).subscribe({
      next: ([enBlock, deBlock]) => {
        this.saving = false;
        this.aboutForm = {
          index: this.aboutForm.index,
          enId: enBlock.id,
          deId: deBlock.id,
          enValue: enBlock.value,
          deValue: deBlock.value,
        };
        this.successMessage = 'About text saved successfully.';
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Failed to save About text.';
      },
    });
  }

  deleteAboutContent(): void {
    this.clearMessages();
    this.deleting = true;

    const requests: Observable<void>[] = [];
    if (this.aboutForm.enId) {
      requests.push(this.contentService.deleteContentBlock(this.aboutForm.enId));
    }
    if (this.aboutForm.deId) {
      requests.push(this.contentService.deleteContentBlock(this.aboutForm.deId));
    }

    if (!requests.length) {
      this.deleting = false;
      this.loadAboutContent();
      this.successMessage = 'About text reset to translation fallback.';
      return;
    }

    forkJoin(requests).subscribe({
      next: () => {
        this.deleting = false;
        this.loadAboutContent();
        this.successMessage = 'About text deleted.';
      },
      error: () => {
        this.deleting = false;
        this.errorMessage = 'Failed to delete About text.';
      },
    });
  }

  private loadAboutContent(): void {
    this.loading = true;
    this.clearMessages();

    forkJoin({
      blocks: this.contentService.getAdminContentBlocks(),
      en: this.translate.getTranslation('EN'),
      de: this.translate.getTranslation('DE'),
    }).subscribe({
      next: ({ blocks, en, de }) => {
        this.aboutForm = this.mapAboutFormFromBlocks(blocks, en?.ABOUT ?? {}, de?.ABOUT ?? {});
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage =
          'Failed to load About text. Check backend /api/admin/content permissions.';
      },
    });
  }

  private mapAboutFormFromBlocks(
    blocks: ContentBlock[],
    enAbout: Record<string, string>,
    deAbout: Record<string, string>
  ): AboutEditorForm {
    const enBlock = blocks.find((block) => block.key === 'ABOUT.EN.SPAN1');
    const deBlock = blocks.find((block) => block.key === 'ABOUT.DE.SPAN1');

    return {
      index: 1,
      enId: enBlock?.id,
      deId: deBlock?.id,
      enValue: enBlock?.value ?? enAbout['SPAN1'] ?? '',
      deValue: deBlock?.value ?? deAbout['SPAN1'] ?? '',
    };
  }

  private upsertContentBlock(id: string | undefined, key: string, value: string) {
    return id
      ? this.contentService.updateContentBlock(id, { key, value })
      : this.contentService.createContentBlock({ key, value });
  }

  private buildAboutContentKey(lang: 'EN' | 'DE', index: number): string {
    return `ABOUT.${lang}.SPAN${index}`;
  }

  private emptyAboutForm(): AboutEditorForm {
    return {
      index: 1,
      enValue: '',
      deValue: '',
    };
  }
}

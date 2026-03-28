import { Component, HostListener, Inject, OnInit } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { forkJoin } from 'rxjs';
import { ContentBlock } from '../../models/content-block';
import { AuthService } from '../../services/auth.service';
import { ContentService } from '../../services/content.service';
import { TranslateService } from '@ngx-translate/core';

interface ContactContentForm {
  enP1Id?: string;
  enP2Id?: string;
  enBtnId?: string;
  deP1Id?: string;
  deP2Id?: string;
  deBtnId?: string;
  enP1: string;
  enP2: string;
  enBtn: string;
  deP1: string;
  deP2: string;
  deBtn: string;
}

@Component({
  selector: 'app-admin-contact-editor',
  templateUrl: './admin-contact-editor.component.html',
  styleUrls: ['./admin-contact-editor.component.css', '../admin-dashboard/admin-dashboard.component.css'],
  standalone: false,
})
export class AdminContactEditorComponent implements OnInit {
  readonly sidebarBreakpoint = 900;
  sidebarExpanded = true;
  isMobileSidebar = false;
  loading = true;
  saving = false;
  deleting = false;
  errorMessage = '';
  successMessage = '';
  contactContent: ContactContentForm = this.emptyContactContent();

  constructor(
    @Inject(DOCUMENT) private readonly document: Document,
    private readonly authService: AuthService,
    private readonly contentService: ContentService,
    private readonly translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.syncSidebarLayout(true);
    this.loadContactContent();
  }

  @HostListener('window:resize')
  onWindowResize(): void {
    this.syncSidebarLayout();
  }

  toggleSidebar(): void {
    this.sidebarExpanded = !this.sidebarExpanded;
  }

  logout(): void {
    this.authService.logout();
    window.location.href = '/admin/login';
  }

  saveContactContent(): void {
    this.clearMessages();

    const payload = {
      enP1: this.contactContent.enP1.trim(),
      enP2: this.contactContent.enP2.trim(),
      enBtn: this.contactContent.enBtn.trim(),
      deP1: this.contactContent.deP1.trim(),
      deP2: this.contactContent.deP2.trim(),
      deBtn: this.contactContent.deBtn.trim(),
    };

    if (Object.values(payload).some((value) => !value)) {
      this.errorMessage = 'All English and German Contact fields are required.';
      return;
    }

    this.saving = true;

    forkJoin([
      this.upsertContentBlock(this.contactContent.enP1Id, 'CONTACT.EN.P1', payload.enP1),
      this.upsertContentBlock(this.contactContent.enP2Id, 'CONTACT.EN.P2', payload.enP2),
      this.upsertContentBlock(this.contactContent.enBtnId, 'CONTACT.EN.BTN', payload.enBtn),
      this.upsertContentBlock(this.contactContent.deP1Id, 'CONTACT.DE.P1', payload.deP1),
      this.upsertContentBlock(this.contactContent.deP2Id, 'CONTACT.DE.P2', payload.deP2),
      this.upsertContentBlock(this.contactContent.deBtnId, 'CONTACT.DE.BTN', payload.deBtn),
    ]).subscribe({
      next: ([enP1, enP2, enBtn, deP1, deP2, deBtn]) => {
        this.saving = false;
        this.contactContent = {
          enP1Id: enP1.id,
          enP2Id: enP2.id,
          enBtnId: enBtn.id,
          deP1Id: deP1.id,
          deP2Id: deP2.id,
          deBtnId: deBtn.id,
          enP1: enP1.value,
          enP2: enP2.value,
          enBtn: enBtn.value,
          deP1: deP1.value,
          deP2: deP2.value,
          deBtn: deBtn.value,
        };
        this.successMessage = 'Contact text saved successfully.';
      },
      error: () => {
        this.saving = false;
        this.errorMessage = 'Failed to save Contact text.';
      },
    });
  }

  deleteContactContent(): void {
    this.clearMessages();
    this.deleting = true;

    const ids = [
      this.contactContent.enP1Id,
      this.contactContent.enP2Id,
      this.contactContent.enBtnId,
      this.contactContent.deP1Id,
      this.contactContent.deP2Id,
      this.contactContent.deBtnId,
    ].filter((id): id is string => !!id);

    if (!ids.length) {
      this.deleting = false;
      this.loadContactContent();
      this.successMessage = 'Contact text reset to translation fallback.';
      return;
    }

    forkJoin(ids.map((id) => this.contentService.deleteContentBlock(id))).subscribe({
      next: () => {
        this.deleting = false;
        this.loadContactContent();
        this.successMessage = 'Contact text deleted.';
      },
      error: () => {
        this.deleting = false;
        this.errorMessage = 'Failed to delete Contact text.';
      },
    });
  }

  dismissSuccessMessage(): void {
    this.successMessage = '';
  }

  dismissErrorMessage(): void {
    this.errorMessage = '';
  }

  private loadContactContent(): void {
    this.loading = true;
    this.clearMessages();

    forkJoin({
      blocks: this.contentService.getAdminContentBlocks(),
      en: this.translate.getTranslation('EN'),
      de: this.translate.getTranslation('DE'),
    }).subscribe({
      next: ({ blocks, en, de }) => {
        this.contactContent = this.mapContactContentFromBlocks(blocks, en?.CONTACT ?? {}, de?.CONTACT ?? {});
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.errorMessage =
          'Failed to load Contact text. Check backend /api/admin/content permissions.';
      },
    });
  }

  private mapContactContentFromBlocks(
    blocks: ContentBlock[],
    enContact: Record<string, string>,
    deContact: Record<string, string>
  ): ContactContentForm {
    const getBlock = (key: string) => blocks.find((block) => block.key === key);
    const enP1 = getBlock('CONTACT.EN.P1');
    const enP2 = getBlock('CONTACT.EN.P2');
    const enBtn = getBlock('CONTACT.EN.BTN');
    const deP1 = getBlock('CONTACT.DE.P1');
    const deP2 = getBlock('CONTACT.DE.P2');
    const deBtn = getBlock('CONTACT.DE.BTN');

    return {
      enP1Id: enP1?.id,
      enP2Id: enP2?.id,
      enBtnId: enBtn?.id,
      deP1Id: deP1?.id,
      deP2Id: deP2?.id,
      deBtnId: deBtn?.id,
      enP1: enP1?.value ?? enContact['P1'] ?? '',
      enP2: enP2?.value ?? enContact['P2'] ?? '',
      enBtn: enBtn?.value ?? enContact['BTN'] ?? '',
      deP1: deP1?.value ?? deContact['P1'] ?? '',
      deP2: deP2?.value ?? deContact['P2'] ?? '',
      deBtn: deBtn?.value ?? deContact['BTN'] ?? '',
    };
  }

  private upsertContentBlock(id: string | undefined, key: string, value: string) {
    return id
      ? this.contentService.updateContentBlock(id, { key, value })
      : this.contentService.createContentBlock({ key, value });
  }

  private emptyContactContent(): ContactContentForm {
    return {
      enP1: '',
      enP2: '',
      enBtn: '',
      deP1: '',
      deP2: '',
      deBtn: '',
    };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private syncSidebarLayout(initial = false): void {
    const nextIsMobile = window.innerWidth < this.sidebarBreakpoint;

    if (initial) {
      this.isMobileSidebar = nextIsMobile;
      this.sidebarExpanded = !nextIsMobile;
      return;
    }

    if (nextIsMobile !== this.isMobileSidebar) {
      this.isMobileSidebar = nextIsMobile;
      this.sidebarExpanded = !nextIsMobile;
      return;
    }

    this.isMobileSidebar = nextIsMobile;
  }
}

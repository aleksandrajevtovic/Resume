import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ContentBlock } from '../../models/content-block';
import { ProjectService } from '../../services/project.service';

type CvLang = 'EN' | 'DE';

@Component({
  selector: 'app-admin-cv-manager',
  templateUrl: './admin-cv-manager.component.html',
  styleUrls: ['./admin-cv-manager.component.css'],
  standalone: true,
  imports: [CommonModule],
})
export class AdminCvManagerComponent {
  @Input() contentBlocks: ContentBlock[] = [];

  @Output() success = new EventEmitter<string>();
  @Output() error = new EventEmitter<string>();
  @Output() refreshRequested = new EventEmitter<void>();

  uploadingLang: CvLang | null = null;
  deletingLang: CvLang | null = null;
  pendingDeleteLang: CvLang | null = null;
  showDeleteModal = false;

  readonly langs: CvLang[] = ['EN', 'DE'];
  private readonly selectedFiles: Partial<Record<CvLang, File | null>> = {};
  readonly uploadStatuses: Partial<Record<CvLang, string>> = {};

  constructor(private readonly projectService: ProjectService) {}

  onFileSelected(lang: CvLang, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files && input.files.length > 0 ? input.files[0] : null;
    this.selectedFiles[lang] = file;
    this.uploadStatuses[lang] = file ? `Selected: ${file.name}` : '';
  }

  uploadSelectedCv(lang: CvLang): void {
    const file = this.selectedFiles[lang];
    if (!file) {
      this.uploadStatuses[lang] = 'Select a PDF first.';
      return;
    }

    this.uploadingLang = lang;
    this.uploadStatuses[lang] = 'Uploading CV...';

    this.projectService.uploadCv(lang, file).subscribe({
      next: () => {
        this.uploadingLang = null;
        this.selectedFiles[lang] = null;
        this.uploadStatuses[lang] = 'CV uploaded successfully.';
        this.success.emit(`${this.getLangLabel(lang)} CV uploaded successfully.`);
        this.refreshRequested.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.uploadingLang = null;
        this.uploadStatuses[lang] = this.mapUploadError(error);
        this.error.emit(this.uploadStatuses[lang] ?? 'CV upload failed.');
      },
    });
  }

  requestDeleteCv(lang: CvLang): void {
    if (!this.getCvBlock(lang)) {
      this.uploadStatuses[lang] = 'No uploaded CV to remove.';
      return;
    }

    this.pendingDeleteLang = lang;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    if (this.deletingLang) {
      return;
    }

    this.pendingDeleteLang = null;
    this.showDeleteModal = false;
  }

  confirmDeleteCv(): void {
    if (!this.pendingDeleteLang) {
      return;
    }

    const lang = this.pendingDeleteLang;
    this.deletingLang = lang;

    this.projectService.deleteCv(lang).subscribe({
      next: () => {
        this.deletingLang = null;
        this.showDeleteModal = false;
        this.pendingDeleteLang = null;
        this.uploadStatuses[lang] = 'CV removed successfully.';
        this.success.emit(`${this.getLangLabel(lang)} CV removed successfully.`);
        this.refreshRequested.emit();
      },
      error: (error: HttpErrorResponse) => {
        this.deletingLang = null;
        this.showDeleteModal = false;
        this.pendingDeleteLang = null;
        const message = this.mapDeleteError(error);
        this.uploadStatuses[lang] = message;
        this.error.emit(message);
      },
    });
  }

  getCvPath(lang: CvLang): string {
    return this.getCvBlock(lang)?.value ?? '';
  }

  getCvUrl(lang: CvLang): string {
    return this.projectService.resolveImageUrl(this.getCvPath(lang));
  }

  hasCv(lang: CvLang): boolean {
    return !!this.getCvPath(lang).trim();
  }

  getDeleteMessage(): string {
    if (!this.pendingDeleteLang) {
      return 'The uploaded CV will be removed permanently.';
    }

    return `${this.getLangLabel(this.pendingDeleteLang)} CV will be removed permanently and cannot be restored.`;
  }

  getLangLabel(lang: CvLang): string {
    return lang === 'EN' ? 'English' : 'German';
  }

  private getCvBlock(lang: CvLang): ContentBlock | undefined {
    const key = lang === 'EN' ? 'CV.EN.FILE' : 'CV.DE.FILE';
    return this.contentBlocks.find((block) => block.key === key);
  }

  private mapUploadError(error: HttpErrorResponse): string {
    if (error.status === 413) {
      return 'CV is too large. Max allowed is 10MB.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'CV upload unauthorized. Please log in again.';
    }
    if (error.status === 0) {
      return 'Backend is unreachable.';
    }

    const backendMessage =
      typeof error.error === 'string'
        ? error.error
        : error.error?.message || error.error?.error || '';

    return backendMessage ? `CV upload failed: ${backendMessage}` : 'CV upload failed.';
  }

  private mapDeleteError(error: HttpErrorResponse): string {
    if (error.status === 404) {
      return 'Uploaded CV was not found.';
    }
    if (error.status === 401 || error.status === 403) {
      return 'CV removal unauthorized. Please log in again.';
    }
    if (error.status === 0) {
      return 'Backend is unreachable.';
    }

    const backendMessage =
      typeof error.error === 'string'
        ? error.error
        : error.error?.message || error.error?.error || '';

    return backendMessage ? `CV removal failed: ${backendMessage}` : 'CV removal failed.';
  }
}

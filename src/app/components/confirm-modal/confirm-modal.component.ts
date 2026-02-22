import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css'],
  standalone: false,
})
export class ConfirmModalComponent {
  @Input() open = false;
  @Input() title = 'Confirm action';
  @Input() message = '';
  @Input() warningTitle = 'Warning:';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() busy = false;
  @Input() closeDisabled = false;

  @Output() confirm = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  onBackdropClick(): void {
    if (this.closeDisabled) {
      return;
    }
    this.close.emit();
  }

  onClose(): void {
    if (this.closeDisabled) {
      return;
    }
    this.close.emit();
  }

  onConfirm(): void {
    this.confirm.emit();
  }
}

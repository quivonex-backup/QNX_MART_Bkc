import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MARKETING_PARTNER_TERMS } from './marketing-partner-terms';

@Component({
  selector: 'app-terms-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-modal.component.html'
})
export class TermsModalComponent {
  @Input() role: string = '';
  @Output() close = new EventEmitter<void>();

  get title(): string {
    return 'Marketing Partner Terms & Conditions';
  }

  get termsContent(): string {
    return MARKETING_PARTNER_TERMS;
  }

  onClose() {
    this.close.emit();
  }
}
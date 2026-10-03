import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { COMPANY_TERMS } from './company-terms';

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
    return 'Company Terms & Conditions';
  }

  get termsContent(): string {
    return COMPANY_TERMS;
  }

  onClose() {
    this.close.emit();
  }
}
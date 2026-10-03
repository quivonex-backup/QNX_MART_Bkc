import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MARKETING_PARTNER_TERMS } from './marketing-partner-terms';
import { COMPANY_TERMS } from './company-terms';
import { CUSTOMER_TERMS } from './customer-terms';

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
    switch (this.role) {
      case 'marketing-partner': return 'Marketing Partner Terms & Conditions';
      case 'company': return 'Company Terms & Conditions';
      case 'customer': return 'Customer Terms & Conditions';
      default: return 'Terms & Conditions';
    }
  }

  get termsContent(): string {
    switch (this.role) {
      case 'marketing-partner': return MARKETING_PARTNER_TERMS;
      case 'company': return COMPANY_TERMS;
      case 'customer': return CUSTOMER_TERMS;
      default: return '<p>Select a role to view terms.</p>';
    }
  }

  onClose() {
    this.close.emit();
  }
}
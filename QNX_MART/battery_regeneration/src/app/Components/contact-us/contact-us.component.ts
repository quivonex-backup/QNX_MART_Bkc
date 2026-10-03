import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ContactService } from '../../../services/contact.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-contact-us',
  imports: [FormsModule, CommonModule],
  templateUrl: './contact-us.component.html',
  styleUrl: './contact-us.component.css'
})
export class ContactUsComponent {

  formData = {
    name: '',
    phone: '',
    email: '',
    subject: '',
    message: ''
  };
  isSubmitting = false;

  constructor(private contactService: ContactService, private alertService: AlertService) { }

  submitForm() {

    if (this.isSubmitting) return;   // 👈 double safety

    this.isSubmitting = true;


    this.contactService.sendMessage(this.formData).subscribe({
      next: (res) => {
        console.log('API Response:', res);

        if (res.status) {
          this.alertService.unialert(res.message);   // "Your message has been sent successfully"
          window.location.reload();

          // Reset form
          this.formData = {
            name: '',
            phone: '',
            email: '',
            subject: '',
            message: ''
          };
        }
      },
      error: (err) => {
        console.log("Full Error:", err);
        console.log("Error Body:", err.error);
      },
      complete: () => {
        this.isSubmitting = false;   // 👈 re-enable button
      }
    });
  }

  allowOnlyName(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^a-zA-Z ]/g, '');

    this.formData.name = input.value;
  }

  allowOnlyNumber(event: Event): void {
    const input = event.target as HTMLInputElement;

    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 10);

    this.formData.phone = input.value;
  }

  focusNext(event: Event, nextField: string): void {
    event.preventDefault();

    const element = document.querySelector(
      `[name="${nextField}"]`
    ) as HTMLElement | null;

    if (element) {
      element.focus();
    }
  }
}
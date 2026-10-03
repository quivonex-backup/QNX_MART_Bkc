import { CommonModule, Location  } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-terms-n-conditions',
  imports: [CommonModule, FormsModule],
  templateUrl: './terms-n-conditions.component.html',
  styleUrl: './terms-n-conditions.component.css'
})


export class TermsAndConditionsComponent {
  constructor(private location: Location) {}

  goBack(): void {
    this.location.back();
  }
}

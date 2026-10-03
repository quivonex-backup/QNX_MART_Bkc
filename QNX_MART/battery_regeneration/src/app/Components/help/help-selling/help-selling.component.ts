import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-help-selling',
  imports: [FormsModule,CommonModule],
  templateUrl: './help-selling.component.html',
  styleUrl: './help-selling.component.css'
})
export class HelpSellingComponent {

constructor(private router: Router) {}

goToSell() {
  this.router.navigate(['/add_products']); 
}

}

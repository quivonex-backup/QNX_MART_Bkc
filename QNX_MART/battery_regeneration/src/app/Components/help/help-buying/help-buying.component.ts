import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-help-buying',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './help-buying.component.html',
  styleUrl: './help-buying.component.css'
})
export class HelpBuyingComponent {

}

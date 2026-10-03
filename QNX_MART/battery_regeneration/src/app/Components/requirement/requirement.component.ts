import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-requirement',
  imports: [FormsModule,CommonModule],
  templateUrl: './requirement.component.html',
  styleUrl: './requirement.component.css'
})


export class RequirementComponent {

submitRequirement(form:any){

if(form.valid){

console.log("Requirement Data",form.value);

alert("Requirement Submitted Successfully");

form.reset();

}

}
}

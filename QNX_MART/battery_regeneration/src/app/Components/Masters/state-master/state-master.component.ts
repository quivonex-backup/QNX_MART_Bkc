import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { StateMasterService } from '../../../../services/State-Master/state-master.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-state-master',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './state-master.component.html',
  styleUrl: './state-master.component.css'
})
export class StateMasterComponent implements OnInit {

  stateForm!: FormGroup;
  states: any[] = [];
  isEditMode = false;
  selectedStateId: number | null = null;

  constructor(
    private fb: FormBuilder,
    private stateService: StateMasterService,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.stateForm = this.fb.group({
      state_code: ['', Validators.required],
      state_name: ['', Validators.required]
    });

    this.loadStates();
  }

  loadStates() {
    this.stateService.getAllStates().subscribe(res => {
      if (res.status === 'success') {
        this.states = res.data;
      }
    });
  }
  

  onSubmit() {

    if (this.stateForm.invalid) {
      this.stateForm.markAllAsTouched();
      return;
    }

    if (this.isEditMode && this.selectedStateId) {

      this.stateService.updateState(this.selectedStateId, this.stateForm.value)
        .subscribe(() => {
          this.resetForm();
          this.loadStates();
        });

    } else {

      this.stateService.createState(this.stateForm.value)
        .subscribe(() => {
          this.resetForm();
          this.loadStates();
        });
    }
  }

  editState(state: any) {
    this.isEditMode = true;
    this.selectedStateId = state.id;
    this.stateForm.patchValue({
      state_code: state.state_code,
      state_name: state.state_name
    });
  }

deleteState(id: number) {

  if (confirm('Are you sure to delete this state?')) {

    this.stateService.deleteState(id).subscribe({
      next: (res) => {

        if (res.status === 'success') {
          this.alertService.unialert(res.msg);
          this.loadStates();  // table refresh
        }

      },
      error: (err) => {
        console.error(err);
        this.alertService.unialert('Delete failed');
      }
    });

  }
}


  resetForm() {
    this.stateForm.reset();
    this.isEditMode = false;
    this.selectedStateId = null;
  }
}

  // stateForm: FormGroup;
  // successMessage = '';
  // errorMessage = '';
  // isSubmitting = false;

  // constructor(
  //   private fb: FormBuilder,
  //   private stateService: StateMasterService
  // ) {
  //   this.stateForm = this.fb.group({
  //     state_code: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(3)]],
  //     state_name: ['', [Validators.required, Validators.minLength(3)]]
  //   });
  // }

  // // Helper method to check if field is invalid
  // isFieldInvalid(fieldName: string): boolean {
  //   const field = this.stateForm.get(fieldName);
  //   return field ? (field.invalid && (field.dirty || field.touched)) : false;
  // }

  // // Reset form method
  // resetForm(): void {
  //   this.stateForm.reset();
  //   this.errorMessage = '';
  //   this.successMessage = '';
  //   Object.keys(this.stateForm.controls).forEach(key => {
  //     const control = this.stateForm.get(key);
  //     control?.markAsUntouched();
  //     control?.markAsPristine();
  //   });
  // }

  // onSubmit(): void {
  //   if (this.stateForm.invalid) {
  //     // Mark all fields as touched to show validation messages
  //     Object.keys(this.stateForm.controls).forEach(key => {
  //       const control = this.stateForm.get(key);
  //       control?.markAsTouched();
  //     });
      
  //     this.errorMessage = 'Please fill all required fields correctly';
      
  //     // Auto hide error after 5 seconds
  //     setTimeout(() => {
  //       if (this.errorMessage === 'Please fill all required fields correctly') {
  //         this.errorMessage = '';
  //       }
  //     }, 5000);
      
  //     return;
  //   }

  //   this.isSubmitting = true;
  //   this.errorMessage = '';
  //   this.successMessage = '';

  //   // Trim input values
  //   const formValue = {
  //     state_code: this.stateForm.value.state_code.trim().toUpperCase(),
  //     state_name: this.stateForm.value.state_name.trim()
  //   };

  //   this.stateService.createState(formValue).subscribe({
  //     next: (res) => {
  //       this.isSubmitting = false;

  //       if (res.status === 'success') {
  //         this.successMessage = res.msg || 'State created successfully!';
  //         this.stateForm.reset();
          
  //         // Auto hide success message after 3 seconds
  //         setTimeout(() => {
  //           this.successMessage = '';
  //         }, 3000);
  //       } else {
  //         this.errorMessage = res.msg || 'Failed to create state';
  //       }
  //     },
  //     error: (err) => {
  //       this.isSubmitting = false;
  //       this.errorMessage = err.error?.msg || 'Failed to create state. Please try again.';
  //       console.error('Error creating state:', err);
        
  //       // Auto hide error after 5 seconds
  //       setTimeout(() => {
  //         this.errorMessage = '';
  //       }, 5000);
  //     }
  //   });
  // }
// }


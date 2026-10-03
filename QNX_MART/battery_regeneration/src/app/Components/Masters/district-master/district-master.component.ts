import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { DistrictMasterService } from '../../../../services/State-Master/district-master.service';
import { StateMasterService } from '../../../../services/State-Master/state-master.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-district-master',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './district-master.component.html',
  styleUrl: './district-master.component.css'
})
export class DistrictMasterComponent implements OnInit {

  districtForm!: FormGroup;
  states: any[] = [];
  districts: any[] = [];

  constructor(
    private fb: FormBuilder,
    private districtService: DistrictMasterService,
    private stateService: StateMasterService,
    private alertService: AlertService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadStates();
    this.loadDistricts();
  }

  initForm() {
    this.districtForm = this.fb.group({
      district_name: ['', Validators.required],
      state: ['', Validators.required],
      is_active: [true],
      flag: [true]
    });
  }

  // Load States for dropdown
  loadStates() {
    this.stateService.getAllStates().subscribe((res: any) => {
      this.states = res.data;
    });
  }

  // Load District Table
  loadDistricts() {
    this.districtService.getAllDistricts().subscribe((res: any) => {
      this.districts = res.data;
    });
  }

  // Submit Form
  onSubmit() {
    if (this.districtForm.valid) {

      this.districtService.createDistrict(this.districtForm.value)
        .subscribe((res: any) => {

          if (res.status === 'success') {
            this.alertService.unialert(res.msg);

            this.districtForm.reset({
              is_active: true,
              flag: true
            });

            // 🔥 Auto reload table after create
            this.loadDistricts();
          }
        });
    }
  }
}

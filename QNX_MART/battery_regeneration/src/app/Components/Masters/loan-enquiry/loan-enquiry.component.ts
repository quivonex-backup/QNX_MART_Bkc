import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BankService } from '../../../../services/bank.service';
import { StateMasterService } from '../../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../../services/State-Master/district-master.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-loan-enquiry',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './loan-enquiry.component.html',
  styleUrls: ['./loan-enquiry.component.css']
})
export class LoanEnquiryComponent implements OnInit {

  isSubmitting = false;

  states: any[] = [];
  districts: any[] = [];
  loadingDistricts = false;

  // Only fields required by the new API
  enquiry: any = {
    name: '',
    mobile: '',
    email: '',
    loan_type: '',
    loan_amount: '',
    tenure_years: '',
    monthly_income: '',
    state_id: '',
    city_id: '',
    pincode: '',
    remarks: ''
  };

  constructor(
    private bankService: BankService,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService,
    private alertService: AlertService
  ) { }

  ngOnInit(): void {
    this.loadStates();
  }

  // ================= STATES =================
  loadStates() {
    this.stateService.getAllStates().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.states = res.data || [];
        }
      },
      error: () => {
        console.error('Failed to load states.');
      }
    });
  }

  // ================= STATE CHANGE =================
  onStateChange() {
    this.districts = [];
    this.enquiry.city_id = '';
    if (!this.enquiry.state_id) return;

    this.loadingDistricts = true;
    this.districtService.getDistrictsByState(Number(this.enquiry.state_id)).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.districts = res.data || [];
        }
        this.loadingDistricts = false;
      },
      error: () => {
        this.loadingDistricts = false;
        console.error('Failed to load districts.');
      }
    });
  }

  // ================= HELPERS =================
  getStateName(id: any): string {
    const state = this.states.find(s => s.id == id);
    return state ? state.state_name : '';
  }

  getCityName(id: any): string {
    const city = this.districts.find(d => d.id == id);
    return city ? city.district_name : '';
  }

  // ================= GO BACK =================
  goBack(): void {
    window.history.back();
  }

  // ================= CLEAR FORM =================
  clearForm() {
    this.enquiry = {
      name: '',
      mobile: '',
      email: '',
      loan_type: '',
      loan_amount: '',
      tenure_years: '',
      monthly_income: '',
      state_id: '',
      city_id: '',
      pincode: '',
      remarks: ''
    };
    this.districts = [];
  }

  // ================= NAME VALIDATION =================
  removeNameNumbers(): void {
    if (this.enquiry.name) {
      this.enquiry.name = this.enquiry.name
        .replace(/[^A-Za-z .'-]/g, '')
        .replace(/\s{2,}/g, ' ');
    }
  }


  // ================= MOBILE VALIDATION =================
  validateMobileInput(): void {
    if (this.enquiry.mobile) {
      this.enquiry.mobile = this.enquiry.mobile
        .replace(/\D/g, '')
        .substring(0, 10);
    }
  }


  // ================= PINCODE VALIDATION =================
  validatePincodeInput(): void {
    if (this.enquiry.pincode) {
      this.enquiry.pincode = this.enquiry.pincode
        .replace(/\D/g, '')
        .substring(0, 6);
    }
  }

  goToNext(event: Event): void {
  event.preventDefault();

  const current = event.target as HTMLElement;

  const form = current.closest('form');

  if (!form) {
    return;
  }

  const focusableElements = Array.from(
    form.querySelectorAll<HTMLElement>(
      'input:not([disabled]):not([readonly]), ' +
      'select:not([disabled]), ' +
      'textarea:not([disabled]), ' +
      'button:not([disabled])'
    )
  );

  const currentIndex = focusableElements.indexOf(current);

  if (
    currentIndex !== -1 &&
    currentIndex < focusableElements.length - 1
  ) {
    focusableElements[currentIndex + 1].focus();
  }
}

  // ================= SUBMIT =================
  submitForm() {
    // Required fields validation
    // if (!this.enquiry.name || !this.enquiry.mobile || !this.enquiry.email ||
    //   !this.enquiry.loan_type || !this.enquiry.loan_amount ||
    //   !this.enquiry.tenure_years || !this.enquiry.monthly_income ||
    //   !this.enquiry.state_id || !this.enquiry.city_id || !this.enquiry.pincode) {
    //   this.alertService.unialert('Please fill all required fields.');
    //   return;
    // }


    // ================= NAME =================
    const name = (this.enquiry.name || '').trim();

    if (!name) {
      this.alertService.unialert('Please enter your full name.');
      return;
    }

    if (!/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/.test(name)) {
      this.alertService.unialert(
        'Full name should contain only letters and spaces.'
      );
      return;
    }

    if (name.length < 2) {
      this.alertService.unialert(
        'Full name must contain at least 2 characters.'
      );
      return;
    }


    // ================= MOBILE =================
    const mobile = String(this.enquiry.mobile || '').trim();

    if (!mobile) {
      this.alertService.unialert('Please enter your mobile number.');
      return;
    }

    if (!/^[6-9][0-9]{9}$/.test(mobile)) {
      this.alertService.unialert(
        'Please enter a valid 10-digit mobile number starting with 6-9.'
      );
      return;
    }


    // ================= EMAIL =================
    const email = String(this.enquiry.email || '').trim();

    if (!email) {
      this.alertService.unialert('Please enter your email address.');
      return;
    }

    const emailPattern =
      /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    if (!emailPattern.test(email)) {
      this.alertService.unialert(
        'Please enter a valid email address.'
      );
      return;
    }


    // ================= LOAN TYPE =================
    if (!this.enquiry.loan_type) {
      this.alertService.unialert(
        'Please select a loan type.'
      );
      return;
    }


    // ================= LOAN AMOUNT =================
    const loanAmount = Number(this.enquiry.loan_amount);

    if (!this.enquiry.loan_amount && this.enquiry.loan_amount !== 0) {
      this.alertService.unialert(
        'Please enter loan amount.'
      );
      return;
    }

    if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
      this.alertService.unialert(
        'Loan amount must be greater than 0.'
      );
      return;
    }


    // ================= TENURE =================
    const tenure = Number(this.enquiry.tenure_years);

    if (!this.enquiry.tenure_years && this.enquiry.tenure_years !== 0) {
      this.alertService.unialert(
        'Please enter loan tenure.'
      );
      return;
    }

    if (
      !Number.isInteger(tenure) ||
      tenure < 1 ||
      tenure > 30
    ) {
      this.alertService.unialert(
        'Tenure must be between 1 and 30 years.'
      );
      return;
    }


    // ================= MONTHLY INCOME =================
    const monthlyIncome = Number(this.enquiry.monthly_income);

    if (
      !this.enquiry.monthly_income &&
      this.enquiry.monthly_income !== 0
    ) {
      this.alertService.unialert(
        'Please enter your monthly income.'
      );
      return;
    }

    if (!Number.isFinite(monthlyIncome) || monthlyIncome <= 0) {
      this.alertService.unialert(
        'Monthly income must be greater than 0.'
      );
      return;
    }


    // ================= STATE =================
    if (!this.enquiry.state_id) {
      this.alertService.unialert(
        'Please select state.'
      );
      return;
    }


    // ================= CITY =================
    if (!this.enquiry.city_id) {
      this.alertService.unialert(
        'Please select city/district.'
      );
      return;
    }


    // ================= PINCODE =================
    const pincode = String(this.enquiry.pincode || '').trim();

    if (!pincode) {
      this.alertService.unialert(
        'Please enter pincode.'
      );
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(pincode)) {
      this.alertService.unialert(
        'Please enter a valid 6-digit pincode.'
      );
      return;
    }

    this.isSubmitting = true;

    // Build payload matching the new API request schema
    const payload = {
      name: this.enquiry.name,
      mobile: this.enquiry.mobile,
      email: this.enquiry.email,
      loan_type: this.enquiry.loan_type,
      loan_amount: Number(this.enquiry.loan_amount),      // send as number
      tenure_years: Number(this.enquiry.tenure_years),
      monthly_income: Number(this.enquiry.monthly_income),
      city: this.getCityName(this.enquiry.city_id),
      state: this.getStateName(this.enquiry.state_id),
      pincode: this.enquiry.pincode,
      remarks: this.enquiry.remarks || ''
    };

    this.bankService.createLoanEnquiry(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.alertService.unialert(res.message || 'Enquiry submitted successfully!');
        this.clearForm();
      },
      error: (err) => {
        this.isSubmitting = false;
        const backendMsg = err.error?.message || err.error?.error || 'Submission failed. Please try again.';
        this.alertService.unialert(backendMsg);
      }
    });
  }
}
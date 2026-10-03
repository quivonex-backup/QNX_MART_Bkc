import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Location } from '@angular/common';
import { ProductService } from '../../../services/product.service';
import { AlertService } from '../../../services/alert.service';
import { StateMasterService } from '../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../services/State-Master/district-master.service';

@Component({
  selector: 'app-franchise-apply',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './franchise-apply.component.html',
  styleUrls: ['./franchise-apply.component.css']
})
export class FranchiseApplyComponent implements OnInit {
  productSlug: string = '';
  plans: any[] = [];
  selectedPlanId: number | null = null;

  loading = false;
  submitting = false;
  error = '';

  userId: number | null = null;

  // Location data
  states: any[] = [];
  districts: any[] = [];
  talukas: any[] = [];
  villages: any[] = [];

  // Referral code (hidden from UI)
  referralCode: string | null = null;

  // Auto‑generated franchise code (shown in UI)
  franchiseCode: string = '';

  // Form model – removed commission_percentage
  franchiseForm = {
    franchise_name: '',
    owner_name: '',
    email: '',
    mobile_no: '',
    alternate_mobile_no: '',
    address: '',
    city: '',
    state_id: '',
    state_name: '',
    district_id: '',
    district_name: '',
    taluka_id: '',
    taluka_name: '',
    village_id: '',
    village_name: '',
    pincode: '',
    gst_no: '',
    pan_no: '',
    joining_date: new Date().toISOString().split('T')[0],
    franchise_referral_code: ''  // stored but not shown
  };

  validationErrors: any = {};

  // Track copied state
  copySuccess = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private productService: ProductService,
    private alertService: AlertService,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService
  ) {}

  ngOnInit() {
    // ============================================
    // LOGIN CHECK – COMMENTED OUT
    // ============================================
    // Authentication
    // const userId = sessionStorage.getItem('user_id');
    // if (userId) {
    //   this.userId = Number(userId);
    // } else {
    //   this.alertService.unialert('Please login to apply for franchise.');
    //   sessionStorage.setItem('returnUrl', this.router.url);
    //   this.router.navigate(['/login']);
    //   return;
    // }

    // Generate franchise code
    this.generateFranchiseCode();

    // Load states
    this.loadStates();

    // Read query params
    this.route.queryParams.subscribe(params => {
      this.productSlug = params['product'] || '';

      // Read referral code (hidden)
      const ref = params['ref_code'] || '';
      if (ref) {
        this.referralCode = ref;
        localStorage.setItem('franchise_referral_code', ref);
        this.franchiseForm.franchise_referral_code = ref;
      } else {
        this.referralCode = localStorage.getItem('franchise_referral_code');
        if (this.referralCode) {
          this.franchiseForm.franchise_referral_code = this.referralCode;
        }
      }

      if (this.productSlug) {
        this.loadPlans();
      } else {
        this.error = 'No product specified.';
        this.alertService.unialert('Product slug is missing. Please go back and try again.');
      }
    });
  }

  generateFranchiseCode() {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.franchiseCode = `FR-${timestamp}${random}`;
  }

  copyFranchiseCode() {
    navigator.clipboard.writeText(this.franchiseCode).then(() => {
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2000);
    }).catch(() => {
      // Fallback
      const input = document.createElement('input');
      input.value = this.franchiseCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      this.copySuccess = true;
      setTimeout(() => this.copySuccess = false, 2000);
    });
  }

  // ================= LOCATION =================
  loadStates() {
    this.stateService.getAllStates().subscribe({
      next: (res: any) => {
        if (res.status) this.states = res.data || [];
      },
      error: (err: any) => console.error(err)
    });
  }

  onStateChange() {
    this.districts = [];
    this.talukas = [];
    this.villages = [];
    this.franchiseForm.district_id = '';
    this.franchiseForm.taluka_id = '';
    this.franchiseForm.village_id = '';
    if (!this.franchiseForm.state_id) return;
    this.districtService.getDistrictsByState(Number(this.franchiseForm.state_id))
      .subscribe({ next: (res: any) => { if (res.status) this.districts = res.data || []; } });
  }

  onDistrictChange() {
    this.talukas = [];
    this.villages = [];
    this.franchiseForm.taluka_id = '';
    this.franchiseForm.village_id = '';
    if (!this.franchiseForm.district_id) return;
    this.districtService.getTalukas(
      Number(this.franchiseForm.state_id),
      Number(this.franchiseForm.district_id)
    ).subscribe({ next: (res: any) => { if (res.status) this.talukas = res.data || []; } });
  }

  onTalukaChange() {
    this.villages = [];
    this.franchiseForm.village_id = '';
    if (!this.franchiseForm.taluka_id) return;
    this.districtService.getVillages(
      Number(this.franchiseForm.state_id),
      Number(this.franchiseForm.district_id),
      Number(this.franchiseForm.taluka_id)
    ).subscribe({ next: (res: any) => { if (res.status) this.villages = res.data || []; } });
  }

  getStateName(id: any) { return this.states.find(s => s.id == id)?.state_name || ''; }
  getDistrictName(id: any) { return this.districts.find(d => d.id == id)?.district_name || ''; }
  getTalukaName(id: any) { return this.talukas.find(t => t.id == id)?.taluka_name || ''; }
  getVillageName(id: any) { return this.villages.find(v => v.id == id)?.village_name || ''; }

  // ================= PLANS =================
  loadPlans() {
    this.loading = true;
    this.error = '';
    this.productService.getProductFranchisePlans(this.productSlug).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status) {
          this.plans = res.data || [];
          if (this.plans.length > 0) this.selectedPlanId = this.plans[0].id;
        } else {
          this.alertService.unialert(res.message || 'Failed to load franchise plans.');
          this.plans = [];
        }
      },
      error: (err) => {
        this.loading = false;
        console.error(err);
        const msg = err.error?.message || 'An error occurred while loading franchise plans.';
        this.alertService.unialert(msg);
        this.plans = [];
      }
    });
  }

  selectPlan(planId: number) {
    this.selectedPlanId = planId;
    delete this.validationErrors['plan'];
  }

  get selectedPlan() {
    return this.plans.find(p => p.id === this.selectedPlanId);
  }

  // ================= VALIDATION =================
  validatePAN(pan: string): boolean {
    return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan);
  }

  validateGST(gst: string): boolean {
    return /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gst);
  }

  validateMobile(mobile: string): boolean {
    return /^[0-9]{10}$/.test(mobile);
  }

  validatePincode(pincode: string): boolean {
    return /^[0-9]{6}$/.test(pincode);
  }

  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validateForm(): boolean {
    this.validationErrors = {};
    const f = this.franchiseForm;

    if (!f.franchise_name?.trim()) this.validationErrors['franchise_name'] = 'Franchise name is required.';
    if (!f.owner_name?.trim()) this.validationErrors['owner_name'] = 'Owner name is required.';
    if (!f.email?.trim()) this.validationErrors['email'] = 'Email is required.';
    else if (!this.validateEmail(f.email)) this.validationErrors['email'] = 'Enter a valid email address.';
    if (!f.mobile_no?.trim()) this.validationErrors['mobile_no'] = 'Mobile number is required.';
    else if (!this.validateMobile(f.mobile_no)) this.validationErrors['mobile_no'] = 'Enter a valid 10‑digit mobile number.';
    if (f.alternate_mobile_no && !this.validateMobile(f.alternate_mobile_no)) {
      this.validationErrors['alternate_mobile_no'] = 'Enter a valid 10‑digit number.';
    }
    if (!f.address?.trim()) this.validationErrors['address'] = 'Address is required.';
    if (!f.state_id) this.validationErrors['state'] = 'Please select a state.';
    if (!f.district_id) this.validationErrors['district'] = 'Please select a district.';
    if (!f.pincode?.trim()) this.validationErrors['pincode'] = 'Pincode is required.';
    else if (!this.validatePincode(f.pincode)) this.validationErrors['pincode'] = 'Enter a valid 6‑digit pincode.';
    // Commission percentage validation removed
    if (f.gst_no && !this.validateGST(f.gst_no)) {
      this.validationErrors['gst_no'] = 'Enter a valid GST number (e.g., 27ABCDE1234F1Z5).';
    }
    if (f.pan_no && !this.validatePAN(f.pan_no)) {
      this.validationErrors['pan_no'] = 'Enter a valid PAN (e.g., ABCDE1234F).';
    }
    if (!this.selectedPlanId) {
      this.validationErrors['plan'] = 'Please select a franchise plan.';
    }

    return Object.keys(this.validationErrors).length === 0;
  }

  // ================= SUBMIT =================
  onSubmit() {
    if (!this.validateForm()) {
      const firstError = Object.values(this.validationErrors)[0];
      if (firstError) this.alertService.unialert(firstError as string);
      return;
    }
    if (!this.selectedPlan) {
      this.alertService.unialert('Please select a plan.');
      return;
    }

    this.submitting = true;

    const payload = {
      company: this.selectedPlan.company_id,
      product: this.selectedPlan.product,
      // New field: FranchisePlan with selected plan ID
      FranchisePlan: this.selectedPlanId,
      franchise_name: this.franchiseForm.franchise_name.trim(),
      owner_name: this.franchiseForm.owner_name.trim(),
      email: this.franchiseForm.email.trim(),
      mobile_no: this.franchiseForm.mobile_no.trim(),
      alternate_mobile_no: this.franchiseForm.alternate_mobile_no?.trim() || '',
      address: this.franchiseForm.address.trim(),
      city: this.getDistrictName(this.franchiseForm.district_id),
      state: this.getStateName(this.franchiseForm.state_id),
      pincode: this.franchiseForm.pincode.trim(),
      gst_no: this.franchiseForm.gst_no?.trim() || '',
      pan_no: this.franchiseForm.pan_no?.trim() || '',
      // franchise_code and commission_percentage are removed
      joining_date: this.franchiseForm.joining_date,
      franchise_referral_code: this.franchiseForm.franchise_referral_code?.trim() || null
    };

    this.productService.createFranchise(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;
        if (res.status === 'success' || res.status === true) {
          this.alertService.unialert(res.message || 'Franchise application submitted successfully!');
          localStorage.removeItem('franchise_referral_code');
          this.router.navigate(['/my-franchise-enquiries']);
        } else {
          this.alertService.unialert(res.message || 'Submission failed. Please try again.');
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error(err);
        if (err.error?.errors) {
          const serverErrors = err.error.errors;
          const firstKey = Object.keys(serverErrors)[0];
          if (firstKey) {
            const firstMsg = serverErrors[firstKey][0];
            this.alertService.unialert(firstMsg);
            Object.keys(serverErrors).forEach(key => {
              this.validationErrors[key] = serverErrors[key][0];
            });
          }
        } else if (err.error?.message) {
          this.alertService.unialert(err.error.message);
        } else {
          this.alertService.unialert('An error occurred. Please try again.');
        }
      }
    });
  }

  goBack() {
    this.location.back();
  }
}
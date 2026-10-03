import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PropertyCreateService } from '../../../services/property-create.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-property-enquiry',
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './property-enquiry.component.html',
  styleUrl: './property-enquiry.component.css'
})
export class PropertyEnquiryComponent implements OnInit {

  property: any = null;
  propertyPrice: number = 0;

  enquiryForm!: FormGroup;
  submitted = false;

  referralCode: string = '';

  propertyTypes = [
    { value: 'flat', label: 'Flat / Apartment' },
    { value: 'villa', label: 'Villa / Bungalow' },
    { value: 'plot', label: 'Plot / Land' },
    { value: 'commercial', label: 'Commercial Space' },
    { value: 'shop', label: 'Shop / Retail' },
    { value: 'office', label: 'Office Space' },
    { value: 'warehouse', label: 'Warehouse' },
    { value: 'other', label: 'Other' }
  ];

  transactionTypes = [
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' },
    { value: 'lease', label: 'For Lease' },
    { value: 'pg', label: 'PG / Hostel' }
  ];

  /** Mirrors backend FlatType TextChoices */
  flatTypes = [
    { value: 'studio', label: 'Studio' },
    { value: '1_bhk', label: '1 BHK' },
    { value: '2_bhk', label: '2 BHK' },
    { value: '3_bhk', label: '3 BHK' },
    { value: '4_bhk', label: '4 BHK' },
    { value: '5_bhk', label: '5 BHK' },
    { value: 'other', label: 'Other' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyCreateService,
    private alertService: AlertService,
    private location: Location
  ) { }

  ngOnInit() {
    // ===== NO LOGIN REQUIRED =====
    this.buildForm();

    const slug = this.route.snapshot.queryParamMap.get('property');
    const refCode =
      this.route.snapshot.queryParamMap.get('ref_code') ||
      this.route.snapshot.queryParamMap.get('ref');

    if (refCode) this.referralCode = refCode;

    if (slug) this.loadProperty(slug);
  }

  // फुलस्क्रीन इमेजसाठी लागणारे व्हेरिएबल्स
  isFullScreenOpen: boolean = false;
  currentFullScreenImg: string = '';

  // इमेजवर क्लिक केल्यावर फुलस्क्रीन उघडणारे फंक्शन
  openFullScreen(imgUrl: string) {
    if (!imgUrl) return;
    this.currentFullScreenImg = imgUrl;
    this.isFullScreenOpen = true;
  }

  // फुलस्क्रीन बंद करणारे फंक्शन
  closeFullScreen() {
    this.isFullScreenOpen = false;
    this.currentFullScreenImg = '';
  }

  maskReraNumber(reraNumber: string): string {
    if (!reraNumber) {
      return '';
    }

    return reraNumber
      .split(',')
      .map((rera: string) => {
        const value = rera.trim();

        if (value.length <= 4) {
          return value;
        }

        const firstChar = value.charAt(0);
        const lastThree = value.slice(-3);

        return `${firstChar}xxxxxxxx${lastThree}`;
      })
      .join(', ');
  }

  allowOnlyText(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Only letters and spaces
    input.value = input.value.replace(/[^a-zA-Z\s]/g, '');

    this.enquiryForm.get('customer_name')?.setValue(input.value, {
      emitEvent: false
    });
  }

  allowOnlyNumbers(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Only numbers
    input.value = input.value.replace(/[^0-9]/g, '');

    this.enquiryForm.get('customer_mobile')?.setValue(input.value, {
      emitEvent: false
    });
  }


  onBudgetMinChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const max = Number(this.f('budget_max')?.value || 100000000);

    if (value <= max) {
      this.enquiryForm.patchValue(
        {
          budget_min: value
        },
        { emitEvent: false }
      );
    }
  }


  onBudgetMaxChange(event: Event): void {
    const value = Number((event.target as HTMLInputElement).value);
    const min = Number(this.f('budget_min')?.value || 0);

    if (value >= min) {
      this.enquiryForm.patchValue(
        {
          budget_max: value
        },
        { emitEvent: false }
      );
    }
  }


  getMinPercent(): number {
    const min = Number(this.f('budget_min')?.value || 0);

    return (min / 100000000) * 100;
  }


  getMaxPercent(): number {
    const max = Number(
      this.f('budget_max')?.value || 100000000
    );

    return (max / 100000000) * 100;
  }

  // ---------- FORM ----------
  buildForm() {
    this.enquiryForm = this.fb.group(
      {
        customer_name: ['', [Validators.required, Validators.minLength(2)]],
        customer_email: ['', [Validators.required, Validators.email]],
        customer_mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],

        // ----- NEW REQUIREMENT FIELDS -----
        flat_type: [''],
        budget_min: ['', [Validators.pattern('^[0-9]+$')]],
        budget_max: ['', [Validators.pattern('^[0-9]+$')]],

        message: ['', [Validators.required, Validators.minLength(10)]]
      },
      { validators: this.budgetRangeValidator }
    );
  }

  /** Cross-field: budget_max must be >= budget_min (when both filled) */
  private budgetRangeValidator(group: AbstractControl): ValidationErrors | null {
    const min = group.get('budget_min')?.value;
    const max = group.get('budget_max')?.value;

    const hasMin = min !== null && min !== undefined && min !== '';
    const hasMax = max !== null && max !== undefined && max !== '';

    if (hasMin && hasMax && Number(max) < Number(min)) {
      return { budgetRange: true };
    }
    return null;
  }

  f(field: string) { return this.enquiryForm.get(field); }

  isInvalid(field: string): boolean {
    const ctrl = this.f(field);
    return !!(ctrl && ctrl.invalid && (ctrl.touched || this.submitted));
  }

  isBudgetRangeInvalid(): boolean {
    const maxCtrl = this.f('budget_max');
    return !!(
      this.enquiryForm.hasError('budgetRange') &&
      (maxCtrl?.touched || this.submitted)
    );
  }

  // ---------- FLAT TYPE CHIPS ----------
  selectFlatType(value: string) {
    const ctrl = this.f('flat_type');
    if (!ctrl) return;
    // toggle off if the same chip is clicked again
    ctrl.setValue(ctrl.value === value ? '' : value);
    ctrl.markAsTouched();
    ctrl.markAsDirty();
  }

  // ---------- LOAD PROPERTY ----------
  loadProperty(slug: string) {
    // 1) Try cache (fast path from property-list / property-detail)
    const cached = sessionStorage.getItem('selected_property');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed?.slug === slug) {
          this.setProperty(parsed);
          return;
        }
      } catch { /* ignore */ }
    }

    // 2) Fallback: fetch approved list and pick by slug
    this.propertyService.getApprovedProperties().subscribe({
      next: (res: any) => {
        if (res?.status && Array.isArray(res.data)) {
          const found = res.data.find((p: any) => p.slug === slug);
          if (found) this.setProperty(found);
        }
      },
      error: (err) => console.error('Property load error', err)
    });
  }

  private setProperty(p: any) {
    // Compute min base price
    let price = 0;
    if (Array.isArray(p.pricing_slabs) && p.pricing_slabs.length) {
      const prices = p.pricing_slabs
        .map((s: any) => parseFloat(s.base_price) || 0)
        .filter((n: number) => n > 0);
      price = prices.length ? Math.min(...prices) : 0;
    }
    this.propertyPrice = price;

    // Fallback placeholder image
    if (!Array.isArray(p.images) || p.images.length === 0) {
      p.images = [{
        image_s3_key: 'https://via.placeholder.com/400x300/cccccc/ffffff?text=No+Image'
      }];
    }

    this.property = p;
  }

  // ---------- SUBMIT ----------
  submit() {
    this.submitted = true;

    if (this.enquiryForm.invalid) {
      this.enquiryForm.markAllAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!this.property?.id) {
      this.alertService.unialert('❌ Property not loaded. Please go back and try again.');
      return;
    }

    const v = this.enquiryForm.value;

    const payload: any = {
      property: this.property.id,
      customer_name: v.customer_name,
      customer_email: v.customer_email,
      customer_mobile: v.customer_mobile,

      // ----- NEW FIELDS -----
      flat_type: v.flat_type || null,
      budget_min: this.toNumber(v.budget_min),
      budget_max: this.toNumber(v.budget_max),

      message: v.message,
      status: 'new'
    };

    if (this.referralCode) {
      payload.referral_code = this.referralCode;
    }

    this.propertyService.createPropertyEnquiry(payload).subscribe({
      next: (res: any) => {
        this.alertService.unialert(res?.message || 'Enquiry submitted.');
        if (res?.success) {
          sessionStorage.removeItem('selected_property');
          this.router.navigate(['/']);
        }
      },
      error: (err) => {
        console.error(err);
        const backendMsg =
          err?.error?.message ||
          err?.error?.detail ||
          err?.message ||
          'Failed to submit enquiry. Please try again.';
        this.alertService.unialert(backendMsg);
      }
    });
  }

  // ---------- HELPERS ----------
  goBack() {
    this.location.back();
  }

  /** '' | null | undefined -> null, otherwise Number */
  private toNumber(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }

  getPropertyTypeLabel(value: string): string {
    const found = this.propertyTypes.find(pt => pt.value === value);
    return found ? found.label : (value || '');
  }

  getTransactionTypeLabel(value: string): string {
    const found = this.transactionTypes.find(tt => tt.value === value);
    return found ? found.label : (value || '');
  }

  getFlatTypeLabel(value: string): string {
    const found = this.flatTypes.find(ft => ft.value === value);
    return found ? found.label : (value || '');
  }

  formatPrice(price: number): string {
    if (!price || price <= 0) return 'Price on request';
    return '₹ ' + price.toLocaleString('en-IN');
  }

  /** Live budget summary for the summary box */
  get budgetSummary(): string {
    const rawMin = this.f('budget_min')?.value;
    const rawMax = this.f('budget_max')?.value;

    const min = this.toNumber(rawMin);
    const max = this.toNumber(rawMax);

    const hasMin = min !== null && min > 0;
    const hasMax = max !== null && max > 0;

    if (hasMin && hasMax) {
      return `${this.formatPrice(min as number)} - ${this.formatPrice(max as number)}`;
    }
    if (hasMin) return `From ${this.formatPrice(min as number)}`;
    if (hasMax) return `Up to ${this.formatPrice(max as number)}`;
    return '';
  }

  // ---------- PUBLIC DISPLAY (hide identity / exact location) ----------
  get publicTitle(): string {
    if (!this.property) return 'Property';
    const type = this.getPropertyTypeLabel(this.property.property_type);
    const city = this.property.city || '';
    if (type && city) return `${type} in ${city}`;
    return type || city || 'Property';
  }

  get locationLine(): string {
    if (!this.property) return '';
    const parts = [this.property.area, this.property.city].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Location available on request';
  }
}
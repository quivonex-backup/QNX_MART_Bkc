import { CommonModule, Location } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OlxService } from '../../../services/olx.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-olx-product-enquiry',
  standalone: true,
  imports: [FormsModule, CommonModule, ReactiveFormsModule],
  templateUrl: './olx-product-enquiry.component.html',
  styleUrl: './olx-product-enquiry.component.css'
})
export class OlxProductEnquiryComponent implements OnInit {

  product: any = null;
  enquiryForm!: FormGroup;
  submitted = false;
  submitting = false;
  loggedIn = false;

  /** S3 base URL for images */
  private readonly S3_BASE = 'https://qnxmart.s3.ap-south-1.amazonaws.com/';
  private readonly PLACEHOLDER =
    'https://via.placeholder.com/400x300/eef2f7/94a3b8?text=No+Image';

  // Fullscreen lightbox
  isFullScreenOpen = false;
  currentFullScreenImg = '';

  conditions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'used', label: 'Used' }
  ];

  sellerTypes = [
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Business' }
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private olxService: OlxService,
    private alertService: AlertService,
    private location: Location
  ) { }

  ngOnInit(): void {
    // 1) Auth check — enquiry requires login
    this.loggedIn = this.isLoggedIn();

    if (!this.loggedIn) {
      this.alertService.unialert('Please login to submit an enquiry.');
      setTimeout(() => {
        this.router.navigate(['/login'], {
          queryParams: { returnUrl: this.router.url }
        });
      }, 1500);
      return;
    }

    // 2) Build form
    this.buildForm();

    // 3) Load cached product
    this.loadCachedProduct();
  }

  // ============================================================
  // AUTH
  // ============================================================
  private isLoggedIn(): boolean {
    const keys = [
      'token', 'access_token', 'auth_token',
      'authToken', 'jwt', 'user_token'
    ];
    for (const k of keys) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v && v !== 'null' && v !== 'undefined' && v.trim() !== '') return true;
    }
    const userRaw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userRaw && userRaw !== 'null' && userRaw !== 'undefined') {
      try {
        const u = JSON.parse(userRaw);
        if (u && (u.id || u._id || u.email || u.token)) return true;
      } catch { /* ignore */ }
    }
    return false;
  }

  // ============================================================
  // FORM
  // ============================================================
  private buildForm(): void {
    this.enquiryForm = this.fb.group({
      phone_number: [
        '',
        [Validators.required, Validators.pattern('^[0-9]{10}$')]
      ],
      message: [
        '',
        [Validators.required, Validators.minLength(10)]
      ]
    });
  }

  f(field: string) { return this.enquiryForm.get(field); }

  isInvalid(field: string): boolean {
    const ctrl = this.f(field);
    return !!(ctrl && ctrl.invalid && (ctrl.touched || this.submitted));
  }

  allowOnlyNumbers(event: Event): void {
    const input = event.target as HTMLInputElement;
    input.value = input.value.replace(/[^0-9]/g, '');
    this.enquiryForm.get('phone_number')?.setValue(input.value, { emitEvent: false });
  }

  // ============================================================
  // CACHED PRODUCT
  // ============================================================
  private loadCachedProduct(): void {
    const cached = sessionStorage.getItem('selected_product');
    if (!cached) {
      this.alertService.unialert('❌ No product selected. Redirecting...');
      setTimeout(() => this.router.navigate(['/olx-product-list']), 1500);
      return;
    }
    try {
      const parsed = JSON.parse(cached);
      if (!parsed?.id) {
        this.alertService.unialert('❌ Product not found. Redirecting...');
        setTimeout(() => this.router.navigate(['/olx-product-list']), 1500);
        return;
      }
      this.setProduct(parsed);
    } catch {
      this.alertService.unialert('❌ Failed to read product data.');
      this.router.navigate(['/olx-product-list']);
    }
  }

  private buildImageUrl(img: any): string {
    if (!img) return this.PLACEHOLDER;
    if (img.image_url && typeof img.image_url === 'string' && img.image_url.startsWith('http')) {
      return img.image_url;
    }
    if (img.image_s3_key && typeof img.image_s3_key === 'string') {
      if (img.image_s3_key.startsWith('http')) return img.image_s3_key;
      return this.S3_BASE + img.image_s3_key;
    }
    return this.PLACEHOLDER;
  }

  private setProduct(p: any): void {
    if (!Array.isArray(p.images) || p.images.length === 0) {
      p.images = [{ image_url: this.PLACEHOLDER, is_primary: true }];
    } else {
      p.images = p.images
        .map((img: any) => ({ ...img, image_url: this.buildImageUrl(img) }))
        .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    }
    if (typeof p.attributes === 'string') {
      try { p.attributes = JSON.parse(p.attributes); } catch { p.attributes = {}; }
    }
    if (!p.attributes || typeof p.attributes !== 'object' || Array.isArray(p.attributes)) {
      p.attributes = {};
    }
    this.product = p;
  }

  // ============================================================
  // FULLSCREEN LIGHTBOX
  // ============================================================
  openFullScreen(imgUrl: string): void {
    if (!imgUrl) return;
    this.currentFullScreenImg = imgUrl;
    this.isFullScreenOpen = true;
  }

  closeFullScreen(): void {
    this.isFullScreenOpen = false;
    this.currentFullScreenImg = '';
  }

  // ============================================================
  // SUBMIT
  // ============================================================
  submit(): void {
    this.submitted = true;

    if (!this.loggedIn) {
      this.alertService.unialert('🔒 Please login to submit an enquiry.');
      return;
    }

    if (this.enquiryForm.invalid) {
      this.enquiryForm.markAllAsTouched();
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    if (!this.product?.id) {
      this.alertService.unialert('❌ Product not loaded. Please go back and try again.');
      return;
    }

    const v = this.enquiryForm.value;
    const payload = {
      listing_id: this.product.id,
      message: (v.message || '').trim(),
      phone_number: (v.phone_number || '').trim()
    };

    this.submitting = true;

    this.olxService.createListingEnquiry(payload).subscribe({
      next: (res: any) => {
        this.submitting = false;

        // Show backend message via unialert
        const msg = res?.message || 'Enquiry submitted successfully.';
        this.alertService.unialert('✅ ' + msg);

        if (res?.success) {
          // Clean up cached product
          sessionStorage.removeItem('selected_product');
          setTimeout(() => {
            this.router.navigate(['/olx-product-list']);
          }, 1500);
        }
      },
      error: (err) => {
        this.submitting = false;
        console.error('Enquiry submit error', err);
        const backendMsg =
          err?.error?.message ||
          err?.error?.detail ||
          err?.message ||
          'Failed to submit enquiry. Please try again.';
        this.alertService.unialert('❌ ' + backendMsg);
      }
    });
  }

  // ============================================================
  // NAVIGATION
  // ============================================================
  goBack(): void {
    this.location.back();   // browser back
  }

  // ============================================================
  // DISPLAY HELPERS
  // ============================================================
  getConditionLabel(value: string): string {
    return this.conditions.find(c => c.value === value)?.label || value || '';
  }

  getSellerTypeLabel(value: string): string {
    return this.sellerTypes.find(s => s.value === value)?.label || value || '';
  }

  get attributeEntries(): { key: string; value: any }[] {
    const a = this.product?.attributes;
    if (!a || typeof a !== 'object' || Array.isArray(a)) return [];
    return Object.entries(a).map(([key, value]) => ({ key, value }));
  }

  formatKey(key: string): string {
    if (!key) return '';
    return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }

  formatValue(value: any): string {
    if (value === null || value === undefined) return '—';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (Array.isArray(value)) return value.join(', ');
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  }

  formatPrice(price: number | string): string {
    const n = typeof price === 'string' ? parseFloat(price) : price;
    if (!n || n <= 0 || isNaN(n as number)) return 'Price on request';
    return '₹ ' + (n as number).toLocaleString('en-IN');
  }

  get shortLocation(): string {
    if (!this.product) return '';
    const parts = [this.product.area, this.product.city].filter(Boolean);
    return parts.join(', ');
  }
}
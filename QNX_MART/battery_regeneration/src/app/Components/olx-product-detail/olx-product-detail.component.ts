import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OlxService } from '../../../services/olx.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-olx-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './olx-product-detail.component.html',
  styleUrl: './olx-product-detail.component.css'
})
export class OlxProductDetailComponent implements OnInit, OnDestroy {

  product: any = null;
  loading = true;
  currentImgIndex = 0;

  private autoSlideInterval: any = null;
  private readonly autoSlideDelay = 3000;

  /** S3 base URL used when only `image_s3_key` is present */
  private readonly S3_BASE = 'https://qnxmart.s3.ap-south-1.amazonaws.com/';
  private readonly PLACEHOLDER = 'https://via.placeholder.com/800x600/eef2f7/94a3b8?text=No+Image';

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
    private route: ActivatedRoute,
    private router: Router,
    private olxService: OlxService,
    private alertService: AlertService,
    private location: Location
  ) { }

  ngOnInit(): void {
    let id: number | string | null = null;
    const cached = sessionStorage.getItem('selected_product');

    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        id = parsed?.id ?? null;
        if (parsed) {
          this.setProduct(parsed);
          this.loading = false;
        }
      } catch { /* ignore */ }
    }

    if (!id) {
      this.alertService.unialert('❌ Product not found. Redirecting...');
      this.router.navigate(['/olx-product-list']);
      return;
    }

    this.loadProduct(id);
  }

  // ---------- LOAD ----------
  loadProduct(id: number | string): void {
    this.olxService.getListingDetail(id).subscribe({
      next: (res: any) => {
        if (res?.success && res.data) {
          this.setProduct(res.data);
        } else if (!this.product) {
          this.alertService.unialert(res?.message || '❌ Product not found.');
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Product detail error', err);
        if (!this.product) {
          this.alertService.unialert(err?.error?.message || '❌ Failed to load product details.');
        }
        this.loading = false;
      }
    });
  }

  // ---------- BUILD IMAGE URL ----------
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
    // Normalize images → always give an `image_url`
    if (!Array.isArray(p.images) || p.images.length === 0) {
      p.images = [{ image_url: this.PLACEHOLDER, is_primary: true }];
    } else {
      p.images = p.images
        .map((img: any) => ({ ...img, image_url: this.buildImageUrl(img) }))
        .sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));
    }

    // Normalize attributes
    if (typeof p.attributes === 'string') {
      try { p.attributes = JSON.parse(p.attributes); } catch { p.attributes = {}; }
    }
    if (!p.attributes || typeof p.attributes !== 'object' || Array.isArray(p.attributes)) {
      p.attributes = {};
    }

    this.product = p;
    this.currentImgIndex = 0;
    this.startAutoSlide();
  }

  // ---------- AUTO SLIDE ----------
  startAutoSlide(): void {
    this.stopAutoSlide();
    if (!this.product || !Array.isArray(this.product.images) || this.product.images.length <= 1) return;
    this.autoSlideInterval = setInterval(() => {
      if (!this.product || this.product.images.length <= 1) return;
      this.currentImgIndex = (this.currentImgIndex + 1) % this.product.images.length;
    }, this.autoSlideDelay);
  }

  stopAutoSlide(): void {
    if (this.autoSlideInterval !== null) {
      clearInterval(this.autoSlideInterval);
      this.autoSlideInterval = null;
    }
  }

  // ---------- CAROUSEL ----------
  nextImage(event?: Event): void {
    event?.stopPropagation();
    if (!this.product?.images?.length) return;
    this.currentImgIndex = (this.currentImgIndex + 1) % this.product.images.length;
    this.startAutoSlide();
  }

  prevImage(event?: Event): void {
    event?.stopPropagation();
    if (!this.product?.images?.length) return;
    this.currentImgIndex =
      (this.currentImgIndex - 1 + this.product.images.length) % this.product.images.length;
    this.startAutoSlide();
  }

  setImage(index: number, event?: Event): void {
    event?.stopPropagation();
    if (!this.product?.images?.length) return;
    if (index < 0 || index >= this.product.images.length) return;
    this.currentImgIndex = index;
    this.startAutoSlide();
  }

  // ---------- HELPERS ----------
  get currentImage(): string {
    if (!this.product?.images?.length) return this.PLACEHOLDER;
    return this.product.images[this.currentImgIndex]?.image_url || this.PLACEHOLDER;
  }

  get sellerInitial(): string {
    const n = this.product?.username || '';
    return n.trim().charAt(0).toUpperCase() || '?';
  }

  get shortLocation(): string {
    if (!this.product) return '';
    const parts = [this.product.area, this.product.city].filter(Boolean);
    return parts.join(', ');
  }

  formatPrice(price: number | string): string {
    const n = typeof price === 'string' ? parseFloat(price) : price;
    if (!n || n <= 0 || isNaN(n as number)) return 'Price on request';
    return '₹ ' + (n as number).toLocaleString('en-IN');
  }

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

  // ---------- NAVIGATION ----------
  goBack(): void {
    this.location.back();   // browser back button
  }

  goToEnquiry(): void {
    if (!this.product?.id) return;
    try {
      sessionStorage.setItem('selected_product', JSON.stringify(this.buildEnquiryProduct()));
    } catch { /* ignore */ }
    this.router.navigate(['/remart-product-enquiry']);
  }

  private buildEnquiryProduct(): any {
    const p: any = { ...this.product };
    delete p.user_id;
    delete p.username;
    delete p.status;
    delete p.is_first_listing;
    delete p.free_period_days;
    delete p.active_from;
    delete p.expires_at;
    delete p.views_count;
    delete p.favourites_count;
    delete p.created_at;
    delete p.updated_at;
    delete p.latitude;
    delete p.longitude;
    return p;
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
  }
}
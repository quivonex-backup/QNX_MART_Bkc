import { CommonModule, Location } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyCreateService } from '../../../services/property-create.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-property-detail',
  imports: [CommonModule, RouterModule],
  templateUrl: './property-detail.component.html',
  styleUrl: './property-detail.component.css'
})

export class PropertyDetailComponent implements OnInit, OnDestroy {

  property: any = null;
  loading = true;

  // Image carousel
  currentImgIndex = 0;

  // Auto slide
  private autoSlideInterval: any = null;
  private readonly autoSlideDelay = 3000; // 3 seconds


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

  fullscreenImage: string | null = null;


  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private propertyService: PropertyCreateService,
    private alertService: AlertService,
    private location: Location
  ) { }


  ngOnInit() {

    // ===== NO LOGIN REQUIRED TO VIEW DETAILS =====

    const slug = this.route.snapshot.paramMap.get('slug');

    if (!slug) {
      this.alertService.unialert('❌ Property not found.');
      this.location.back();
      return;
    }

    this.loadProperty(slug);
  }


  async shareProperty(): Promise<void> {
    const url = window.location.href;
    const title = this.publicTitle || 'Property on QNX Mart';
    const shareData = { title, text: `Check out ${title} on QNX Mart`, url };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err: unknown) {
        // A user dismissing the native share sheet is not an error.
        if (err instanceof DOMException && err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      window.alert('Property link copied!');
    } catch {
      window.prompt('Copy this property link:', url);
    }
  }

  openImageFullscreen(imageUrl: string): void {
    this.fullscreenImage = imageUrl;
    document.body.style.overflow = 'hidden';
  }

  closeImageFullscreen(): void {
    this.fullscreenImage = null;
    document.body.style.overflow = '';
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


  // =========================================================
  // AUTH
  // =========================================================

  private isLoggedIn(): boolean {

    const keys = [
      'token',
      'access_token',
      'auth_token',
      'authToken',
      'jwt',
      'user_token'
    ];

    for (const k of keys) {

      const v =
        localStorage.getItem(k) ||
        sessionStorage.getItem(k);

      if (
        v &&
        v !== 'null' &&
        v !== 'undefined' &&
        v.trim() !== ''
      ) {
        return true;
      }
    }

    const userRaw =
      localStorage.getItem('user') ||
      sessionStorage.getItem('user');

    if (
      userRaw &&
      userRaw !== 'null' &&
      userRaw !== 'undefined'
    ) {

      try {

        const u = JSON.parse(userRaw);

        if (
          u &&
          (u.id || u._id || u.email || u.token)
        ) {
          return true;
        }

      } catch {
        // ignore
      }
    }

    return false;
  }


  // =========================================================
  // LOAD PROPERTY
  // =========================================================

  loadProperty(slug: string) {

    this.loading = true;

    // Stop previous slider if any
    this.stopAutoSlide();

    const cached = sessionStorage.getItem('selected_property');

    if (cached) {

      try {

        const parsed = JSON.parse(cached);

        if (parsed?.slug === slug) {

          this.setProperty(parsed);

          this.loading = false;
        }

      } catch {
        // ignore
      }
    }


    this.propertyService.getPropertyDetail(slug).subscribe({

      next: (res: any) => {

        if (res?.status && res.data) {

          this.setProperty(res.data);

        } else if (!this.property) {

          this.alertService.unialert(
            res?.message || '❌ Property not found.'
          );
        }

        this.loading = false;
      },


      error: (err) => {

        console.error(
          'Property detail error',
          err
        );

        if (!this.property) {

          this.alertService.unialert(
            err?.error?.message ||
            '❌ Failed to load property details.'
          );
        }

        this.loading = false;
      }

    });
  }


  // =========================================================
  // SET PROPERTY
  // =========================================================

  private setProperty(p: any) {

    // Images fallback + primary first
    if (
      !Array.isArray(p.images) ||
      p.images.length === 0
    ) {

      p.images = [
        {
          image_s3_key:
            'https://via.placeholder.com/800x500/cccccc/ffffff?text=No+Image'
        }
      ];

    } else {

      p.images.sort(
        (a: any, b: any) =>
          (b.is_primary ? 1 : 0) -
          (a.is_primary ? 1 : 0)
      );
    }


    // Normalize amenities
    if (
      !p.amenities &&
      Array.isArray(p.amenity_details)
    ) {

      p.amenities = p.amenity_details;
    }


    // Normalize arrays
    if (!Array.isArray(p.videos)) {
      p.videos = [];
    }

    if (!Array.isArray(p.flat_types)) {
      p.flat_types = [];
    }

    if (!Array.isArray(p.floors)) {
      p.floors = [];
    }

    if (!Array.isArray(p.pricing_slabs)) {
      p.pricing_slabs = [];
    }

    if (!Array.isArray(p.amenities)) {
      p.amenities = [];
    }


    // Normalize features object
    if (typeof p.features === 'string') {

      try {
        p.features = JSON.parse(p.features);
      } catch {
        p.features = {};
      }
    }


    if (
      !p.features ||
      typeof p.features !== 'object' ||
      Array.isArray(p.features)
    ) {

      p.features = {};
    }


    // Set property
    this.property = p;

    // Always start from first image
    this.currentImgIndex = 0;

    // Start continuous image slider
    this.startAutoSlide();
  }


  // =========================================================
  // AUTO IMAGE SLIDER
  // =========================================================

  startAutoSlide(): void {

    // Clear existing interval first
    this.stopAutoSlide();

    // Don't start if no property/images
    if (
      !this.property ||
      !Array.isArray(this.property.images) ||
      this.property.images.length <= 1
    ) {
      return;
    }


    this.autoSlideInterval = setInterval(() => {

      if (
        !this.property ||
        !Array.isArray(this.property.images) ||
        this.property.images.length <= 1
      ) {
        return;
      }


      this.currentImgIndex =
        (this.currentImgIndex + 1) %
        this.property.images.length;

    }, this.autoSlideDelay);
  }


  stopAutoSlide(): void {

    if (this.autoSlideInterval !== null) {

      clearInterval(this.autoSlideInterval);

      this.autoSlideInterval = null;
    }
  }


  // =========================================================
  // IMAGE CAROUSEL
  // =========================================================

  nextImage(event?: Event): void {

    event?.stopPropagation();

    if (
      !this.property?.images?.length
    ) {
      return;
    }


    this.currentImgIndex =
      (this.currentImgIndex + 1) %
      this.property.images.length;


    // Reset timer
    this.startAutoSlide();
  }


  prevImage(event?: Event): void {

    event?.stopPropagation();

    if (
      !this.property?.images?.length
    ) {
      return;
    }


    this.currentImgIndex =
      (
        this.currentImgIndex -
        1 +
        this.property.images.length
      ) %
      this.property.images.length;


    // Reset timer
    this.startAutoSlide();
  }


  setImage(
    index: number,
    event?: Event
  ): void {

    if (event) {
      event.stopPropagation();
    }


    if (
      !this.property?.images?.length
    ) {
      return;
    }


    if (
      index < 0 ||
      index >= this.property.images.length
    ) {
      return;
    }


    this.currentImgIndex = index;

    // Reset timer after manually selecting image
    this.startAutoSlide();
  }


  // =========================================================
  // PUBLIC DISPLAY
  // =========================================================

  get publicTitle(): string {

    if (!this.property) {
      return 'Property';
    }

    const type =
      this.getPropertyTypeLabel(
        this.property.property_type
      );

    const city =
      this.property.city || '';


    if (type && city) {
      return `${type} in ${city}`;
    }

    return type || city || 'Property';
  }


  get locationLine(): string {

    if (!this.property) {
      return '';
    }


    const parts = [
      this.property.area,
      this.property.city
    ].filter(Boolean);


    return parts.length
      ? parts.join(', ')
      : 'Location available on request';
  }


  // =========================================================
  // PRICE
  // =========================================================

  get minBasePrice(): number {

    if (
      !this.property?.pricing_slabs?.length
    ) {
      return 0;
    }


    const prices =
      this.property.pricing_slabs

        .map(
          (s: any) =>
            parseFloat(s.base_price) || 0
        )

        .filter(
          (n: number) => n > 0
        );


    return prices.length
      ? Math.min(...prices)
      : 0;
  }


  formatPrice(
    price: number | string
  ): string {

    const n =
      typeof price === 'string'
        ? parseFloat(price)
        : price;


    if (
      !n ||
      n <= 0 ||
      isNaN(n as number)
    ) {
      return 'Price on request';
    }


    return (
      '₹ ' +
      (n as number).toLocaleString('en-IN')
    );
  }


  toNumber(value: any): number {

    const n =
      typeof value === 'string'
        ? parseFloat(value)
        : Number(value);


    return isNaN(n) ? 0 : n;
  }


  // =========================================================
  // FEATURES
  // =========================================================

  get featureEntries(): { key: string; value: any }[] {

    const f =
      this.property?.features;


    if (
      !f ||
      typeof f !== 'object' ||
      Array.isArray(f)
    ) {
      return [];
    }


    return Object.entries(f)
      .map(
        ([key, value]) => ({
          key,
          value
        })
      );
  }


  formatFeatureValue(
    value: any
  ): string {

    if (
      value === null ||
      value === undefined
    ) {
      return '—';
    }


    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }


    if (Array.isArray(value)) {
      return value.join(', ');
    }


    if (typeof value === 'object') {
      return JSON.stringify(value);
    }


    return String(value);
  }


  // =========================================================
  // PAYMENT SCHEDULE / ADDITIONAL CHARGES
  // =========================================================

  hasEntries(obj: any): boolean {

    return !!obj &&
      typeof obj === 'object' &&
      !Array.isArray(obj) &&
      Object.keys(obj).length > 0;
  }


  toEntries(obj: any): { key: string; value: any }[] {

    if (!this.hasEntries(obj)) {
      return [];
    }


    return Object.entries(obj)
      .map(
        ([key, value]) => ({
          key,
          value
        })
      );
  }


  formatKey(key: string): string {

    if (!key) {
      return '';
    }


    return key
      .replace(/_/g, ' ')
      .replace(/\b\w/g, c => c.toUpperCase());
  }


  // =========================================================
  // NAVIGATION
  // =========================================================

  goBack() {

    this.location.back();
  }


  goToEnquiry() {

    if (!this.property?.slug) {
      return;
    }


    try {

      sessionStorage.setItem(
        'selected_property',
        JSON.stringify(
          this.buildEnquiryProperty()
        )
      );

    } catch {
      // ignore
    }


    const refCode =
      this.route.snapshot.queryParamMap.get(
        'ref_code'
      ) ||
      this.route.snapshot.queryParamMap.get(
        'ref'
      );


    const queryParams: any = {
      property: this.property.slug
    };


    if (refCode) {
      queryParams.ref_code = refCode;
    }


    this.router.navigate(
      ['/property-enquiry'],
      { queryParams }
    );
  }


  // =========================================================
  // ENQUIRY PROPERTY
  // =========================================================

  private buildEnquiryProperty(): any {

    const p: any = {
      ...this.property
    };


    p.title = this.publicTitle;


    delete p.builder;
    delete p.property_website_url;
    delete p.rera_website;
    delete p.rera_additional_urls;
    delete p.rera_qr_code;
    delete p.google_location_url;


    return p;
  }


  // =========================================================
  // LABELS
  // =========================================================

  getPropertyTypeLabel(
    value: string
  ): string {

    const found =
      this.propertyTypes.find(
        pt => pt.value === value
      );


    return found
      ? found.label
      : (value || '');
  }


  getTransactionTypeLabel(
    value: string
  ): string {

    const found =
      this.transactionTypes.find(
        tt => tt.value === value
      );


    return found
      ? found.label
      : (value || '');
  }


  // =========================================================
  // COMPLETION
  // =========================================================

  get showCompletion(): boolean {

    return !!this.property?.is_under_construction &&
      this.property?.completion_percentage !== null &&
      this.property?.completion_percentage !== undefined;
  }


  // =========================================================
  // COMPONENT DESTROY
  // =========================================================

  ngOnDestroy(): void {

    this.stopAutoSlide();
  }
}


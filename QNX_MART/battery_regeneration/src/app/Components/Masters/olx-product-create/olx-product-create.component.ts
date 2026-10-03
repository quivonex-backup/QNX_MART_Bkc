// olx-product-create.component.ts
import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  ChangeDetectorRef
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OlxService } from '../../../../services/olx.service';
import { StateMasterService } from '../../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../../services/State-Master/district-master.service';
import { AlertService } from '../../../../services/alert.service';
import { CommonModule } from '@angular/common';
import * as L from 'leaflet';
import { ElementRef, ViewChild } from '@angular/core';

declare var Razorpay: any;

@Component({
  selector: 'app-olx-product-create',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './olx-product-create.component.html',
  styleUrls: ['./olx-product-create.component.css']
})
export class OlxProductCreateComponent implements OnInit, AfterViewInit, OnDestroy {

  olxForm: FormGroup;
  isSubmitting = false;

  // ===== VIEW TOGGLE =====
  showListingList = false;
  listingList: any[] = [];
  listingListLoading = false;
  isEditMode = false;
  editingListingId: any = null;

  // ===== CATEGORIES / SUBCATEGORIES / ATTRIBUTES =====
  categories: any[] = [];
  subcategories: any[] = [];
  attributes: any[] = [];
  attributesLoading = false;

  // ===== STATE / DISTRICT / TALUKA =====
  states: any[] = [];
  districts: any[] = [];
  talukas: any[] = [];

  // ===== LOCATION =====
  latitude: number | null = null;
  longitude: number | null = null;
  locationAddress = '';
  locationLoading = false;
  locationError = '';
  showMap = false;
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private coordDebounce: any = null;

  // ===== IMAGES =====
  imageFiles: File[] = [];
  imagePreviews: { url: string; name: string }[] = [];

  // ===== PLANS / PAYMENT =====
  plansList: any[] = [];
  plansWithPricing: { plan: any; pricing: any[]; loading: boolean }[] = [];
  plansLoading = false;
  showPlansSection = false;
  plansLoadedOnce = false;
  showPlanModal = false;
  selectedListingForPlan: any = null;
  selectedPlan: any = null;
  planPricing: any[] = [];
  pricingLoading = false;
  categoryPrice: any = null;
  isPaymentProcessing = false;

  // ===== FULLSCREEN IMAGE =====
  selectedFullscreenImage: string | null = null;

  // ===== STATIC OPTIONS =====
  readonly conditionOptions = [
    { value: 'new', label: 'New' },
    { value: 'like_new', label: 'Like New' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'used', label: 'Used' }
  ];

  readonly sellerTypeOptions = [
    { value: 'individual', label: 'Individual' },
    { value: 'business', label: 'Business' }
  ];

  private readonly S3_BASE_URL = 'https://qnxmart.s3.ap-south-1.amazonaws.com/';

  constructor(
    private fb: FormBuilder,
    private olxService: OlxService,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.olxForm = this.fb.group({
      category_id: ['', Validators.required],
      subcategory_id: ['', Validators.required],
      title: ['', Validators.required],
      description: ['', Validators.required],
      price: ['', [Validators.required, Validators.min(0)]],
      is_negotiable: [false],
      condition: ['', Validators.required],
      seller_type: ['', Validators.required],

      attributes: this.fb.group({}),
      custom_attributes: this.fb.array([]),

      state: [''],
      district: [''],
      taluka: [''],
      city: ['', Validators.required],
      area: ['', Validators.required],
      address: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],

      latitude: [null],
      longitude: [null]
    });
  }

  // ============================================================
  // LIFECYCLE
  // ============================================================

  ngOnInit() {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      sessionStorage.setItem('redirect_after_login', this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    this.loadCategories();
    this.loadStates();

    this.olxForm.get('category_id')?.valueChanges.subscribe(catId => {
      this.olxForm.patchValue({ subcategory_id: '' }, { emitEvent: false });
      this.subcategories = [];
      this.attributes = [];
      this.rebuildAttributesForm([]);
      if (catId) this.loadSubcategories(catId);
    });

    this.olxForm.get('subcategory_id')?.valueChanges.subscribe(subId => {
      const catId = this.olxForm.get('category_id')?.value;
      this.attributes = [];
      this.rebuildAttributesForm([]);
      if (catId && subId) this.loadAttributes(catId, subId);
    });

    this.olxForm.get('state')?.valueChanges.subscribe(stateId => {
      this.districts = [];
      this.talukas = [];
      this.olxForm.patchValue({ district: '', taluka: '', city: '', area: '' }, { emitEvent: false });
      if (stateId) this.loadDistricts(stateId);
    });

    this.olxForm.get('district')?.valueChanges.subscribe(districtId => {
      const stateId = this.olxForm.get('state')?.value;
      this.talukas = [];
      this.olxForm.patchValue({ taluka: '', area: '' }, { emitEvent: false });

      if (districtId && stateId) {
        this.loadTalukas(stateId, districtId);
        const selectedDistrict = this.districts.find(d => d.id == districtId);
        if (selectedDistrict) {
          this.olxForm.patchValue({ city: selectedDistrict.district_name }, { emitEvent: false });
        }
      }
    });

    this.olxForm.get('taluka')?.valueChanges.subscribe(talukaId => {
      const selectedTaluka = this.talukas.find(t => t.id == talukaId);
      if (selectedTaluka) {
        this.olxForm.patchValue({ area: selectedTaluka.taluka_name }, { emitEvent: false });
      }
    });

    this.olxForm.get('latitude')?.valueChanges.subscribe(() => this.scheduleCoordinateUpdate());
    this.olxForm.get('longitude')?.valueChanges.subscribe(() => this.scheduleCoordinateUpdate());
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    if (this.coordDebounce) clearTimeout(this.coordDebounce);
    if (this.map) { this.map.remove(); this.map = null; this.marker = null; }
    document.body.style.overflow = '';
  }



  @ViewChild('pincodeInput') pincodeInput!: ElementRef<HTMLInputElement>;

  allowOnlyText(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Only letters and spaces
    const value = input.value.replace(/[^a-zA-Z\s]/g, '');

    input.value = value;

    const controlName = input.getAttribute('formControlName');

    if (controlName) {
      this.olxForm.get(controlName)?.setValue(value, {
        emitEvent: false
      });
    }
  }


  onPincodeInput(event: Event): void {
    const input = event.target as HTMLInputElement;

    // Only numbers
    const value = input.value.replace(/\D/g, '').slice(0, 6);

    input.value = value;

    this.olxForm.get('pincode')?.setValue(value, {
      emitEvent: false
    });

    // 6 digits completed → next field
    if (value.length === 6) {
      setTimeout(() => {
        const addressInput = document.querySelector(
          '[formControlName="address"]'
        ) as HTMLElement;

        addressInput?.focus();
      });
    }
  }

  focusNext(event: Event): void {
    event.preventDefault();

    const current = event.target as HTMLElement;

    const fields = Array.from(
      document.querySelectorAll(
        '.pc-input:not([disabled])'
      )
    ) as HTMLElement[];

    const currentIndex = fields.indexOf(current);

    if (currentIndex !== -1 && currentIndex < fields.length - 1) {
      fields[currentIndex + 1].focus();
    }
  }

  // ============================================================
  // GETTERS
  // ============================================================

  get attributesGroup(): FormGroup {
    return this.olxForm.get('attributes') as FormGroup;
  }

  get customAttributesArray(): FormArray {
    return this.olxForm.get('custom_attributes') as FormArray;
  }

  // ============================================================
  // LOADERS
  // ============================================================

  loadCategories() {
    this.olxService.getCategories().subscribe({
      next: (res: any) => { if (res.success) this.categories = res.data || []; },
      error: (err) => console.error('Categories load error', err)
    });
  }

  loadSubcategories(categoryId: number | string) {
    this.olxService.getSubcategories(categoryId).subscribe({
      next: (res: any) => { if (res.success) this.subcategories = res.data || []; },
      error: (err) => console.error('Subcategories load error', err)
    });
  }

  loadAttributes(categoryId: number | string, subcategoryId: number | string, values: any = null) {
    this.attributesLoading = true;
    this.olxService.getAttributes(categoryId, subcategoryId).subscribe({
      next: (res: any) => {
        this.attributesLoading = false;
        if (res.success) {
          this.attributes = res.data || [];
          this.rebuildAttributesForm(this.attributes, values || {});
        }
      },
      error: (err) => {
        this.attributesLoading = false;
        console.error('Attributes load error', err);
      }
    });
  }

  private rebuildAttributesForm(attrs: any[], values: any = {}) {
    const group = this.attributesGroup;
    Object.keys(group.controls).forEach(k => group.removeControl(k));
    attrs.forEach(attr => {
      const validators = attr.is_required ? [Validators.required] : [];
      const val = values && values[attr.key] !== undefined && values[attr.key] !== null
        ? values[attr.key]
        : '';
      group.addControl(attr.key, this.fb.control(val, validators));
    });
    this.cdr.detectChanges();
  }

  loadStates() {
    this.stateService.getAllStates().subscribe({
      next: (res: any) => { if (res.data) this.states = res.data; },
      error: (err) => console.error('States load error', err)
    });
  }

  loadDistricts(stateId: number) {
    this.districtService.getDistrictsByState(stateId).subscribe({
      next: (res: any) => { if (res.status === 'success') this.districts = res.data; },
      error: (err) => { console.error('Districts load error:', err); this.districts = []; }
    });
  }

  loadTalukas(stateId: number, districtId: number) {
    this.districtService.getTalukas(stateId, districtId).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.talukas = res.data;
          this.olxForm.patchValue({ taluka: '' }, { emitEvent: false });
        }
      },
      error: (err) => {
        console.error('Taluka load error:', err);
        this.talukas = [];
        this.olxForm.patchValue({ taluka: '' }, { emitEvent: false });
      }
    });
  }

  loadMyListings() {
    this.listingListLoading = true;
    this.olxService.getMyListings().subscribe({
      next: (res: any) => {
        this.listingListLoading = false;
        this.listingList = res.success ? (res.data || []) : [];
      },
      error: (err) => {
        this.listingListLoading = false;
        console.error('My listings load error', err);
      }
    });
  }

  loadPlans() {
    this.plansLoading = true;
    this.plansList = [];
    this.plansWithPricing = [];

    this.olxService.getPlans().subscribe({
      next: (res: any) => {
        this.plansLoading = false;
        if (res.success) {
          this.plansList = res.data || [];
          this.plansWithPricing = this.plansList.map(p => ({
            plan: p,
            pricing: [],
            loading: true
          }));
          this.loadPricingForAllPlans();
        }
      },
      error: (err) => {
        this.plansLoading = false;
        console.error('Plans load error', err);
      }
    });
  }

  private loadPricingForAllPlans() {
    this.plansList.forEach((plan, idx) => {
      this.olxService.getPlanPricing(plan.id).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.plansWithPricing[idx].pricing = res.data || [];
          }
          this.plansWithPricing[idx].loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error(`Pricing load error for plan ${plan.id}:`, err);
          this.plansWithPricing[idx].loading = false;
          this.cdr.detectChanges();
        }
      });
    });
  }

  // ============================================================
  // PLANS SECTION TOGGLE
  // ============================================================

  togglePlansSection() {
    this.showPlansSection = !this.showPlansSection;
    if (this.showPlansSection && !this.plansLoadedOnce) {
      this.loadPlans();
      this.plansLoadedOnce = true;
    }
  }

  // ============================================================
  // CUSTOM ATTRIBUTES
  // ============================================================

  addCustomAttribute(key = '', value = '') {
    this.customAttributesArray.push(
      this.fb.group({ key: [key], value: [value] })
    );
  }

  removeCustomAttribute(index: number) {
    this.customAttributesArray.removeAt(index);
  }

  // ============================================================
  // VIEW TOGGLE
  // ============================================================

  showAddForm() {
    this.showListingList = false;
    this.isEditMode = false;
    this.editingListingId = null;
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToMyProducts() {
    this.showListingList = true;
    this.isEditMode = false;
    this.editingListingId = null;
    this.showPlansSection = false;
    this.plansLoadedOnce = false;
    this.plansWithPricing = [];
    this.plansList = [];
    this.loadMyListings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingListingId = null;
    this.resetForm();
    this.showListingList = true;
    this.showPlansSection = false;
    this.plansLoadedOnce = false;
    this.plansWithPricing = [];
    this.plansList = [];
    this.loadMyListings();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================================
  // EDIT POPULATE
  // ============================================================

  editListing(listing: any) {
    this.showListingList = false;
    this.isEditMode = true;
    this.editingListingId = listing.id;

    // Reset custom attributes (fresh start)
    this.customAttributesArray.clear();

    // Patch basic fields (emitEvent: false to avoid wiping subcategory/attributes)
    this.olxForm.patchValue({
      category_id: listing.category ?? '',
      subcategory_id: listing.subcategory ?? '',
      title: listing.title || '',
      description: listing.description || '',
      price: listing.price ?? '',
      is_negotiable: !!listing.is_negotiable,
      condition: listing.condition || '',
      seller_type: listing.seller_type || '',
      city: listing.city || '',
      area: listing.area || '',
      address: listing.address || '',
      pincode: listing.pincode || '',
      latitude: listing.latitude ?? null,
      longitude: listing.longitude ?? null
    }, { emitEvent: false });

    // Snapshot saved attributes (may be a JSON object)
    const existingAttrs: any = (listing.attributes && typeof listing.attributes === 'object')
      ? listing.attributes
      : {};

    // Pre-load subcategories for this category
    if (listing.category) {
      this.olxService.getSubcategories(listing.category).subscribe({
        next: (res: any) => {
          if (res.success) {
            this.subcategories = res.data || [];
            this.olxForm.patchValue(
              { subcategory_id: listing.subcategory ?? '' },
              { emitEvent: false }
            );
          }
        }
      });
    }

    // Load dynamic attributes, then split saved attrs into:
    //   - matching dynamic keys  → set in attributesGroup
    //   - unknown keys           → added as custom attribute rows
    if (listing.category && listing.subcategory) {
      this.attributesLoading = true;
      this.olxService.getAttributes(listing.category, listing.subcategory).subscribe({
        next: (res: any) => {
          this.attributesLoading = false;
          if (res.success) {
            this.attributes = res.data || [];
            const dynamicKeys = new Set(
              this.attributes.map((a: any) => a.key)
            );

            // Populate dynamic form controls with saved values
            this.rebuildAttributesForm(this.attributes, existingAttrs);

            // Any saved key not in the dynamic list → custom attribute
            Object.keys(existingAttrs).forEach(key => {
              if (!dynamicKeys.has(key)) {
                const val = existingAttrs[key];
                this.addCustomAttribute(
                  key,
                  val !== null && val !== undefined ? String(val) : ''
                );
              }
            });

            this.cdr.detectChanges();
          } else {
            // Fallback → all saved attrs become custom rows
            Object.keys(existingAttrs).forEach(key => {
              const val = existingAttrs[key];
              this.addCustomAttribute(
                key,
                val !== null && val !== undefined ? String(val) : ''
              );
            });
          }
        },
        error: (err) => {
          this.attributesLoading = false;
          console.error('Attributes load error', err);
          // Fallback → all saved attrs become custom rows
          Object.keys(existingAttrs).forEach(key => {
            const val = existingAttrs[key];
            this.addCustomAttribute(
              key,
              val !== null && val !== undefined ? String(val) : ''
            );
          });
        }
      });
    } else {
      // No category/subcategory → treat all as custom
      Object.keys(existingAttrs).forEach(key => {
        const val = existingAttrs[key];
        this.addCustomAttribute(
          key,
          val !== null && val !== undefined ? String(val) : ''
        );
      });
    }

    // Location map
    if (listing.latitude && listing.longitude) {
      this.latitude = parseFloat(listing.latitude);
      this.longitude = parseFloat(listing.longitude);
      this.showMap = true;
      this.cdr.detectChanges();
      setTimeout(() => this.initMap(this.latitude!, this.longitude!), 300);
    } else {
      this.showMap = false;
      this.latitude = null;
      this.longitude = null;
    }

    // Images
    this.imageFiles = [];
    this.imagePreviews = [];
    if (Array.isArray(listing.images)) {
      listing.images.forEach((img: any) => {
        const url = img?.image_url
          ? img.image_url
          : (img?.image_s3_key ? this.S3_BASE_URL + img.image_s3_key : '');
        if (url) this.imagePreviews.push({ url, name: 'Saved image' });
      });
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ============================================================
  // IMAGE HELPERS
  // ============================================================

  getListingImageUrl(img: any): string {
    if (!img) return '';
    if (img.image_url) return img.image_url;
    if (img.image_s3_key) return this.S3_BASE_URL + img.image_s3_key;
    return '';
  }

  private isImageFile(file: File): boolean {
    if (file.type && file.type.startsWith('image/')) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp'].includes(ext);
  }

  onImagesSelected(event: any) {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!this.isImageFile(file)) continue;
      if (file.size > 5 * 1024 * 1024) {
        this.alertService.unialert(`Image "${file.name}" exceeds 5MB and was skipped.`);
        continue;
      }
      this.imageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreviews.push({ url: e.target.result, name: file.name });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removeImage(index: number) {
    const existingCount = this.imagePreviews.length - this.imageFiles.length;
    if (index >= existingCount) {
      const fileIndex = index - existingCount;
      if (fileIndex >= 0 && fileIndex < this.imageFiles.length) {
        this.imageFiles.splice(fileIndex, 1);
      }
    }
    this.imagePreviews.splice(index, 1);
  }

  openImageModal(url: string) { this.selectedFullscreenImage = url; }
  closeImageModal() { this.selectedFullscreenImage = null; }

  // ============================================================
  // LOCATION
  // ============================================================

  getLiveLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation not supported.';
      return;
    }
    this.locationLoading = true;
    this.locationError = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = parseFloat(position.coords.latitude.toFixed(6));
        const lng = parseFloat(position.coords.longitude.toFixed(6));
        this.latitude = lat;
        this.longitude = lng;
        this.olxForm.patchValue({ latitude: lat, longitude: lng }, { emitEvent: false });
        this.locationLoading = false;
        this.showMap = true;
        this.reverseGeocode(lat, lng);

        setTimeout(() => {
          this.cdr.detectChanges();
          setTimeout(() => this.initMap(lat, lng), 100);
        }, 0);
      },
      (error) => {
        this.locationLoading = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError = 'Location permission denied. Please allow location access.';
            break;
          case error.POSITION_UNAVAILABLE:
            this.locationError = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            this.locationError = 'Location request timed out. Please try again.';
            break;
          default:
            this.locationError = 'Unable to retrieve location.';
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }

  private scheduleCoordinateUpdate() {
    if (this.coordDebounce) clearTimeout(this.coordDebounce);
    this.coordDebounce = setTimeout(() => this.onCoordinateChange(), 600);
  }

  onCoordinateChange() {
    const latValue = this.olxForm.get('latitude')?.value;
    const lngValue = this.olxForm.get('longitude')?.value;

    if (latValue === null || latValue === undefined || latValue === '' ||
      lngValue === null || lngValue === undefined || lngValue === '') {
      return;
    }

    const lat = Number(latValue);
    const lng = Number(lngValue);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      this.locationError = 'Latitude must be between -90 and 90.';
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      this.locationError = 'Longitude must be between -180 and 180.';
      return;
    }

    this.locationError = '';
    this.latitude = parseFloat(lat.toFixed(6));
    this.longitude = parseFloat(lng.toFixed(6));

    this.showMap = true;

    setTimeout(() => {
      this.cdr.detectChanges();
      setTimeout(() => {
        if (this.map && this.marker) {
          this.map.setView([this.latitude!, this.longitude!], this.map.getZoom() || 18);
          this.marker.setLatLng([this.latitude!, this.longitude!]);
          this.map.invalidateSize({ animate: false });
        } else {
          this.initMap(this.latitude!, this.longitude!);
        }
      }, 100);
    }, 0);

    this.reverseGeocode(this.latitude, this.longitude);
  }

  reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => { this.locationAddress = data.display_name || ''; })
      .catch(() => { this.locationAddress = ''; });
  }

  initMap(lat: number, lng: number) {
    const container = document.getElementById('olx-map');
    if (!container) {
      console.warn('#olx-map container not found yet, retrying...');
      setTimeout(() => this.initMap(lat, lng), 150);
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
      this.marker = null;
    }

    const icon = L.divIcon({
      className: '',
      html: `<div style="position:relative;width:36px;height:48px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45))">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="36" height="48">
                <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z" fill="#e74c3c" stroke="#c0392b" stroke-width="0.8"/>
                <circle cx="12" cy="8" r="3.5" fill="#fff"/>
              </svg>
            </div>`,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -50]
    });

    this.map = L.map('olx-map', {
      center: [lat, lng],
      zoom: 18,
      zoomControl: true
    });

    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      { attribution: 'Tiles © Esri', maxZoom: 19 }
    );
    const street = L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      { attribution: '© OpenStreetMap', maxZoom: 19 }
    );
    satellite.addTo(this.map);

    L.control.layers(
      { 'Satellite': satellite, 'Street Map': street },
      {},
      { position: 'topright' }
    ).addTo(this.map);

    this.marker = L.marker([lat, lng], { icon, draggable: true })
      .addTo(this.map)
      .bindPopup('Drag pin or click map to adjust')
      .openPopup();

    this.marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.updateLocation(pos.lat, pos.lng);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.updateLocation(lat, lng);
      this.marker?.setLatLng([lat, lng]);
    });

    this.map.whenReady(() => {
      setTimeout(() => this.map?.invalidateSize({ animate: false }), 100);
    });
  }

  updateLocation(lat: number, lng: number) {
    this.latitude = parseFloat(lat.toFixed(6));
    this.longitude = parseFloat(lng.toFixed(6));
    this.olxForm.patchValue({ latitude: this.latitude, longitude: this.longitude }, { emitEvent: false });
    this.reverseGeocode(this.latitude, this.longitude);
  }

  clearLocation() {
    this.latitude = null;
    this.longitude = null;
    this.locationAddress = '';
    this.locationError = '';
    this.showMap = false;
    this.olxForm.patchValue({ latitude: null, longitude: null }, { emitEvent: false });
    if (this.map) { this.map.remove(); this.map = null; this.marker = null; }
  }

  // ============================================================
  // SUBMIT (CREATE / UPDATE)
  // ============================================================

  onSubmit() {
    if (this.olxForm.invalid) {
      Object.keys(this.olxForm.controls).forEach(key => {
        this.olxForm.get(key)?.markAsTouched();
      });
      if (this.attributesGroup) {
        Object.keys(this.attributesGroup.controls).forEach(k => {
          this.attributesGroup.get(k)?.markAsTouched();
        });
      }
      this.alertService.unialert('Please fill all required fields correctly.');
      return;
    }

    if (this.isEditMode && !this.editingListingId) {
      this.alertService.unialert('Missing listing id for update.');
      return;
    }

    this.isSubmitting = true;

    const formData = new FormData();
    const v = this.olxForm.value;

    if (v.category_id !== null && v.category_id !== undefined && v.category_id !== '') {
      formData.append('category_id', String(v.category_id));
    }
    if (v.subcategory_id !== null && v.subcategory_id !== undefined && v.subcategory_id !== '') {
      formData.append('subcategory_id', String(v.subcategory_id));
    }

    if (v.title) formData.append('title', v.title);
    if (v.description) formData.append('description', v.description);
    if (v.price !== null && v.price !== undefined && v.price !== '') {
      formData.append('price', String(v.price));
    }
    formData.append('is_negotiable', v.is_negotiable ? 'true' : 'false');
    if (v.condition) formData.append('condition', v.condition);
    if (v.seller_type) formData.append('seller_type', v.seller_type);

    if (v.state !== null && v.state !== undefined && v.state !== '') {
      const selectedState = this.states.find(s => String(s.id) === String(v.state));
      formData.append('state', selectedState?.state_name || String(v.state));
    }
    if (v.city) formData.append('city', v.city);
    if (v.area) formData.append('area', v.area);
    if (v.address) formData.append('address', v.address);
    if (v.pincode) formData.append('pincode', v.pincode);
    if (v.latitude !== null && v.latitude !== undefined && v.latitude !== '') {
      formData.append('latitude', String(v.latitude));
    }
    if (v.longitude !== null && v.longitude !== undefined && v.longitude !== '') {
      formData.append('longitude', String(v.longitude));
    }

    // Merge dynamic + custom attributes
    const dynamicAttrs = { ...(this.attributesGroup.value || {}) };
    const customAttrs: any = {};
    this.customAttributesArray.controls.forEach(ctrl => {
      const key = (ctrl.get('key')?.value || '').trim();
      const val = (ctrl.get('value')?.value || '').trim();
      if (key && val) customAttrs[key] = val;
    });
    const allAttrs: any = { ...dynamicAttrs, ...customAttrs };
    Object.keys(allAttrs).forEach(k => {
      const value = allAttrs[k];
      if (value === null || value === undefined || value === '') delete allAttrs[k];
    });
    formData.append('attributes', JSON.stringify(allAttrs));

    this.imageFiles.forEach(file => formData.append('images', file, file.name));

    if (this.isEditMode && this.editingListingId) {
      formData.append('listing_id', String(this.editingListingId));
    }

    const req$ = this.isEditMode
      ? this.olxService.updateListing(formData)
      : this.olxService.createListing(formData);

    req$.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.success) {
          this.alertService.unialert(res.message || 'Success');
          this.resetForm();
          this.showListingList = true;
          this.showPlansSection = false;
          this.plansLoadedOnce = false;
          this.plansWithPricing = [];
          this.plansList = [];
          this.loadMyListings();
        } else {
          this.alertService.unialert(res.message || 'Request failed.');
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const msg = err?.error?.message || err?.message || 'Something went wrong.';
        this.alertService.unialert(msg);
      }
    });
  }

  // ============================================================
  // RESET
  // ============================================================

  resetForm() {
    if (this.coordDebounce) { clearTimeout(this.coordDebounce); this.coordDebounce = null; }

    this.olxForm.reset({
      category_id: '',
      subcategory_id: '',
      title: '',
      description: '',
      price: '',
      is_negotiable: false,
      condition: '',
      seller_type: '',
      state: '',
      district: '',
      taluka: '',
      city: '',
      area: '',
      address: '',
      pincode: '',
      latitude: null,
      longitude: null
    });
    this.rebuildAttributesForm([]);
    this.customAttributesArray.clear();
    this.attributes = [];
    this.subcategories = [];
    this.districts = [];
    this.talukas = [];
    this.imageFiles = [];
    this.imagePreviews = [];
    this.latitude = null;
    this.longitude = null;
    this.locationAddress = '';
    this.locationError = '';
    this.showMap = false;
    if (this.map) { this.map.remove(); this.map = null; this.marker = null; }
    this.isEditMode = false;
    this.editingListingId = null;
  }

  // ============================================================
  // VALIDATION HELPERS
  // ============================================================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.olxForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  isAttributeInvalid(key: string): boolean {
    const ctrl = this.attributesGroup.get(key);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.olxForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required.`;
      if (field.errors['pattern']) {
        if (fieldName === 'pincode') return 'Pincode must be 6 digits.';
      }
      if (field.errors['min']) return `Value must be at least ${field.errors['min'].min}.`;
    }
    return '';
  }

  formatFieldName(field: string): string {
    return field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  // ============================================================
  // PLAN MODAL / PAYMENT
  // ============================================================

  openPlanModal(listing: any) {
    this.selectedListingForPlan = listing;
    this.selectedPlan = null;
    this.planPricing = [];
    this.categoryPrice = null;
    this.showPlanModal = true;

    if (this.plansList.length === 0) {
      this.loadPlans();
    }
    document.body.style.overflow = 'hidden';
  }

  closePlanModal() {
    this.showPlanModal = false;
    this.selectedPlan = null;
    this.selectedListingForPlan = null;
    this.planPricing = [];
    this.categoryPrice = null;
    document.body.style.overflow = '';
  }

  selectPlan(plan: any) {
    this.selectedPlan = plan;
    this.planPricing = [];
    this.categoryPrice = null;

    const listingCatId = this.selectedListingForPlan?.category;
    if (!listingCatId) return;

    this.pricingLoading = true;
    this.olxService.getPlanPricing(plan.id).subscribe({
      next: (res: any) => {
        this.pricingLoading = false;
        if (res.success) {
          this.planPricing = res.data || [];
          this.categoryPrice = this.planPricing.find(
            (p: any) => String(p.category_id) === String(listingCatId) && p.is_active
          ) || null;
        }
      },
      error: (err) => {
        this.pricingLoading = false;
        console.error('Pricing load error', err);
      }
    });
  }

  purchasePlan() {
    if (!this.selectedPlan || !this.selectedListingForPlan) {
      this.alertService.unialert('Please select a plan first.');
      return;
    }
    if (!this.categoryPrice) {
      this.alertService.unialert('Pricing not available for this category.');
      return;
    }

    this.isPaymentProcessing = true;

    const payload = {
      listing_id: this.selectedListingForPlan.id,
      plan_id: this.selectedPlan.id
    };

    this.olxService.createPaymentOrder(payload).subscribe({
      next: (res: any) => {
        this.isPaymentProcessing = false;
        if (!res.success) {
          this.alertService.unialert(res.message || 'Failed to create order.');
          return;
        }
        this.openRazorpay(res);
      },
      error: (err: any) => {
        this.isPaymentProcessing = false;
        const msg = err?.error?.message || 'Failed to create order.';
        this.alertService.unialert(msg);
      }
    });
  }

  private openRazorpay(orderData: any) {
    const listing = this.selectedListingForPlan;
    const plan = this.selectedPlan;

    const options = {
      key: orderData.razorpay_key,
      amount: orderData.amount_paise,
      currency: orderData.currency || 'INR',
      name: 'OLX Listing Subscription',
      description: `${plan.name} for "${listing.title}"`,
      order_id: orderData.razorpay_order_id,
      prefill: { name: '', email: '', contact: '' },
      handler: (response: any) => {
        this.isPaymentProcessing = true;
        const verifyPayload = {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        };
        this.olxService.verifyPayment(verifyPayload).subscribe({
          next: (verifyRes: any) => {
            this.isPaymentProcessing = false;
            if (verifyRes.success) {
              this.alertService.unialert(verifyRes.message || 'Payment successful.');
              this.closePlanModal();
              this.loadMyListings();
            } else {
              this.alertService.unialert(verifyRes.message || 'Verification failed.');
            }
          },
          error: (err: any) => {
            this.isPaymentProcessing = false;
            const msg = err?.error?.message || 'Payment verification failed.';
            this.alertService.unialert(msg);
          }
        });
      },
      modal: {
        ondismiss: () => {
          this.isPaymentProcessing = false;
          this.alertService.unialert('Payment cancelled.');
        }
      },
      theme: { color: '#6366f1' }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', (failResponse: any) => {
      this.isPaymentProcessing = false;
      console.error('Razorpay failed:', failResponse.error);
      this.alertService.unialert(
        failResponse.error?.description || 'Payment failed.'
      );
    });

    rzp.open();
  }
}
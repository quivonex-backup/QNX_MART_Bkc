// property-create.component.ts  — FULL REPLACEMENT

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
import { PropertyCreateService } from '../../../../services/property-create.service';
import { StateMasterService } from '../../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../../services/State-Master/district-master.service';
import { AlertService } from '../../../../services/alert.service';
import { CommonValidators } from '../../../common-validators';
import * as L from 'leaflet';
import { CommonModule } from '@angular/common';

declare var Razorpay: any;

@Component({
  selector: 'app-property-create',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './property-create.component.html',
  styleUrls: ['./property-create.component.css']
})
export class PropertyCreateComponent implements OnInit, AfterViewInit, OnDestroy {

  propertyForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';

  // Location
  latitude: number | null = null;
  longitude: number | null = null;
  locationAddress: string = '';
  locationLoading = false;
  locationError = '';
  showMap = false;
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  // State-District-Taluka-Village
  states: any[] = [];
  districts: any[] = [];
  talukas: any[] = [];
  villages: any[] = [];

  // Amenities
  amenitiesList: any[] = [];
  selectedAmenityIds: number[] = [];

  // Features (checkboxes)
  features: { [key: string]: boolean } = {
    power_backup: false,
    lift: false,
    gym: false,
    swimming_pool: false,
    security: false
  };

  // Document types (checkboxes)
  documentTypes: { [key: string]: boolean } = {
    sale_deed: false,
    noc: false,
  };

  // ===== MEDIA — NEW UPLOADS =====
  imageFiles: File[] = [];
  videoFiles: File[] = [];
  documentFiles: File[] = [];

  // ===== MEDIA — DISPLAY =====
  imagePreviews: { url: string; name: string }[] = [];
  videoPreviews: { url: string; name: string }[] = [];
  documentNames: string[] = [];

  // Referral
  hasReferralCode = false;

  // ===== LIST / FORM TOGGLE =====
  showPropertyList = false;
  propertyList: any[] = [];
  propertyListLoading = false;

  // Edit mode
  isEditMode = false;
  editingPropertyId: any = null;

  // ===== SUBSCRIPTION PLAN STATE =====
  showPlanModal = false;
  plansLoading = false;
  subscriptionPlansList: any[] = [];
  selectedPlan: any = null;
  selectedPlanProperty: any = null;
  isPlanPaymentProcessing = false;

  // Inline plans section (toggle) — shown above the property table
  showPlansSection = false;
  plansLoadedOnce = false;

  // Full screen image preview
  selectedFullscreenImage: string | null = null;

  // Static option lists
  readonly flatTypeOptions = [
    { value: 'studio', label: 'Studio' },
    { value: '1_bhk', label: '1 BHK' },
    { value: '2_bhk', label: '2 BHK' },
    { value: '3_bhk', label: '3 BHK' },
    { value: '4_bhk', label: '4 BHK' },
    { value: '5_bhk', label: '5 BHK' },
    { value: 'other', label: 'Other' }
  ];

  // Business rule: which property types allow PG / Hostel
  private readonly pgAllowedPropertyTypes: string[] = ['flat', 'villa'];

  // ✅ Static source — sent with every create request; never shown in UI.
  // Backend `Property.source` expects the choice VALUE, not the display label.
  private readonly STATIC_SOURCE = 'website';

  constructor(
    private fb: FormBuilder,
    private propertyService: PropertyCreateService,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.propertyForm = this.fb.group({
      // ===== BASIC =====
      title: ['', Validators.required],
      description: ['', Validators.required],
      property_type: ['', Validators.required],
      transaction_type: ['', Validators.required],
      property_condition: ['', Validators.required],
      status: ['draft'],

      // ===== PROJECT / BUILDING =====
      total_area: ['', Validators.min(0)],
      plot_area: ['', Validators.min(0)],
      total_floors: ['', Validators.min(0)],
      total_towers: ['', Validators.min(0)],
      rera_number: [''],
      rera_qr_code: [''],
      rera_website: [''],
      property_website_url: [''],
      is_under_construction: [false],
      ready_to_move: [false],
      possession_date: [''],
      completion_percentage: ['', [Validators.min(0), Validators.max(100)]],

      // ===== FLAGS =====
      is_featured: [false],
      is_verified: [false],
      is_negotiable: [false],

      // ===== ADDRESS =====
      city: ['', Validators.required],
      area: ['', Validators.required],
      address: ['', Validators.required],
      landmark: [''],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      google_location_url: [''],

      // ===== LOCATION =====
      latitude: [null],
      longitude: [null],

      // ===== CASCADE =====
      state: [''],
      district: [''],
      taluka: [''],
      village: [''],

      // ===== REFERRAL =====
      referral_code: [''],

      // ===== DYNAMIC ARRAYS =====
      flat_types: this.fb.array([]),
      floors: this.fb.array([]),
      pricing_slabs: this.fb.array([]),
      sellers: this.fb.array([])
    });
  }

  // ================= LIFECYCLE =================

  ngOnInit() {
    const token = sessionStorage.getItem('access_token');
    if (!token) {
      sessionStorage.setItem('redirect_after_login', this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    this.route.queryParams.subscribe(params => {
      const referralCode = params['ref'];
      if (referralCode && referralCode.trim() !== '') {
        sessionStorage.setItem('referral_code', referralCode);
        this.hasReferralCode = true;
        this.propertyForm.patchValue({ referral_code: referralCode });
      } else {
        this.hasReferralCode = false;
      }
    });

    this.loadAmenities();
    this.loadStates();

    // Cascade handlers
    this.propertyForm.get('state')?.valueChanges.subscribe(stateId => {
      if (stateId) {
        this.loadDistricts(stateId);
        this.propertyForm.patchValue({ district: '', taluka: '', village: '' });
        this.talukas = [];
        this.villages = [];
      } else {
        this.districts = [];
        this.talukas = [];
        this.villages = [];
        this.propertyForm.patchValue({ district: '', taluka: '', village: '' });
      }
    });

    this.propertyForm.get('district')?.valueChanges.subscribe(districtId => {
      const stateId = this.propertyForm.get('state')?.value;
      if (districtId && stateId) {
        this.loadTalukas(stateId, districtId);
        this.propertyForm.patchValue({ taluka: '', village: '' });
        this.villages = [];
        const selectedDistrict = this.districts.find(d => d.id == districtId);
        if (selectedDistrict) {
          this.propertyForm.patchValue({ city: selectedDistrict.district_name });
        }
      } else {
        this.talukas = [];
        this.villages = [];
        this.propertyForm.patchValue({ taluka: '', village: '' });
      }
    });

    this.propertyForm.get('taluka')?.valueChanges.subscribe(talukaId => {
      const stateId = this.propertyForm.get('state')?.value;
      const districtId = this.propertyForm.get('district')?.value;
      if (talukaId && stateId && districtId) {
        this.loadVillages(stateId, districtId, talukaId);
        this.propertyForm.patchValue({ village: '' });
        const selectedTaluka = this.talukas.find(t => t.id == talukaId);
        if (selectedTaluka) {
          this.propertyForm.patchValue({ area: selectedTaluka.taluka_name });
        }
      } else {
        this.villages = [];
        this.propertyForm.patchValue({ village: '' });
      }
    });

    this.propertyForm.get('village')?.valueChanges.subscribe(villageId => {
      const selectedVillage = this.villages.find(v => v.id == villageId);
      if (selectedVillage && selectedVillage.pincode) {
        this.propertyForm.patchValue({ pincode: selectedVillage.pincode });
      }
    });

    // Keep dynamic sections in sync with property_type
    // Also enforce: if PG is selected but new property type can't have PG, reset to sale.
    this.propertyForm.get('property_type')?.valueChanges.subscribe(type => {
      const t = type || '';
      if (this.isPgTx && !this.pgAllowedPropertyTypes.includes(t)) {
        this.propertyForm.patchValue({ transaction_type: 'sale' }, { emitEvent: false });
      }
      this.syncDynamicArraysWithPropertyType(t);
      this.syncPricingSlabsWithPropertyType(t);
    });

    // When transaction type changes:
    //  - Wipe sale-only fields when not sale
    //  - Re-sync arrays (PG hides Flat Types)
    this.propertyForm.get('transaction_type')?.valueChanges.subscribe(tx => {
      if (tx !== 'sale') {
        this.propertyForm.patchValue({
          rera_number: '',
          rera_qr_code: '',
          rera_website: '',
          possession_date: '',
          completion_percentage: '',
          is_under_construction: false,
          ready_to_move: false
        }, { emitEvent: false });
      }
      this.syncDynamicArraysWithPropertyType(this.currentPropertyType);
    });

    this.addFlatType();
    this.addSeller();

    this.propertyForm.patchValue({
      property_type: 'flat',
      transaction_type: 'sale',
      is_under_construction: true
    });

    this.syncDynamicArraysWithPropertyType(
      this.propertyForm.get('property_type')?.value || ''
    );
    this.syncPricingSlabsWithPropertyType(
      this.propertyForm.get('property_type')?.value || ''
    );
  }

  private syncDynamicArraysWithPropertyType(type: string): void {
    // Flat types: only for flat/villa AND when NOT PG
    const needsFlatTypes = ['flat', 'villa'].includes(type) && !this.isPgTx;
    if (needsFlatTypes) {
      if (this.flatTypesArray.length === 0) {
        this.addFlatType();
      }
    } else if (this.flatTypesArray.length > 0) {
      this.flatTypesArray.clear();
    }

    const needsFloors = ['flat', 'villa', 'commercial', 'office', 'shop'].includes(type);
    if (!needsFloors && this.floorsArray.length > 0) {
      this.floorsArray.clear();
    }
  }

  /** Plot: exactly one pricing slab, no floor / flat_type UI, defaults sent statically. */
  private syncPricingSlabsWithPropertyType(type: string): void {
    if (type === 'plot') {
      if (this.pricingSlabsArray.length === 0) {
        this.addPricingSlab({ is_available: true });
      } else if (this.pricingSlabsArray.length > 1) {
        while (this.pricingSlabsArray.length > 1) {
          this.pricingSlabsArray.removeAt(this.pricingSlabsArray.length - 1);
        }
      }
    }
  }

  openImageModal(url: string) { this.selectedFullscreenImage = url; }
  closeImageModal() { this.selectedFullscreenImage = null; }

  get selectedAmenitiesCount(): number {
    return this.selectedAmenityIds ? this.selectedAmenityIds.length : 0;
  }

  toggleAmenity(amenityId: number): void {
    const index = this.selectedAmenityIds.indexOf(amenityId);
    if (index > -1) {
      this.selectedAmenityIds.splice(index, 1);
    } else {
      this.selectedAmenityIds.push(amenityId);
    }
  }

  ngAfterViewInit() { }

  ngOnDestroy() {
    if (this.map) { this.map.remove(); this.map = null; }
  }

  // ================= PROPERTY TYPE VISIBILITY GETTERS =================

  get currentPropertyType(): string {
    return this.propertyForm?.get('property_type')?.value || '';
  }

  /** True when current property is a plot/land */
  get isPlotType(): boolean {
    return this.currentPropertyType === 'plot';
  }

  // -------- TRANSACTION TYPE GETTERS --------
  get currentTransactionType(): string {
    return this.propertyForm?.get('transaction_type')?.value || 'sale';
  }
  get isSaleTx(): boolean { return this.currentTransactionType === 'sale'; }
  get isRentTx(): boolean { return this.currentTransactionType === 'rent'; }
  get isLeaseTx(): boolean { return this.currentTransactionType === 'lease'; }
  get isPgTx(): boolean { return this.currentTransactionType === 'pg'; }
  get isRentalTx(): boolean { return this.isRentTx || this.isLeaseTx; }

  /** PG / Hostel is only allowed for residential property types */
  get isPgAllowed(): boolean {
    return this.pgAllowedPropertyTypes.includes(this.currentPropertyType);
  }

  // Dynamic labels for pricing slab fields
  get basePriceLabel(): string {
    if (this.isRentTx) return 'Monthly Rent';
    if (this.isLeaseTx) return 'Monthly Lease Amount';
    if (this.isPgTx) return 'Monthly Rent (per bed)';
    return 'Base Price';
  }

  get pricePerSqftLabel(): string {
    if (this.isPgTx) return 'Price / Bed';
    if (this.isRentalTx) return 'Price / sqft (per month)';
    return 'Price / sqft';
  }

  // ===== PROPERTY-TYPE + TRANSACTION-TYPE VISIBILITY =====

  get showPlotArea(): boolean {
    return ['villa', 'flat', 'plot'].includes(this.currentPropertyType);
  }
  get showTotalArea(): boolean {
    return this.currentPropertyType !== '' && this.currentPropertyType !== 'plot';
  }
  get showFloors(): boolean {
    return ['flat', 'villa', 'commercial', 'office', 'shop']
      .includes(this.currentPropertyType);
  }
  get showTowers(): boolean {
    return ['flat', 'commercial', 'office'].includes(this.currentPropertyType);
  }
  get showFlatTypes(): boolean {
    // PG doesn't have BHK flat types; plots don't have built configurations
    return ['flat', 'villa'].includes(this.currentPropertyType) && !this.isPgTx;
  }
  get showReraSection(): boolean {
    // RERA only relevant for Sale
    return this.currentPropertyType !== '' &&
      !['villa', 'plot'].includes(this.currentPropertyType) &&
      this.isSaleTx;
  }
  get showConstructionStage(): boolean {
    // Construction stage only relevant for Sale
    return this.currentPropertyType !== '' &&
      this.currentPropertyType !== 'plot' &&
      this.isSaleTx;
  }
  get showPossessionDate(): boolean {
    // Possession date only relevant for Sale
    return this.currentPropertyType !== '' &&
      this.currentPropertyType !== 'plot' &&
      this.isSaleTx;
  }

  // ================= FORM ARRAY GETTERS =================

  get flatTypesArray(): FormArray { return this.propertyForm.get('flat_types') as FormArray; }
  get floorsArray(): FormArray { return this.propertyForm.get('floors') as FormArray; }
  get pricingSlabsArray(): FormArray { return this.propertyForm.get('pricing_slabs') as FormArray; }
  get sellersArray(): FormArray { return this.propertyForm.get('sellers') as FormArray; }

  // ================= FEATURE HELPERS =================

  hasFeatures(features: any): boolean {
    if (!features) return false;
    let obj: any = features;
    if (typeof features === 'string') {
      try { obj = JSON.parse(features); } catch { return false; }
    }
    return Object.values(obj || {}).some(v => v === true);
  }

  featureEntries(features: any): { key: string }[] {
    if (!features) return [];
    let obj: any = features;
    if (typeof features === 'string') {
      try { obj = JSON.parse(features); } catch { return []; }
    }
    return Object.entries(obj || {})
      .filter(([_, v]) => v === true)
      .map(([k]) => ({ key: k }));
  }

  // ================= ✅ LIST PAGE HELPERS =================

  /** Returns the primary image URL for a property row. */
  getPropertyImageUrl(p: any): string {
    if (!p) return '';
    const imgs = Array.isArray(p.images) ? p.images : [];
    if (imgs.length === 0) return '';
    const primary = imgs.find((i: any) => i?.is_primary) || imgs[0];
    const key = primary?.image_s3_key || primary?.url || primary?.file_url || '';
    if (!key) return '';
    if (key.startsWith('http://') || key.startsWith('https://')) return key;
    return 'https://qnxmart.s3.ap-south-1.amazonaws.com/' + key;
  }

  /** Days left until free visibility expires */
  getDaysUntilFreeExpiry(p: any): number | null {
    if (!p?.free_expiry_date) return null;
    const expiry = new Date(p.free_expiry_date).getTime();
    if (isNaN(expiry)) return null;
    return Math.ceil((expiry - Date.now()) / (1000 * 60 * 60 * 24));
  }

  /** True when free window has already passed */
  isFreeExpired(p: any): boolean {
    const d = this.getDaysUntilFreeExpiry(p);
    return d !== null && d < 0;
  }

  /** Parses `features` JSON string and returns keys set to true */
  getEnabledFeatures(p: any): string[] {
    if (!p?.features) return [];
    let obj: any = p.features;
    if (typeof obj === 'string') {
      try { obj = JSON.parse(obj); } catch { return []; }
    }
    if (!obj || typeof obj !== 'object') return [];
    return Object.keys(obj).filter(k => obj[k] === true);
  }

  /** Human-friendly feature label */
  getFeatureLabel(key: string): string {
    const map: { [k: string]: string } = {
      power_backup: 'Power Backup',
      lift: 'Lift',
      gym: 'Gym',
      swimming_pool: 'Pool',
      security: 'Security',
    };
    if (map[key]) return map[key];
    return key.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  /** Amenity names from `amenity_details` */
  getAmenityNames(p: any): string[] {
    if (!Array.isArray(p?.amenity_details)) return [];
    return p.amenity_details.map((a: any) => a?.name).filter(Boolean);
  }

  /** First N features, with "+X more" indicator */
  getFeaturesPreview(p: any, max = 3): { visible: string[]; more: number } {
    const all = this.getEnabledFeatures(p).map(k => this.getFeatureLabel(k));
    return { visible: all.slice(0, max), more: Math.max(0, all.length - max) };
  }

  /** First N amenities, with "+X more" indicator */
  getAmenitiesPreview(p: any, max = 3): { visible: string[]; more: number } {
    const all = this.getAmenityNames(p);
    return { visible: all.slice(0, max), more: Math.max(0, all.length - max) };
  }

  // ================= FLAT TYPE ROWS =================

  private buildFlatTypeGroup(data?: any): FormGroup {
    return this.fb.group({
      flat_type: [data?.flat_type || '', Validators.required],
      area_sqft: [data?.area_sqft || ''],
      carpet_area: [data?.carpet_area || ''],
      built_up_area: [data?.built_up_area || ''],
      balcony_area: [data?.balcony_area || ''],
      bedrooms: [data?.bedrooms ?? ''],
      bathrooms: [data?.bathrooms ?? ''],
      balconies: [data?.balconies ?? ''],
      kitchens: [data?.kitchens ?? ''],
      parking_count: [data?.parking_count ?? ''],
      description: [data?.description || ''],
      is_available: [data?.is_available ?? true]
    });
  }

  addFlatType(data?: any) {
    this.flatTypesArray.push(this.buildFlatTypeGroup(data));
  }

  removeFlatType(index: number) {
    if (this.flatTypesArray.length <= 1) {
      this.alertService.unialert('At least one flat type is required.');
      return;
    }
    this.flatTypesArray.removeAt(index);
  }

  // ================= FLOOR ROWS =================

  private buildFloorGroup(data?: any): FormGroup {
    return this.fb.group({
      floor_number: [data?.floor_number ?? ''],
      floor_name: [data?.floor_name || ''],
      total_units: [data?.total_units ?? ''],
      available_units: [data?.available_units ?? '']
    });
  }

  addFloor(data?: any) {
    this.floorsArray.push(this.buildFloorGroup(data));
  }

  removeFloor(index: number) {
    this.floorsArray.removeAt(index);
  }

  // ================= PRICING SLAB ROWS =================

  private buildKeyValueRows(obj: any): FormGroup[] {
    if (!obj || typeof obj !== 'object') return [];
    return Object.entries(obj).map(([key, value]) =>
      this.fb.group({
        key: [key || ''],
        value: [value != null ? String(value) : '']
      })
    );
  }

  private buildPricingSlabGroup(data?: any): FormGroup {
    return this.fb.group({
      floor: [data?.floor ?? ''],
      flat_type: [data?.flat_type || ''],
      base_price: [data?.base_price || ''],
      price_per_sqft: [data?.price_per_sqft || ''],
      booking_amount: [data?.booking_amount || ''],
      discount_percentage: [data?.discount_percentage || ''],
      gst_percentage: [data?.gst_percentage || ''],
      payment_schedule: this.fb.array(this.buildKeyValueRows(data?.payment_schedule)),
      additional_charges: this.fb.array(this.buildKeyValueRows(data?.additional_charges)),
      is_available: [data?.is_available ?? true]
    });
  }

  addPricingSlab(data?: any) {
    // Plot: only one slab is allowed
    if (this.isPlotType && this.pricingSlabsArray.length >= 1) {
      this.alertService.unialert('A plot can have only one pricing slab.');
      return;
    }
    this.pricingSlabsArray.push(this.buildPricingSlabGroup(data));
  }

  removePricingSlab(index: number) {
    // Plot: cannot remove the only slab
    if (this.isPlotType && this.pricingSlabsArray.length <= 1) {
      this.alertService.unialert('A plot must have a pricing slab.');
      return;
    }
    this.pricingSlabsArray.removeAt(index);
  }

  getPaymentScheduleArray(slabIndex: number): FormArray {
    return this.pricingSlabsArray.at(slabIndex).get('payment_schedule') as FormArray;
  }

  getAdditionalChargesArray(slabIndex: number): FormArray {
    return this.pricingSlabsArray.at(slabIndex).get('additional_charges') as FormArray;
  }

  addPaymentScheduleRow(slabIndex: number) {
    this.getPaymentScheduleArray(slabIndex).push(
      this.fb.group({ key: [''], value: [''] })
    );
  }

  removePaymentScheduleRow(slabIndex: number, rowIndex: number) {
    this.getPaymentScheduleArray(slabIndex).removeAt(rowIndex);
  }

  addAdditionalChargeRow(slabIndex: number) {
    this.getAdditionalChargesArray(slabIndex).push(
      this.fb.group({ key: [''], value: [''] })
    );
  }

  removeAdditionalChargeRow(slabIndex: number, rowIndex: number) {
    this.getAdditionalChargesArray(slabIndex).removeAt(rowIndex);
  }

  // ================= SELLER ROWS =================

  private buildSellerGroup(data?: any): FormGroup {
    return this.fb.group({
      name: [data?.name || '', Validators.required],
      phone: [data?.phone || '', [Validators.required, CommonValidators.phone()]],
      email: [data?.email || '', [Validators.required, CommonValidators.email()]],
      company: [data?.company || ''],
      designation: [data?.designation || ''],
      experience_years: [data?.experience_years ?? ''],
      whatsapp_number: [data?.whatsapp_number || ''],
      is_primary: [data?.is_primary ?? true],
      is_active: [data?.is_active ?? true]
    });
  }

  addSeller(data?: any) {
    this.sellersArray.push(this.buildSellerGroup(data));
  }

  removeSeller(index: number) {
    if (this.sellersArray.length <= 1) {
      this.alertService.unialert('At least one seller is required.');
      return;
    }
    this.sellersArray.removeAt(index);
  }

  // ================= VIEW TOGGLE =================

  togglePropertyList() {
    this.showPropertyList = !this.showPropertyList;
    if (this.showPropertyList && this.propertyList.length === 0) {
      this.loadMyProperties();
    }
  }

  showAddForm() {
    this.showPropertyList = false;
    this.isEditMode = false;
    this.editingPropertyId = null;
    this.showPlansSection = false;
    this.plansLoadedOnce = false;
    this.subscriptionPlansList = [];
    this.resetForm();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingPropertyId = null;
    this.resetForm();
    this.showPropertyList = true;
    this.showPlansSection = false;
    this.plansLoadedOnce = false;
    this.subscriptionPlansList = [];
    this.loadMyProperties();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  editProperty(property: any) {
    this.showPropertyList = false;
    this.isEditMode = true;
    this.editingPropertyId = property.id;
    this.populateForm(property);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  goToPropertyList() {
    this.showPropertyList = true;
    this.isEditMode = false;
    this.editingPropertyId = null;
    this.showPlansSection = false;
    this.plansLoadedOnce = false;
    this.subscriptionPlansList = [];
    this.loadMyProperties();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ================= PLANS SECTION TOGGLE =================

  /** Show/hide the inline "Available Subscription Plans" section */
  togglePlansSection() {
    this.showPlansSection = !this.showPlansSection;
    if (this.showPlansSection && !this.plansLoadedOnce) {
      this.loadSubscriptionPlans();
      this.plansLoadedOnce = true;
    }
  }

  // ================= POPULATE (EDIT) =================

  private populateForm(p: any) {
    this.propertyForm.patchValue({
      title: p.title || '',
      description: p.description || '',
      property_type: p.property_type || '',
      transaction_type: p.transaction_type || '',
      property_condition: p.property_condition || '',
      status: p.status || 'draft',

      total_area: p.total_area ?? '',
      plot_area: p.plot_area ?? '',
      total_floors: p.total_floors ?? '',
      total_towers: p.total_towers ?? '',
      rera_number: p.rera_number || '',
      rera_qr_code: p.rera_qr_code || '',
      rera_website: p.rera_website || '',
      property_website_url: p.property_website_url || '',
      is_under_construction: !!p.is_under_construction,
      ready_to_move: !!p.ready_to_move,
      possession_date: p.possession_date || '',
      completion_percentage: p.completion_percentage ?? '',

      is_featured: !!p.is_featured,
      is_verified: !!p.is_verified,
      is_negotiable: !!p.is_negotiable,

      city: p.city || '',
      area: p.area || '',
      address: p.address || '',
      landmark: p.landmark || '',
      pincode: p.pincode || '',
      google_location_url: p.google_location_url || '',

      latitude: p.latitude || null,
      longitude: p.longitude || null,

      referral_code: p.referral_code || ''
    });

    if (p.latitude && p.longitude) {
      this.latitude = parseFloat(p.latitude);
      this.longitude = parseFloat(p.longitude);
      this.showMap = true;
      setTimeout(() => this.initMap(this.latitude!, this.longitude!), 100);
    } else {
      this.showMap = false;
    }

    if (p.features) {
      try {
        const f = typeof p.features === 'string' ? JSON.parse(p.features) : p.features;
        Object.keys(this.features).forEach(k => { this.features[k] = !!f[k]; });
      } catch { /* ignore */ }
    }

    this.selectedAmenityIds = [];
    if (Array.isArray(p.amenities)) {
      this.selectedAmenityIds = p.amenities.map((a: any) => a.id || a);
    } else if (Array.isArray(p.amenity_details)) {
      this.selectedAmenityIds = p.amenity_details.map((a: any) => a.id);
    }

    Object.keys(this.documentTypes).forEach(k => { this.documentTypes[k] = false; });
    if (Array.isArray(p.document_types)) {
      Object.keys(this.documentTypes).forEach(k => {
        this.documentTypes[k] = p.document_types.includes(k);
      });
    } else if (Array.isArray(p.documents)) {
      p.documents.forEach((d: any) => {
        const t = d?.document_type;
        if (t && Object.prototype.hasOwnProperty.call(this.documentTypes, t)) {
          this.documentTypes[t] = true;
        }
      });
    }

    this.imageFiles = [];
    this.imagePreviews = [];
    if (Array.isArray(p.images)) {
      p.images.forEach((img: any) => {
        const url = img?.image_s3_key || img?.url || img?.file_url;
        if (url) {
          this.imagePreviews.push({
            url,
            name: img?.caption || img?.name || 'Saved image'
          });
        }
      });
    }

    this.videoFiles = [];
    this.videoPreviews = [];
    if (Array.isArray(p.videos)) {
      p.videos.forEach((v: any) => {
        const url = v?.video_s3_key || v?.url || v?.file_url;
        if (url) {
          this.videoPreviews.push({
            url,
            name: v?.title || v?.name || 'Saved video'
          });
        }
      });
    }

    this.documentFiles = [];
    this.documentNames = [];
    if (Array.isArray(p.documents)) {
      p.documents.forEach((d: any) => {
        const label = d?.title || d?.document_type || 'Saved document';
        this.documentNames.push(label);
      });
    }

    this.flatTypesArray.clear();
    (Array.isArray(p.flat_types) ? p.flat_types : []).forEach((ft: any) => this.addFlatType(ft));

    this.floorsArray.clear();
    (Array.isArray(p.floors) ? p.floors : []).forEach((f: any) => this.addFloor(f));

    this.pricingSlabsArray.clear();
    (Array.isArray(p.pricing_slabs) ? p.pricing_slabs : []).forEach((ps: any) => this.addPricingSlab(ps));

    this.sellersArray.clear();
    (Array.isArray(p.sellers) ? p.sellers : []).forEach((s: any) => this.addSeller(s));

    this.syncDynamicArraysWithPropertyType(this.propertyForm.get('property_type')?.value || '');
    this.syncPricingSlabsWithPropertyType(this.propertyForm.get('property_type')?.value || '');
  }

  // ================= LOADERS =================

  loadAmenities() {
    this.propertyService.getAmenitiesList().subscribe({
      next: (res: any) => { if (res.status) this.amenitiesList = res.data || []; },
      error: (err) => console.error('Amenities load error', err)
    });
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
      error: (err) => console.error('Districts load error', err)
    });
  }

  loadTalukas(stateId: number, districtId: number) {
    this.districtService.getTalukas(stateId, districtId).subscribe({
      next: (res: any) => { if (res.status === 'success') this.talukas = res.data; },
      error: (err) => console.error('Talukas load error', err)
    });
  }

  loadVillages(stateId: number, districtId: number, talukaId: number) {
    this.districtService.getVillages(stateId, districtId, talukaId).subscribe({
      next: (res: any) => { if (res.status === 'success') this.villages = res.data; },
      error: (err) => console.error('Villages load error', err)
    });
  }

  loadMyProperties() {
    this.propertyListLoading = true;
    this.propertyService.getMyProperties().subscribe({
      next: (res: any) => {
        this.propertyList = res.data || [];
        this.propertyListLoading = false;
      },
      error: (err) => {
        this.propertyListLoading = false;
        console.error(err);
      }
    });
  }

  // ================= SUBSCRIPTION PLAN METHODS =================

  openPlanModal(property: any) {
    this.selectedPlanProperty = property;
    this.selectedPlan = null;
    this.showPlanModal = true;
    this.subscriptionPlansList = [];
    this.loadSubscriptionPlans();
    document.body.style.overflow = 'hidden';
  }

  closePlanModal() {
    this.showPlanModal = false;
    this.selectedPlan = null;
    this.selectedPlanProperty = null;
    document.body.style.overflow = '';
  }

  loadSubscriptionPlans() {
    this.plansLoading = true;
    this.propertyService.getPropertySubscriptionPlans().subscribe({
      next: (res: any) => {
        this.plansLoading = false;
        if (res.success || res.status) {
          this.subscriptionPlansList = res.data || [];
        } else {
          this.alertService.unialert(res.message || 'Failed to load subscription plans.');
        }
      },
      error: (err: any) => {
        this.plansLoading = false;
        console.error('Plans load error:', err);
        this.alertService.unialert(err.error?.message || 'Failed to load subscription plans.');
      }
    });
  }

  selectPlan(plan: any) {
    this.selectedPlan = plan;
  }

  purchasePlan() {
    if (!this.selectedPlan || !this.selectedPlanProperty) {
      this.alertService.unialert('Please select a plan first.');
      return;
    }

    this.isPlanPaymentProcessing = true;

    const payload = {
      property_id: this.selectedPlanProperty.id,
      plan_id: this.selectedPlan.id
    };

    this.propertyService.createPropertySubscriptionOrder(payload).subscribe({
      next: (res: any) => {
        this.isPlanPaymentProcessing = false;
        if (!(res.success || res.status)) {
          this.alertService.unialert(res.message || 'Failed to create subscription order.');
          return;
        }
        const orderData = res.data;
        this.openRazorpayForPlan(orderData);
      },
      error: (err: any) => {
        this.isPlanPaymentProcessing = false;
        console.error('Create order error:', err);
        let msg = err.error?.message || 'Failed to create subscription order.';
        if (err.error?.errors) {
          msg = this.buildErrorMessage(err.error, msg);
        }
        this.alertService.unialert(msg);
      }
    });
  }

  private openRazorpayForPlan(orderData: any) {
    const property = this.selectedPlanProperty;
    const plan = this.selectedPlan;

    const options = {
      key: orderData.razorpay_key,
      amount: orderData.amount * 100,
      currency: orderData.currency || 'INR',
      name: 'Property Subscription',
      description: `${plan.name} for ${property.title}`,
      order_id: orderData.razorpay_order_id,
      prefill: { name: '', email: '', contact: '' },
      handler: (response: any) => {
        this.isPlanPaymentProcessing = true;
        const verifyPayload = {
          razorpay_order_id: response.razorpay_order_id,
          razorpay_payment_id: response.razorpay_payment_id,
          razorpay_signature: response.razorpay_signature
        };
        this.propertyService.verifyPropertySubscriptionPayment(verifyPayload).subscribe({
          next: (verifyRes: any) => {
            this.isPlanPaymentProcessing = false;
            if (verifyRes.success || verifyRes.status) {
              this.alertService.unialert(
                verifyRes.message || '✅ Subscription activated successfully!'
              );
              this.closePlanModal();
              this.loadMyProperties();
            } else {
              this.alertService.unialert(
                verifyRes.message || 'Payment verification failed.'
              );
            }
          },
          error: (err: any) => {
            this.isPlanPaymentProcessing = false;
            console.error('Verify error:', err);
            this.alertService.unialert(
              err.error?.message || 'Payment verification failed. Please contact support.'
            );
          }
        });
      },
      modal: {
        ondismiss: () => {
          this.isPlanPaymentProcessing = false;
          this.alertService.unialert('Payment cancelled.');
        }
      },
      theme: { color: '#6366f1' }
    };

    const rzp = new Razorpay(options);

    rzp.on('payment.failed', (failResponse: any) => {
      this.isPlanPaymentProcessing = false;
      console.error('Razorpay payment failed:', failResponse.error);
      this.alertService.unialert(
        '❌ Payment failed: ' + (failResponse.error?.description || 'Unknown error')
      );
    });

    rzp.open();
  }

  // ================= AMENITY / FEATURE HELPERS =================

  onAmenityChange(amenityId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedAmenityIds.includes(amenityId)) {
        this.selectedAmenityIds.push(amenityId);
      }
    } else {
      this.selectedAmenityIds = this.selectedAmenityIds.filter(id => id !== amenityId);
    }
  }

  isAmenityChecked(id: number): boolean {
    return this.selectedAmenityIds.includes(id);
  }

  get featuresKeys() { return Object.keys(this.features); }
  get documentTypeKeys() { return Object.keys(this.documentTypes); }

  // ================= FILE HANDLERS =================

  private isImageFile(file: File): boolean {
    if (file.type && file.type.startsWith('image/')) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'bmp', 'svg', 'tiff', 'tif'].includes(ext);
  }

  private isVideoFile(file: File): boolean {
    if (file.type && file.type.startsWith('video/')) return true;
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['mp4', 'mov', 'avi', 'webm', 'mkv', 'm4v', '3gp', 'flv'].includes(ext);
  }

  private isDocumentFile(file: File): boolean {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    return ['pdf', 'doc', 'docx', 'txt', 'xls', 'xlsx', 'csv', 'rtf', 'odt'].includes(ext);
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

  onVideosSelected(event: any) {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!this.isVideoFile(file)) continue;
      if (file.size > 20 * 1024 * 1024) {
        this.alertService.unialert(`Video "${file.name}" exceeds 20MB and was skipped.`);
        continue;
      }
      this.videoFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.videoPreviews.push({ url: e.target.result, name: file.name });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removeVideo(index: number) {
    const existingCount = this.videoPreviews.length - this.videoFiles.length;
    if (index >= existingCount) {
      const fileIndex = index - existingCount;
      if (fileIndex >= 0 && fileIndex < this.videoFiles.length) {
        this.videoFiles.splice(fileIndex, 1);
      }
    }
    this.videoPreviews.splice(index, 1);
  }

  onDocumentsSelected(event: any) {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!this.isDocumentFile(file)) continue;
      if (file.size > 10 * 1024 * 1024) {
        this.alertService.unialert(`Document "${file.name}" exceeds 10MB and was skipped.`);
        continue;
      }
      this.documentFiles.push(file);
      this.documentNames.push(file.name);
    }
    event.target.value = '';
  }

  removeDocument(index: number) {
    const existingCount = this.documentNames.length - this.documentFiles.length;
    if (index >= existingCount) {
      const fileIndex = index - existingCount;
      if (fileIndex >= 0 && fileIndex < this.documentFiles.length) {
        this.documentFiles.splice(fileIndex, 1);
      }
    }
    this.documentNames.splice(index, 1);
  }

  // ================= LOCATION =================

  getLiveLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation not supported.';
      return;
    }
    this.locationLoading = true;
    this.locationError = '';
    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitude = parseFloat(position.coords.latitude.toFixed(6));
        this.longitude = parseFloat(position.coords.longitude.toFixed(6));
        this.propertyForm.patchValue({ latitude: this.latitude, longitude: this.longitude });
        this.locationLoading = false;
        this.showMap = true;
        this.reverseGeocode(this.latitude, this.longitude);
        this.cdr.detectChanges();
        this.initMap(this.latitude!, this.longitude!);
      },
      () => {
        this.locationLoading = false;
        this.locationError = 'Unable to retrieve location.';
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => { this.locationAddress = data.display_name || ''; })
      .catch(() => { });
  }

  initMap(lat: number, lng: number) {
    if (this.map) { this.map.remove(); this.map = null; }
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

    this.map = L.map('property-map').setView([lat, lng], 18);
    const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles © Esri',
      maxZoom: 19
    });
    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19
    });
    satellite.addTo(this.map);
    L.control.layers({ 'Satellite': satellite, 'Street Map': street }, {}, { position: 'topright' }).addTo(this.map);

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
  }

  updateLocation(lat: number, lng: number) {
    this.latitude = parseFloat(lat.toFixed(6));
    this.longitude = parseFloat(lng.toFixed(6));
    this.propertyForm.patchValue({ latitude: this.latitude, longitude: this.longitude });
    this.reverseGeocode(this.latitude, this.longitude);
  }

  clearLocation() {
    this.latitude = null;
    this.longitude = null;
    this.locationAddress = '';
    this.locationError = '';
    this.showMap = false;
    this.propertyForm.patchValue({ latitude: null, longitude: null });
    if (this.map) { this.map.remove(); this.map = null; }
  }

  // ================= SUBMIT =================

  onSubmit() {
    this.pruneEmptyDynamicRows();

    if (this.propertyForm.invalid) {
      Object.keys(this.propertyForm.controls).forEach(key => {
        this.propertyForm.get(key)?.markAsTouched();
      });
      const invalidFields = this.getInvalidFieldNames();
      const msg = invalidFields.length
        ? `Please fill required fields: ${invalidFields.join(', ')}`
        : 'Please fill all required fields correctly.';
      this.alertService.unialert(msg);
      return;
    }

    if (!this.isEditMode) {
      if (this.showFlatTypes) {
        const hasValidFlatType = this.flatTypesArray.controls
          .some(c => !!c.value.flat_type);
        if (!hasValidFlatType) {
          this.alertService.unialert('Please add at least one flat type.');
          return;
        }
      }
    }

    if (this.isEditMode && !this.editingPropertyId) {
      this.alertService.unialert('Missing property id for update. Please try again.');
      return;
    }

    this.isSubmitting = true;
    const formData = new FormData();
    const v = this.propertyForm.value;

    const simpleFields = [
      'title', 'description', 'property_type', 'transaction_type',
      'property_condition', 'status',
      'total_area', 'plot_area', 'total_floors', 'total_towers',
      'rera_number', 'rera_qr_code', 'rera_website', 'property_website_url',
      'is_under_construction', 'ready_to_move', 'possession_date', 'completion_percentage',
      'is_featured', 'is_verified', 'is_negotiable',
      'city', 'area', 'address', 'landmark', 'pincode', 'google_location_url',
      'latitude', 'longitude',
      'referral_code'
    ];

    simpleFields.forEach(field => {
      const val = v[field];
      if (val !== null && val !== undefined && val !== '') {
        if (typeof val === 'boolean') {
          formData.append(field, val ? 'true' : 'false');
        } else {
          formData.append(field, String(val));
        }
      }
    });

    formData.append('features', JSON.stringify(this.features));

    // ✅ Static source — always "website" (lowercase, matching Django choices).
    //    Not bound to any UI control; UI never exposes or shows this.
    formData.append('source', this.STATIC_SOURCE);

    if (!this.isEditMode) {
      if (this.selectedAmenityIds.length > 0) {
        formData.append('amenities', JSON.stringify(this.selectedAmenityIds));
      }
      const selectedDocTypes = Object.keys(this.documentTypes)
        .filter(k => this.documentTypes[k]);
      if (selectedDocTypes.length > 0) {
        formData.append('document_types', JSON.stringify(selectedDocTypes));
      }

      // For plots, always send flat_types & floors (with defaults) because
      // backend PricingSlab requires both FloorInfo and FlatType FKs.
      if (this.showFlatTypes || this.isPlotType) {
        formData.append('flat_types', JSON.stringify(this.buildFlatTypesPayload()));
      }
      if (this.showFloors || this.isPlotType) {
        formData.append('floors', JSON.stringify(this.buildFloorsPayload()));
      }
      formData.append('pricing_slabs', JSON.stringify(this.buildPricingSlabsPayload()));
      formData.append('sellers', JSON.stringify(this.buildSellersPayload()));
    }

    this.imageFiles.forEach(file => formData.append('images', file, file.name));
    this.videoFiles.forEach(file => formData.append('videos', file, file.name));
    this.documentFiles.forEach(file => formData.append('documents', file, file.name));

    const sessionRef = sessionStorage.getItem('referral_code');
    if (sessionRef && sessionRef.trim() !== '') {
      formData.set('referral_code', sessionRef);
    }

    if (this.isEditMode && this.editingPropertyId) {
      formData.set('property_id', String(this.editingPropertyId));
    }

    const request$ = this.isEditMode
      ? this.propertyService.updateProperty(formData)
      : this.propertyService.createProperty(formData);

    request$.subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        if (res.status || res.success) {
          const okMsg = res.message
            || (this.isEditMode ? 'Property updated successfully.' : 'Property created successfully.');
          this.alertService.unialert(okMsg);
          this.successMessage = okMsg;
          this.resetForm();
          this.showPropertyList = true;
          this.showPlansSection = false;
          this.plansLoadedOnce = false;
          this.subscriptionPlansList = [];
          this.loadMyProperties();
        } else {
          const defaultMsg = this.isEditMode ? 'Update failed.' : 'Creation failed.';
          this.alertService.unialert(this.buildErrorMessage(res, defaultMsg));
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        const defaultMsg = this.isEditMode ? 'Update failed.' : 'Creation failed.';

        let msg = this.buildErrorMessage(err?.error, defaultMsg);

        if (msg === defaultMsg) {
          if (typeof err?.error === 'string' && err.error.trim()) {
            msg = err.error;
          } else if (err?.error?.error) {
            msg = err.error.error;
          } else if (err?.message) {
            msg = err.message;
          }
        }

        this.alertService.unialert(msg);
      }
    });
  }

  private pruneEmptyDynamicRows(): void {
    for (let i = this.flatTypesArray.length - 1; i >= 0; i--) {
      const v = this.flatTypesArray.at(i).value;
      if (!v?.flat_type) {
        this.flatTypesArray.removeAt(i);
      }
    }
    for (let i = this.sellersArray.length - 1; i >= 0; i--) {
      const v = this.sellersArray.at(i).value;
      const isEmpty = !v?.name && !v?.phone && !v?.email;
      if (isEmpty) {
        this.sellersArray.removeAt(i);
      }
    }
  }

  private getInvalidFieldNames(): string[] {
    const invalid: string[] = [];
    Object.keys(this.propertyForm.controls).forEach(key => {
      const ctrl = this.propertyForm.get(key);
      if (!ctrl) return;

      if (key === 'flat_types' && !this.showFlatTypes) return;
      if (key === 'floors' && !this.showFloors) return;

      if (ctrl instanceof FormArray) {
        ctrl.controls.forEach((row, idx) => {
          const rowGroup = row as FormGroup;
          if (rowGroup.invalid) {
            Object.keys(rowGroup.controls).forEach(f => {
              const fc = rowGroup.get(f);
              if (fc?.invalid) {
                invalid.push(`${this.formatFieldName(key)} #${idx + 1} - ${this.formatFieldName(f)}`);
              }
            });
          }
        });
      } else if (ctrl.invalid) {
        invalid.push(this.formatFieldName(key));
      }
    });
    return invalid;
  }

  // ================= PAYLOAD BUILDERS =================

  private buildFlatTypesPayload(): any[] {
    const rows = this.flatTypesArray.controls
      .map(ctrl => {
        const v = ctrl.value;
        return {
          flat_type: v.flat_type || '',
          area_sqft: this.toNumOrDefault(v.area_sqft, 0),
          carpet_area: this.toNumOrDefault(v.carpet_area, 0),
          built_up_area: this.toNumOrDefault(v.built_up_area, 0),
          balcony_area: this.toNumOrDefault(v.balcony_area, 0),
          bedrooms: this.toNumOrDefault(v.bedrooms, 0),
          bathrooms: this.toNumOrDefault(v.bathrooms, 0),
          balconies: this.toNumOrDefault(v.balconies, 0),
          kitchens: this.toNumOrDefault(v.kitchens, 0),
          parking_count: this.toNumOrDefault(v.parking_count, 0),
          description: v.description || '',
          is_available: !!v.is_available
        };
      })
      .filter(row => row.flat_type);

    // --- Plot: inject a single default flat_type so the backend can
    //     attach the PricingSlab.flat_type FK (CharField, no choices).
    if (rows.length === 0 && this.isPlotType) {
      rows.push({
        flat_type: 'other',
        area_sqft: this.toNumOrDefault(this.propertyForm.get('plot_area')?.value, 0),
        carpet_area: 0,
        built_up_area: 0,
        balcony_area: 0,
        bedrooms: 0,
        bathrooms: 0,
        balconies: 0,
        kitchens: 0,
        parking_count: 0,
        description: 'Plot / Land',
        is_available: true
      });
    }

    return rows;
  }

  private buildFloorsPayload(): any[] {
    const rows = this.floorsArray.controls
      .map(ctrl => {
        const v = ctrl.value;
        return {
          floor_number: this.toNumOrNull(v.floor_number),
          floor_name: v.floor_name || '',
          total_units: this.toNumOrNull(v.total_units),
          available_units: this.toNumOrNull(v.available_units)
        };
      })
      .filter(row => row.floor_number !== null && row.floor_name);

    // --- Plot: FloorInfo.floor_number is required (PositiveIntegerField,
    //     no null/blank). Send a static Ground floor silently.
    if (rows.length === 0 && this.isPlotType) {
      rows.push({
        floor_number: 0,
        floor_name: 'Ground',
        total_units: 1,
        available_units: 1
      });
    }

    return rows;
  }

  private buildPricingSlabsPayload(): any[] {
    const isSale = this.isSaleTx;
    const isPlot = this.isPlotType;

    return this.pricingSlabsArray.controls
      .map(ctrl => {
        const v = ctrl.value;

        // For plots, default floor / flat_type so the FK requirements
        // of PricingSlab are satisfied without exposing these inputs.
        const floor = this.toNumOrNull(v.floor) ?? (isPlot ? 0 : null);
        const flat_type = v.flat_type || (isPlot ? 'other' : '');

        const row: any = {
          floor: floor,
          flat_type: flat_type,
          base_price: v.base_price !== '' && v.base_price != null ? String(v.base_price) : null,
          price_per_sqft: v.price_per_sqft !== '' && v.price_per_sqft != null ? String(v.price_per_sqft) : null,
          is_available: !!v.is_available
        };

        // Sale-only fields
        if (isSale) {
          row.booking_amount = v.booking_amount !== '' && v.booking_amount != null ? String(v.booking_amount) : null;
          row.discount_percentage = v.discount_percentage !== '' && v.discount_percentage != null ? String(v.discount_percentage) : null;
          row.gst_percentage = v.gst_percentage !== '' && v.gst_percentage != null ? String(v.gst_percentage) : null;

          const ps = this.keyValueArrayToObject(v.payment_schedule);
          const ac = this.keyValueArrayToObject(v.additional_charges);
          if (ps) row.payment_schedule = ps;
          if (ac) row.additional_charges = ac;
        }

        return row;
      })
      .filter(row => row.floor !== null && row.flat_type);
  }

  private buildSellersPayload(): any[] {
    return this.sellersArray.controls
      .map(ctrl => {
        const v = ctrl.value;
        return {
          name: v.name || '',
          phone: v.phone || '',
          email: v.email || '',
          company: v.company || '',
          designation: v.designation || '',
          experience_years: this.toNumOrNull(v.experience_years),
          whatsapp_number: v.whatsapp_number || '',
          is_primary: !!v.is_primary,
          is_active: !!v.is_active
        };
      })
      .filter(row => row.name && row.phone && row.email);
  }

  // ================= UTILS =================

  private toNumOrNull(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return isNaN(n) ? null : n;
  }

  private toNumOrDefault(val: any, fallback: number): number {
    if (val === null || val === undefined || val === '') return fallback;
    const n = Number(val);
    return isNaN(n) ? fallback : n;
  }

  private keyValueArrayToObject(arr: any): any | null {
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const obj: any = {};
    for (const item of arr) {
      const k = (item?.key || '').toString().trim();
      const v = (item?.value || '').toString().trim();
      if (k && v) obj[k] = v;
    }
    return Object.keys(obj).length > 0 ? obj : null;
  }

  // ================= ERROR MESSAGE HELPERS =================

  private flattenErrorMessages(errors: any, prefix = ''): string[] {
    const lines: string[] = [];
    if (errors === null || errors === undefined) return lines;

    if (typeof errors === 'string') {
      lines.push(prefix ? `${prefix}: ${errors}` : errors);
      return lines;
    }

    if (Array.isArray(errors)) {
      errors.forEach(item => {
        lines.push(...this.flattenErrorMessages(item, prefix));
      });
      return lines;
    }

    if (typeof errors === 'object') {
      Object.keys(errors).forEach(key => {
        const label = this.formatFieldName(key);
        const nextPrefix = prefix ? `${prefix} → ${label}` : label;
        lines.push(...this.flattenErrorMessages(errors[key], nextPrefix));
      });
    }

    return lines;
  }

  private buildErrorMessage(response: any, defaultMsg: string): string {
    if (!response) return defaultMsg;

    const baseMsg = response.message || defaultMsg;
    const errorLines = this.flattenErrorMessages(response.errors);

    if (errorLines.length === 0) return baseMsg;
    return `${baseMsg}\n\n${errorLines.join('\n')}`;
  }

  // ================= RESET =================

  resetForm() {
    this.propertyForm.reset({
      property_type: '',
      transaction_type: '',
      property_condition: '',
      status: 'draft',
      is_under_construction: false,
      ready_to_move: false,
      is_featured: false,
      is_verified: false,
      is_negotiable: false,
      state: '',
      district: '',
      taluka: '',
      village: ''
    });

    this.flatTypesArray.clear();
    this.floorsArray.clear();
    this.pricingSlabsArray.clear();
    this.sellersArray.clear();

    this.addFlatType();
    this.addSeller();

    this.selectedAmenityIds = [];
    this.features = { power_backup: false, lift: false, gym: false, swimming_pool: false, security: false };
    this.documentTypes = { sale_deed: false, noc: false };
    this.imageFiles = [];
    this.imagePreviews = [];
    this.videoFiles = [];
    this.videoPreviews = [];
    this.documentFiles = [];
    this.documentNames = [];
    this.latitude = null;
    this.longitude = null;
    this.locationAddress = '';
    this.showMap = false;
    if (this.map) { this.map.remove(); this.map = null; }
    this.hasReferralCode = false;
    sessionStorage.removeItem('referral_code');
    this.districts = [];
    this.talukas = [];
    this.villages = [];
    this.isEditMode = false;
    this.editingPropertyId = null;
  }

  // ================= VALIDATION HELPERS =================

  isFieldInvalid(fieldName: string): boolean {
    const field = this.propertyForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  isArrayFieldInvalid(arrayName: string, index: number, fieldName: string): boolean {
    const arr = this.propertyForm.get(arrayName) as FormArray;
    if (!arr || !arr.at(index)) return false;
    const ctrl = arr.at(index).get(fieldName);
    return !!(ctrl && ctrl.invalid && (ctrl.dirty || ctrl.touched));
  }

  getErrorMessage(fieldName: string): string {
    const field = this.propertyForm.get(fieldName);
    if (field?.errors) {
      if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required.`;
      if (field.errors['email']) return 'Invalid email.';
      if (field.errors['pattern']) {
        if (fieldName === 'pincode') return 'Pincode must be 6 digits.';
      }
      if (field.errors['min']) return `Value must be at least ${field.errors['min'].min}.`;
      if (field.errors['max']) return `Value must be at most ${field.errors['max'].max}.`;
    }
    return '';
  }

  formatFieldName(field: string): string {
    return field.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  goToNext(event: Event): void {
    event.preventDefault();
    const current = event.target as HTMLElement;
    const form = current.closest('form');
    if (!form) return;
    const elements = Array.from(
      form.querySelectorAll<HTMLElement>(
        'input:not([disabled]):not([type="hidden"]), ' +
        'select:not([disabled]), ' +
        'textarea:not([disabled]), ' +
        'button:not([disabled])'
      )
    );
    const currentIndex = elements.indexOf(current);
    if (currentIndex >= 0 && currentIndex < elements.length - 1) {
      elements[currentIndex + 1].focus();
    }
  }

  allowOnlyText(event: KeyboardEvent): void {
    const key = event.key;
    if (
      key === 'Backspace' || key === 'Delete' || key === 'Tab' ||
      key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End'
    ) { return; }
    if (event.ctrlKey || event.metaKey) { return; }
    if (!/^[a-zA-Z ]$/.test(key)) { event.preventDefault(); }
  }

  allowOnlyNumbers(event: KeyboardEvent): void {
    const key = event.key;
    if (
      key === 'Backspace' || key === 'Delete' || key === 'Tab' ||
      key === 'ArrowLeft' || key === 'ArrowRight' || key === 'Home' || key === 'End'
    ) { return; }
    if (event.ctrlKey || event.metaKey) { return; }
    if (!/^[0-9]$/.test(key)) { event.preventDefault(); }
  }

  cleanTextField(event: Event): void {
    const input = event.target as HTMLInputElement;
    const cleanedValue = input.value.replace(/[^a-zA-Z ]/g, '').replace(/\s{2,}/g, ' ');
    input.value = cleanedValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }

  cleanNumberField(event: Event, maxLength?: number): void {
    const input = event.target as HTMLInputElement;
    let cleanedValue = input.value.replace(/[^0-9]/g, '');
    if (maxLength) { cleanedValue = cleanedValue.substring(0, maxLength); }
    input.value = cleanedValue;
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CompanyCreateService } from '../../../../services/company-create.service';
import { StateMasterService } from '../../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../../services/State-Master/district-master.service';
import { CommonValidators } from '../../../common-validators';
import * as L from 'leaflet';
import { AlertService } from '../../../../services/alert.service';
import { SellerRegistrationService } from '../../../../services/seller-registration.service';

declare var Razorpay: any;

@Component({
  selector: 'app-company-create',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './company-create.component.html',
  styleUrl: './company-create.component.css'
})
export class CompanyCreateComponent implements OnInit, AfterViewInit, OnDestroy {
  companyForm: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  successMessage = '';
  logoPreview: string | null = null;
  selectedFile: File | null = null;
  isFileDragged = false;
  states: any[] = [];
  districts: any[] = [];
  talukas: any[] = [];
  villages: any[] = [];

  // Edit mode
  isEditMode = false;
  editingCompanyId: any = null;
  existingLogoUrl: string | null = null;

  companyId: any;
  pendingCompanyId: number | null = null;
  isPaymentProcessing = false;
  hasReferralCode = false;

  // Location
  latitude: number | null = null;
  longitude: number | null = null;
  locationAddress: string = '';
  locationLoading = false;
  locationError = '';
  showMap = false;
  private map: L.Map | null = null;
  private marker: L.Marker | null = null;

  // Company Images
  companyImageFiles: File[] = [];
  companyImagePreviews: { url: string; name: string }[] = [];
  existingImages: { url: string; name: string; id?: number }[] = [];
  deletedImageIds: number[] = [];

  // ===== LIST / FORM TOGGLE =====
  showCompanyList = false;
  companyList: any[] = [];
  companyListLoading = false;

  constructor(
    private fb: FormBuilder,
    private companyService: CompanyCreateService,
    private router: Router,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private alertService: AlertService,
    private sellerService: SellerRegistrationService,
  ) {
    this.companyForm = this.fb.group({
      // Basic Info
      name: ['', [Validators.required, Validators.minLength(2)]],
      owner_name: ['', [Validators.required, Validators.minLength(2), Validators.pattern('^[a-zA-Z ]+$')]],
      company_slogan: [''],

      // Contact Info
      email: ['', [Validators.required, CommonValidators.email()]],
      phone_number: ['', [Validators.required, CommonValidators.phone()]],
      website_url: [''],

      // Address
      address: ['', Validators.required],
      state: ['', Validators.required],
      district: ['', Validators.required],
      taluka: ['', Validators.required],
      village: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],

      // Registration
      gst_number: ['', [CommonValidators.gst()]],
      registration_no: [''],
      IAN_No: ['', [Validators.pattern('^[a-zA-Z0-9]+$')]],
      company_pan_no: ['', [Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      farm_registration_year: ['', [Validators.pattern('^[0-9]{4}$'), Validators.min(1900), Validators.max(new Date().getFullYear())]],

      // Multiple Emails and Contacts
      multiple_email_ids: this.fb.array([this.fb.control('', Validators.email)]),
      contacts: this.fb.array([this.fb.control('', [CommonValidators.phone()])]),

      // Social Media
      facebook_url: [''],
      linkedin_url: [''],
      instagram_url: [''],
      whatsapp_no: ['', [Validators.pattern('^[6-9][0-9]{9}$')]],
      youtube_url: [''],
      privacy_policy_url: [''],
      terms_conditions_url: [''],

      // Referral Code
      referral_code: [''],

      // Descriptions
      short_description: ['', [Validators.maxLength(160)]],
      long_description: [''],

      // Status
      is_active: [true],

      // === NEW FIELDS ===
      ISI_certified: [false],
      ISO_certified: [false],
      COD_available: [false],

      // Location
      latitude: [null],
      longitude: [null],
      pickup_location: ['', Validators.required],

      // Terms
      accept_terms_conditions: [false, Validators.requiredTrue]
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const referralCode = params['ref'];
      if (referralCode && referralCode.trim() !== '') {
        sessionStorage.setItem('referral_code', referralCode);
        this.hasReferralCode = true;
        this.companyForm.patchValue({ referral_code: referralCode });
      } else {
        this.hasReferralCode = false;
      }
    });

    const token = sessionStorage.getItem('access_token');
    const sellerId = sessionStorage.getItem('seller_id');
    if (!token) {
      sessionStorage.setItem('redirect_after_login', this.router.url);
      this.router.navigate(['/login']);
      return;
    }
    if (!sellerId) {
      this.alertService.unialert('Please complete Seller Registration first.');
      this.router.navigate(['/seller-registration']);
      return;
    }

    this.loadStates();

    this.companyForm.get('state')?.valueChanges.subscribe((stateId) => {
      if (stateId) {
        this.loadDistricts(stateId);
      } else {
        this.districts = [];
        this.companyForm.patchValue({ district: '' });
      }
    });

    this.companyForm.get('district')?.valueChanges.subscribe((districtId) => {
      const stateId = this.companyForm.get('state')?.value;
      if (districtId && stateId) {
        this.loadTalukas(stateId, districtId);
      } else {
        this.talukas = [];
        this.companyForm.patchValue({ taluka: '' });
      }
    });

    this.companyForm.get('taluka')?.valueChanges.subscribe((talukaId) => {
      const stateId = this.companyForm.get('state')?.value;
      const districtId = this.companyForm.get('district')?.value;
      if (talukaId && stateId && districtId) {
        this.loadVillages(stateId, districtId, talukaId);
      } else {
        this.villages = [];
        this.companyForm.patchValue({ village: '' });
      }
    });

    this.companyForm.get('village')?.valueChanges.subscribe((villageId) => {
      const selectedVillage = this.villages.find(v => v.id == villageId);
      if (selectedVillage) {
        this.companyForm.patchValue({
          pincode: selectedVillage.pincode || ''
        });
      }
    });
  }

  // ===== LIST / FORM TOGGLE METHODS =====

  toggleCompanyList() {
    this.showCompanyList = !this.showCompanyList;
    if (this.showCompanyList && this.companyList.length === 0) {
      this.loadMyCompanies();
    }
  }

  showAddForm() {
    this.showCompanyList = false;
    this.isEditMode = false;
    this.editingCompanyId = null;
    this.resetFormData();
  }

  loadMyCompanies() {
    this.companyListLoading = true;
    this.companyService.getMyCompanyList().subscribe({
      next: (res: any) => {
        this.companyList = res.data || [];
        this.companyListLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.companyListLoading = false;
      }
    });
  }

  // ===== CLEAR FORM (with confirm) =====

  async clearForm() {
    const confirm = await this.alertService.uniConfirm('Clear all filled data?');
    if (!confirm) return;
    this.resetFormData();
  }

  // ===== RESET FORM DATA (no confirm) =====

  private resetFormData() {
    this.companyForm.reset({
      is_active: true,
      ISI_certified: false,
      ISO_certified: false,
      COD_available: false,
      accept_terms_conditions: false
    });
    this.logoPreview = null;
    this.selectedFile = null;
    this.existingLogoUrl = null;
    this.companyImageFiles = [];
    this.companyImagePreviews = [];
    this.existingImages = [];
    this.deletedImageIds = [];
    this.latitude = null;
    this.longitude = null;
    this.locationAddress = '';
    this.locationError = '';
    this.showMap = false;
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.patchFormArray('multiple_email_ids', ['']);
    this.patchFormArray('contacts', ['']);
    this.errorMessage = '';
    this.successMessage = '';
    this.isEditMode = false;
    this.editingCompanyId = null;
    this.districts = [];
    this.talukas = [];
    this.villages = [];
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== EDIT COMPANY =====

  editCompany(company: any) {
    this.isEditMode = true;
    this.editingCompanyId = company.id;
    this.showCompanyList = false;
    this.errorMessage = '';
    this.successMessage = '';

    this.companyImageFiles = [];
    this.companyImagePreviews = [];
    this.deletedImageIds = [];
    this.existingImages = (company.images || []).map((img: any) => ({
      id: img.id,
      url: img.url || img,
      name: img.image_s3_key || 'existing-image'
    }));

    this.existingLogoUrl = company.logo || null;
    this.logoPreview = company.logo || null;
    this.selectedFile = null;

    this.latitude = company.latitude ? parseFloat(company.latitude) : null;
    this.longitude = company.longitude ? parseFloat(company.longitude) : null;
    this.locationAddress = company.location_address || '';
    this.showMap = false;
    if (this.map) { this.map.remove(); this.map = null; }

    this.companyForm.patchValue({
      name: company.name || '',
      owner_name: company.owner_name || '',
      company_slogan: company.company_slogan || '',
      email: company.email || '',
      phone_number: company.phone_number || '',
      website_url: company.website_url || '',
      address: company.address || '',
      pincode: company.pincode || '',
      gst_number: company.gst_number || '',
      registration_no: company.registration_no || '',
      IAN_No: company.IAN_No || '',
      company_pan_no: company.company_pan_no || '',
      farm_registration_year: company.farm_registration_year || '',
      facebook_url: company.facebook_url || company.social_media_accounts?.facebook || '',
      linkedin_url: company.linkedin_url || company.social_media_accounts?.linkedin || '',
      instagram_url: company.instagram_url || company.social_media_accounts?.instagram || '',
      whatsapp_no: company.whatsapp_no || '',
      youtube_url: company.youtube_url || '',
      privacy_policy_url: company.privacy_policy_url || '',
      terms_conditions_url: company.terms_conditions_url || '',
      short_description: company.short_description || '',
      long_description: company.long_description || '',
      is_active: company.is_active ?? true,
      ISI_certified: company.ISI_certified ?? false,
      ISO_certified: company.ISO_certified ?? false,
      COD_available: company.COD_available ?? false,
      latitude: this.latitude,
      longitude: this.longitude,
      pickup_location: company.pickup_location || ''
    });

    this.patchLocationDropdowns(company);
    this.patchFormArray('multiple_email_ids', company.multiple_email_ids || []);
    this.patchFormArray('contacts', company.contacts || []);

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private patchLocationDropdowns(company: any) {
    const matchedState = this.states.find(
      s => s.state_name?.toLowerCase() === company.state?.toLowerCase()
    );
    if (matchedState) {
      this.companyForm.patchValue({ state: matchedState.id });
      this.loadDistricts(matchedState.id);
      setTimeout(() => {
        const matchedDistrict = this.districts.find(
          d => d.district_name?.toLowerCase() === company.district?.toLowerCase()
        );
        if (matchedDistrict) {
          this.companyForm.patchValue({ district: matchedDistrict.id });
          this.loadTalukas(matchedState.id, matchedDistrict.id);
          setTimeout(() => {
            const matchedTaluka = this.talukas.find(
              t => t.taluka_name?.toLowerCase() === company.taluka?.toLowerCase()
            );
            if (matchedTaluka) {
              this.companyForm.patchValue({ taluka: matchedTaluka.id });
              this.loadVillages(matchedState.id, matchedDistrict.id, matchedTaluka.id);
              setTimeout(() => {
                const matchedVillage = this.villages.find(
                  v => v.village_name?.toLowerCase() === company.village?.toLowerCase()
                );
                if (matchedVillage) {
                  this.companyForm.patchValue({ village: matchedVillage.id }, { emitEvent: false });
                  this.companyForm.patchValue({ pincode: company.pincode || '' });
                } else {
                  this.companyForm.patchValue({ pincode: company.pincode || '' });
                }
              }, 600);
            } else {
              this.companyForm.patchValue({ pincode: company.pincode || '' });
            }
          }, 600);
        } else {
          this.companyForm.patchValue({ pincode: company.pincode || '' });
        }
      }, 600);
    } else {
      this.companyForm.patchValue({ pincode: company.pincode || '' });
    }
  }

  private patchFormArray(controlName: string, values: string[]) {
    const fa = this.companyForm.get(controlName) as FormArray;
    while (fa.length) fa.removeAt(0);
    if (values.length === 0) {
      if (controlName === 'multiple_email_ids') {
        fa.push(this.fb.control('', Validators.email));
      } else {
        fa.push(this.fb.control('', [CommonValidators.phone()]));
      }
    } else {
      values.forEach(v => {
        if (controlName === 'multiple_email_ids') {
          fa.push(this.fb.control(v, Validators.email));
        } else {
          fa.push(this.fb.control(v, [CommonValidators.phone()]));
        }
      });
    }
  }

  cancelEdit() {
    this.isEditMode = false;
    this.editingCompanyId = null;
    this.existingLogoUrl = null;
    this.existingImages = [];
    this.deletedImageIds = [];
    this.logoPreview = null;
    this.selectedFile = null;
    this.companyImageFiles = [];
    this.companyImagePreviews = [];
    this.latitude = null;
    this.longitude = null;
    this.locationAddress = '';
    this.showMap = false;
    if (this.map) { this.map.remove(); this.map = null; }
    this.companyForm.reset({ is_active: true, ISI_certified: false, ISO_certified: false, COD_available: false, accept_terms_conditions: false });
    this.patchFormArray('multiple_email_ids', []);
    this.patchFormArray('contacts', []);
    this.errorMessage = '';
    this.successMessage = '';
  }

  removeExistingImage(index: number) {
    const img = this.existingImages[index];
    if (img?.id) this.deletedImageIds.push(img.id);
    this.existingImages.splice(index, 1);
  }

  ngAfterViewInit() {
    // Map initialized lazily
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

  // ===== LOCATION METHODS =====

  getLiveLocation() {
    if (!navigator.geolocation) {
      this.locationError = 'Geolocation is not supported by your browser.';
      return;
    }
    this.locationLoading = true;
    this.locationError = '';

    navigator.geolocation.getCurrentPosition(
      (position) => {
        this.latitude = parseFloat(position.coords.latitude.toFixed(6));
        this.longitude = parseFloat(position.coords.longitude.toFixed(6));
        this.companyForm.patchValue({ latitude: this.latitude, longitude: this.longitude });
        this.locationLoading = false;
        this.showMap = true;
        this.reverseGeocode(this.latitude, this.longitude);
        this.cdr.detectChanges();
        this.initMap(this.latitude!, this.longitude!);
      },
      (error) => {
        this.locationLoading = false;
        switch (error.code) {
          case error.PERMISSION_DENIED:
            this.locationError = 'Location permission denied. Please allow location access in your browser.';
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

  onCoordinateChange() {
    const latValue = this.companyForm.get('latitude')?.value;
    const lngValue = this.companyForm.get('longitude')?.value;
    if (latValue === null || latValue === '' || lngValue === null || lngValue === '') {
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
    this.companyForm.patchValue({ latitude: this.latitude, longitude: this.longitude }, { emitEvent: false });
    this.showMap = true;
    this.cdr.detectChanges();
    if (this.map && this.marker) {
      this.map.setView([this.latitude, this.longitude], this.map.getZoom() || 18);
      this.marker.setLatLng([this.latitude, this.longitude]);
    } else {
      this.initMap(this.latitude, this.longitude);
    }
    this.reverseGeocode(this.latitude, this.longitude);
  }

  reverseGeocode(lat: number, lng: number) {
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`)
      .then(res => res.json())
      .then(data => {
        this.locationAddress = data.display_name || '';
        this.companyForm.patchValue({ pickup_location: this.locationAddress });
      })
      .catch(() => {
        this.locationAddress = '';
        this.companyForm.patchValue({ pickup_location: '' });
      });
  }

  initMap(lat: number, lng: number) {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    const icon = L.divIcon({
      className: '',
      html: `
        <div style="position:relative;width:36px;height:48px;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.45))">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 32" width="36" height="48">
            <path d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z"
                  fill="#e74c3c" stroke="#c0392b" stroke-width="0.8"/>
            <circle cx="12" cy="8" r="3.5" fill="#fff"/>
          </svg>
        </div>`,
      iconSize: [36, 48],
      iconAnchor: [18, 48],
      popupAnchor: [0, -50]
    });

    this.map = L.map('company-map').setView([lat, lng], 18);
    const satellite = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution: 'Tiles © Esri — Source: Esri, Maxar, Earthstar Geographics',
        maxZoom: 19
      }
    );
    const street = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    });
    satellite.addTo(this.map);
    this.map.whenReady(() => {
      this.map?.invalidateSize({ animate: false });
    });
    L.control.layers(
      { 'Satellite': satellite, 'Street Map': street },
      {},
      { position: 'topright' }
    ).addTo(this.map);

    this.marker = L.marker([lat, lng], { icon, draggable: true })
      .addTo(this.map)
      .bindPopup('<b>Company Location</b><br>Drag pin or click map to adjust')
      .openPopup();

    this.marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.latitude = parseFloat(pos.lat.toFixed(6));
      this.longitude = parseFloat(pos.lng.toFixed(6));
      this.companyForm.patchValue({ latitude: this.latitude, longitude: this.longitude });
      this.reverseGeocode(this.latitude, this.longitude);
    });

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const { lat, lng } = e.latlng;
      this.latitude = parseFloat(lat.toFixed(6));
      this.longitude = parseFloat(lng.toFixed(6));
      this.companyForm.patchValue({ latitude: this.latitude, longitude: this.longitude });
      this.marker?.setLatLng([lat, lng]);
      this.reverseGeocode(this.latitude, this.longitude);
    });
  }

  clearLocation() {
    this.latitude = null;
    this.longitude = null;
    this.locationAddress = '';
    this.locationError = '';
    this.showMap = false;
    this.companyForm.patchValue({ latitude: null, longitude: null, pickup_location: '' });
    if (this.map) { this.map.remove(); this.map = null; }
  }

  // ===== DROPDOWN LOADERS =====

  loadStates() {
    this.stateService.getAllStates().subscribe({
      next: (res: any) => {
        if (res.data) {
          this.states = res.data;

          // states load झाल्यावर seller information आणा
          if (!this.isEditMode) {
            this.loadSellerDetailsForCompany();
          }
        }
      },
      error: (err) => {
        console.error('State load error:', err);
      }
    });
  }

  loadDistricts(stateId: number) {
    this.districtService.getDistrictsByState(stateId).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.districts = res.data;
        }
      }
    });
  }

  loadTalukas(stateId: number, districtId: number) {
    this.districtService.getTalukas(stateId, districtId).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.talukas = res.data;
          this.companyForm.patchValue({ taluka: '' });
        }
      },
      error: (err) => {
        console.error('Taluka load error:', err);
        this.talukas = [];
        this.companyForm.patchValue({ taluka: '' });
      }
    });
  }

  loadVillages(stateId: number, districtId: number, talukaId: number) {
    this.districtService.getVillages(stateId, districtId, talukaId).subscribe({
      next: (res: any) => {
        if (res.status === 'success') {
          this.villages = res.data;
          this.companyForm.patchValue({ village: '' });
        }
      },
      error: (err) => {
        console.error('Village load error:', err);
        this.villages = [];
        this.companyForm.patchValue({ village: '' });
      }
    });
  }

  // ===== FORM ARRAY GETTERS =====

  get multipleEmailIds() {
    return this.companyForm.get('multiple_email_ids') as FormArray;
  }

  get contacts() {
    return this.companyForm.get('contacts') as FormArray;
  }

  // ===== INPUT HELPERS =====

  allowOnlyText(event: any) {
    const charCode = event.which ? event.which : event.keyCode;
    if (
      !(charCode >= 65 && charCode <= 90) &&
      !(charCode >= 97 && charCode <= 122) &&
      charCode !== 32
    ) {
      event.preventDefault();
    }
  }

  allowOnlyNumber(event: KeyboardEvent) {
    const charCode = event.which ? event.which : event.keyCode;
    if (charCode < 48 || charCode > 57) {
      event.preventDefault();
    }
  }

  // ===== EMAIL & CONTACT ARRAY METHODS =====

  addEmail() {
    this.multipleEmailIds.push(this.fb.control('', Validators.email));
  }

  removeEmail(index: number) {
    this.multipleEmailIds.removeAt(index);
  }

  addContact() {
    this.contacts.push(this.fb.control('', [Validators.required, CommonValidators.phone()]));
  }

  removeContact(index: number) {
    this.contacts.removeAt(index);
  }

  // ===== FILE HANDLERS =====

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isFileDragged = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isFileDragged = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isFileDragged = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  handleFile(file: File) {
    const validTypes = ['image/png', 'image/jpg', 'image/jpeg', 'image/avif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      this.alertService.unialert('Please upload only PNG, JPG or JPEG images');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      this.alertService.unialert('File size should not exceed 2MB');
      return;
    }
    this.selectedFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.logoPreview = e.target.result;
    };
    reader.readAsDataURL(file);
  }

  removeLogo() {
    this.selectedFile = null;
    this.logoPreview = null;
  }

  seeAllCompany() {
    this.router.navigate(['/company-list']);
  }

  // ===== COMPANY IMAGES =====

  onCompanyImagesSelected(event: any) {
    const files: FileList = event.target.files;
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!['image/png', 'image/jpg', 'image/jpeg', 'image/webp'].includes(file.type)) continue;
      if (file.size > 5 * 1024 * 1024) continue;
      this.companyImageFiles.push(file);
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.companyImagePreviews.push({ url: e.target.result, name: file.name });
      };
      reader.readAsDataURL(file);
    }
    event.target.value = '';
  }

  removeCompanyImage(index: number) {
    this.companyImageFiles.splice(index, 1);
    this.companyImagePreviews.splice(index, 1);
  }

  // ===== VALIDATION HELPERS =====

  isFieldInvalid(fieldName: string): boolean {
    const field = this.companyForm.get(fieldName);
    return field ? (field.invalid && (field.dirty || field.touched)) : false;
  }

  focusNext(event: Event) {
    const form = event.target as HTMLElement;
    const focusableElements = Array.from(
      document.querySelectorAll('input, select, textarea')
    ) as HTMLElement[];
    const index = focusableElements.indexOf(form);
    if (index > -1 && index < focusableElements.length - 1) {
      event.preventDefault();
      focusableElements[index + 1].focus();
    }
  }

  getErrorMessage(fieldName: string): string {
    const field = this.companyForm.get(fieldName);
    if (field?.errors) {
      if (fieldName === 'owner_name' && field.errors['pattern']) { return 'Owner name should contain only letters'; }
      if (field.errors['required']) return `${this.formatFieldName(fieldName)} is required`;
      if (field.errors['invalidEmail']) return 'Please enter a valid email';
      if (field.errors['minlength']) return `Minimum ${field.errors['minlength'].requiredLength} characters required`;
      if (field.errors['invalidPhone']) return 'Phone must be 10 digits';
      if (field.errors['invalidStartDigit']) return 'Phone must start with 6-9';
      if (field.errors['pattern']) {
        if (fieldName === 'phone_number' || fieldName === 'contacts') return 'Please enter a valid 10-digit phone number';
        if (fieldName === 'pincode') return 'Please enter a valid 6-digit pincode';
        if (fieldName === 'company_pan_no') return 'Please enter a valid PAN number (e.g., ABCDE1234F)';
        if (fieldName === 'farm_registration_year') return 'Year must be 4 digits';
      }
      if (field.errors['invalidGST']) return 'Please enter a valid GST number (Example: 27ABCDE1234F1Z5)';
      if (field.errors['min']) return `Year must be ${field.errors['min'].min} or later`;
      if (field.errors['max']) return `Year must be ${field.errors['max'].max} or earlier`;
    }
    return '';
  }

  formatFieldName(field: string): string {
    return field.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }

  // ===== PAYMENT METHODS =====

  openRazorpay(orderData: any, companyId: number) {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: 'INR',
      name: 'Company Registration',
      description: 'Company Registration Payment',
      order_id: orderData.order_id,
      handler: (response: any) => {
        this.isPaymentProcessing = true;
        const verifyData = {
          payment_id: response.razorpay_payment_id,
          order_id: response.razorpay_order_id,
          signature: response.razorpay_signature,
          company_id: companyId
        };
        this.companyService.verifyPayment(verifyData).subscribe({
          next: (res: any) => {
            this.isPaymentProcessing = false;
            this.isSubmitting = false;
            if (res.status) {
              this.alertService.unialert('✅ Payment Successful! Company registration complete.');
              this.pendingCompanyId = null;
              this.companyForm.reset();
              this.selectedFile = null;
              this.companyImageFiles = [];
              this.companyImagePreviews = [];
              this.logoPreview = null;
              this.companyForm.patchValue({ is_active: true });
              this.router.navigate(['/company/list']);
            } else {
              this.alertService.unialert('⚠️ Payment verification failed. Contact support with payment ID: ' + response.razorpay_payment_id);
            }
          },
          error: (err) => {
            this.isPaymentProcessing = false;
            this.isSubmitting = false;
            console.error('Verify payment error:', err);
            this.alertService.unialert('❌ Payment verification failed. Please contact support.');
          }
        });
      },
      prefill: {
        name: this.companyForm.value.name || '',
        email: this.companyForm.value.email || '',
        contact: this.companyForm.value.phone_number || ''
      },
      modal: {
        ondismiss: () => {
          this.isSubmitting = false;
          this.isPaymentProcessing = false;
          this.alertService.unialert('⚠️ Payment cancelled. Company (ID: ' + companyId + ') created but payment not completed. Complete payment to be able to add product to company.');
        }
      },
      theme: { color: '#3399cc' }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (failResponse: any) => {
      this.isSubmitting = false;
      this.isPaymentProcessing = false;
      console.error('Payment failed:', failResponse.error);
      this.alertService.unialert('❌ Payment failed: ' + (failResponse.error?.description || 'Unknown error'));
    });
    rzp.open();
  }

  onSubmit() {
    if (this.companyForm.invalid) {
      Object.keys(this.companyForm.controls).forEach(key => {
        const control = this.companyForm.get(key);
        control?.markAsTouched();
      });
      this.alertService.unialert('Please fill all required fields correctly');
      return;
    }

    if (!this.isEditMode && !this.selectedFile) {
      this.alertService.unialert('Please upload company logo');
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    const userId = sessionStorage.getItem('user_id');
    const formData = new FormData();
    const formValue = this.companyForm.value;

    const selectedState = this.states.find(s => s.id == formValue.state);
    const selectedDistrict = this.districts.find(d => d.id == formValue.district);
    const selectedTaluka = this.talukas.find(t => t.id == formValue.taluka);
    const selectedVillage = this.villages.find(v => v.id == formValue.village);

    const sessionReferral = sessionStorage.getItem('referral_code');
    const formReferral = formValue.referral_code;
    const finalReferralCode = sessionReferral && sessionReferral.trim() !== ''
      ? sessionReferral
      : formReferral;
    if (finalReferralCode && finalReferralCode.trim() !== '') {
      formData.append('referral_code', finalReferralCode);
    }

    if (this.isEditMode && this.editingCompanyId) {
      formData.append('id', String(this.editingCompanyId));
    }

    formData.append('name', formValue.name);
    formData.append('owner_name', formValue.owner_name);
    if (formValue.company_slogan) formData.append('company_slogan', formValue.company_slogan);
    formData.append('email', formValue.email);
    formData.append('phone_number', formValue.phone_number);
    formData.append('accept_terms_conditions', formValue.accept_terms_conditions);
    if (formValue.website_url) formData.append('website_url', formValue.website_url);
    formData.append('address', formValue.address);
    formData.append('state', selectedState?.state_name || formValue.state || '');
    formData.append('district', selectedDistrict?.district_name || formValue.district || '');
    formData.append('taluka', selectedTaluka?.taluka_name || formValue.taluka || '');
    formData.append('village', selectedVillage?.village_name || formValue.village || '');
    formData.append('pincode', formValue.pincode);
    if (userId) formData.append('user', userId);
    if (formValue.gst_number) formData.append('gst_number', formValue.gst_number);
    if (formValue.registration_no) formData.append('registration_no', formValue.registration_no);
    if (formValue.IAN_No) formData.append('IAN_No', formValue.IAN_No);
    if (formValue.company_pan_no) formData.append('company_pan_no', formValue.company_pan_no);
    if (formValue.farm_registration_year) formData.append('farm_registration_year', formValue.farm_registration_year);

    const validEmails = formValue.multiple_email_ids.filter((e: string) => e && e.trim());
    if (validEmails.length > 0) formData.append('multiple_email_ids', JSON.stringify(validEmails));
    const validContacts = formValue.contacts.filter((c: string) => c && c.trim());
    if (validContacts.length > 0) formData.append('contacts', JSON.stringify(validContacts));

    const rawValue = this.companyForm.getRawValue();
    if (rawValue.facebook_url) formData.append('facebook_url', rawValue.facebook_url);
    if (rawValue.linkedin_url) formData.append('linkedin_url', rawValue.linkedin_url);
    if (rawValue.instagram_url) formData.append('instagram_url', rawValue.instagram_url);
    if (rawValue.privacy_policy_url) formData.append('privacy_policy_url', rawValue.privacy_policy_url);
    if (rawValue.terms_conditions_url) formData.append('terms_conditions_url', rawValue.terms_conditions_url);
    const socialMedia: any = {
      facebook: rawValue.facebook_url || '',
      linkedin: rawValue.linkedin_url || '',
      instagram: rawValue.instagram_url || '',
      privacy_policy_url: rawValue.privacy_policy_url || '',
      terms_conditions_url: rawValue.terms_conditions_url || ''
    };
    formData.append('social_media_accounts', JSON.stringify(socialMedia));
    if (formValue.whatsapp_no) formData.append('whatsapp_no', formValue.whatsapp_no);
    if (formValue.youtube_url) formData.append('youtube_url', formValue.youtube_url);
    if (formValue.short_description) formData.append('short_description', formValue.short_description);
    if (formValue.long_description) formData.append('long_description', formValue.long_description);
    formData.append('is_active', String(formValue.is_active));

    // === NEW FIELDS ===
    formData.append('ISI_certified', String(formValue.ISI_certified));
    formData.append('ISO_certified', String(formValue.ISO_certified));
    formData.append('COD_available', String(formValue.COD_available));

    if (formValue.latitude) formData.append('latitude', String(formValue.latitude));
    if (formValue.longitude) formData.append('longitude', String(formValue.longitude));
    if (this.locationAddress) formData.append('location_address', this.locationAddress);
    if (formValue.pickup_location) formData.append('pickup_location', formValue.pickup_location);

    if (this.selectedFile) {
      formData.append('logo', this.selectedFile, this.selectedFile.name);
    }
    this.companyImageFiles.forEach(file => {
      formData.append('images', file, file.name);
    });
    if (this.isEditMode && this.deletedImageIds.length > 0) {
      formData.append('delete_image_ids', JSON.stringify(this.deletedImageIds));
    }

    if (this.isEditMode) {
      // UPDATE
      this.companyService.updateCompany(formData).subscribe({
        next: (response: any) => {
          this.isSubmitting = false;
          if (response.status) {
            this.successMessage = response.message || 'Company updated successfully!';
            this.alertService.unialert(this.successMessage);
            this.loadMyCompanies();
            setTimeout(() => {
              this.cancelEdit();
              this.showCompanyList = true;
            }, 2000);
          } else {
            this.alertService.unialert(response.message || 'Update failed. Please try again.');
          }
        },
        error: (error: any) => {
          this.isSubmitting = false;
          console.error('Error updating company:', error);
          this.alertService.unialert(error.error?.message || 'Failed to update company. Please try again.');
        }
      });
    } else {
      // CREATE
      this.companyService.createCompany(formData).subscribe({
        next: (companyRes: any) => {
          if (!companyRes.status) {
            this.isSubmitting = false;
            this.alertService.unialert(companyRes.message || 'Failed to create company.');
            return;
          }
          const companyId: number = companyRes.data?.id ?? companyRes.id;
          this.pendingCompanyId = companyId;
          this.companyService.createPaymentOrder({ company_id: companyId }).subscribe({
            next: (paymentRes: any) => {
              if (!paymentRes.status) {
                this.isSubmitting = false;
                this.alertService.unialert('Failed to create payment order.');
                return;
              }
              this.openRazorpayAndCreateCompany(paymentRes, companyId);
            },
            error: (err: any) => {
              this.isSubmitting = false;
              this.alertService.unialert(err.error?.message || 'Payment order API failed.');
              console.error('Payment order error:', err);
            }
          });
        },
        error: (error: any) => {
          this.isSubmitting = false;
          let finalMessage = '';
          if (error.error?.errors) {
            const errors = error.error.errors;
            Object.keys(errors).forEach((field) => {
              const fieldErrors = errors[field];
              if (Array.isArray(fieldErrors)) {
                fieldErrors.forEach((msg: string) => {
                  finalMessage += msg + '\n';
                });
              }
            });
          } else {
            finalMessage = error.error?.message || 'Failed to create company. Please try again.';
          }
          this.errorMessage = finalMessage;
          this.alertService.unialert(this.errorMessage);
          console.error('Company creation error:', error);
        }
      });
    }
  }

  openRazorpayAndCreateCompany(orderData: any, companyId: number) {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: 'INR',
      name: 'Company Registration',
      description: 'Company Registration Payment',
      order_id: orderData.order_id,
      handler: (response: any) => {
        this.isPaymentProcessing = true;
        const verifyData = {
          payment_id: response.razorpay_payment_id,
          order_id: response.razorpay_order_id,
          signature: response.razorpay_signature,
          company_id: companyId
        };
        this.companyService.verifyPayment(verifyData).subscribe({
          next: (verifyRes: any) => {
            this.isPaymentProcessing = false;
            this.isSubmitting = false;
            if (verifyRes.status) {
              this.pendingCompanyId = null;
              this.successMessage = '✅ Payment verified! Company registered successfully.';
              this.companyForm.reset();
              this.selectedFile = null;
              this.companyImageFiles = [];
              this.companyImagePreviews = [];
              this.logoPreview = null;
              this.companyForm.patchValue({ is_active: true });
              setTimeout(() => this.router.navigate(['/company/list']), 1500);
            } else {
              this.alertService.unialert('Payment verification failed. Company ID: ' + companyId + '. Contact support with payment ID: ' + response.razorpay_payment_id);
            }
          },
          error: (err: any) => {
            this.isPaymentProcessing = false;
            this.isSubmitting = false;
            this.alertService.unialert('Verification failed. Company ID: ' + companyId + '. Contact support.');
            console.error('Verify payment error:', err);
          }
        });
      },
      prefill: {
        name: this.companyForm.value.name || '',
        email: this.companyForm.value.email || '',
        contact: this.companyForm.value.phone_number || ''
      },
      modal: {
        ondismiss: () => {
          this.isSubmitting = false;
          this.isPaymentProcessing = false;
          this.alertService.unialert('Payment cancelled. Company (ID: ' + companyId + ') created but not activated. Please complete payment.');
        }
      },
      theme: { color: '#3399cc' }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (failResponse: any) => {
      this.isSubmitting = false;
      this.isPaymentProcessing = false;
      this.alertService.unialert('Payment failed: ' + (failResponse.error?.description || 'Please try again.'));
      console.error('Razorpay payment failed:', failResponse.error);
    });
    rzp.open();
  }

  payCompany(company: any) {
    if (this.isPaymentProcessing) {
      return;
    }
    this.pendingCompanyId = company.id;
    this.isPaymentProcessing = true;
    this.companyService.createPaymentOrder({ company_id: company.id }).subscribe({
      next: (paymentRes: any) => {
        this.isPaymentProcessing = false;
        if (!paymentRes.status) {
          this.alertService.unialert(paymentRes.message || 'Failed to create payment order.');
          return;
        }
        this.openPendingCompanyPayment(paymentRes, company);
      },
      error: (err: any) => {
        this.isPaymentProcessing = false;
        this.alertService.unialert(err.error?.message || 'Payment order failed.');
      }
    });
  }

  openPendingCompanyPayment(orderData: any, company: any) {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: 'INR',
      name: 'Company Registration',
      description: 'Company Registration Payment',
      order_id: orderData.order_id,
      prefill: {
        name: company.owner_name || '',
        email: company.email || '',
        contact: company.phone_number || ''
      },
      handler: (response: any) => {
        this.isPaymentProcessing = true;
        const verifyData = {
          payment_id: response.razorpay_payment_id,
          order_id: response.razorpay_order_id,
          signature: response.razorpay_signature,
          company_id: company.id
        };
        this.companyService.verifyPayment(verifyData).subscribe({
          next: (verifyRes: any) => {
            this.isPaymentProcessing = false;
            if (verifyRes.status) {
              company.payment_status = 'paid';
              this.alertService.unialert('Payment Successful');
              this.loadMyCompanies();
            } else {
              this.alertService.unialert(verifyRes.message || 'Payment verification failed.');
            }
          },
          error: (err: any) => {
            this.isPaymentProcessing = false;
            this.alertService.unialert(err.error?.message || 'Payment verification failed.');
          }
        });
      },
      modal: {
        ondismiss: () => {
          this.isPaymentProcessing = false;
        }
      },
      theme: { color: '#3399cc' }
    };
    const rzp = new Razorpay(options);
    rzp.on('payment.failed', (response: any) => {
      this.isPaymentProcessing = false;
      this.alertService.unialert(response.error?.description || 'Payment Failed.');
    });
    rzp.open();
  }

  // ===== TERMS MODAL =====

  showTermsModal = false;

  openTermsModal(event: Event) {
    event.preventDefault();
    this.showTermsModal = true;
    document.body.style.overflow = 'hidden';
  }

  closeTermsModal() {
    this.showTermsModal = false;
    document.body.style.overflow = '';
  }

  agreeAndCloseTerms() {
    this.companyForm.patchValue({ accept_terms_conditions: true });
    this.companyForm.get('accept_terms_conditions')?.markAsTouched();
    this.closeTermsModal();
  }


  private loadSellerDetailsForCompany() {
    this.sellerService.getSellerList().subscribe({
      next: (res: any) => {

        if (res.status === 'success' && res.data?.length > 0) {

          const sorted = [...res.data].sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          const seller = sorted[0];

          if (!seller) return;

          this.companyForm.patchValue({
            owner_name: seller.contact_person_name || '',
            email: seller.email || '',
            phone_number: seller.mobile || '',
            whatsapp_no: seller.mobile || '',
            address: seller.address || '',
            pincode: seller.pincode || '',
            company_pan_no: seller.pan_number || ''
          });

          // State seller मधून auto select
          if (seller.state) {
            this.patchSellerState(seller.state);
          }
        }
      },

      error: (err: any) => {
        console.error('Seller details load failed:', err);
      }
    });
  }

  private patchSellerState(sellerState: string) {

    if (!sellerState || !this.states.length) return;

    const stateValue = sellerState.trim().toLowerCase();

    const matchedState = this.states.find((state: any) => {

      const stateName = String(state.state_name || '').toLowerCase();
      const stateCode = String(
        state.state_code ||
        state.code ||
        state.short_code ||
        ''
      ).toLowerCase();

      return (
        stateCode === stateValue ||
        stateName === stateValue ||
        String(state.id) === String(sellerState)
      );
    });

    if (matchedState) {
      this.companyForm.patchValue({
        state: matchedState.id
      });
    }
  }
}
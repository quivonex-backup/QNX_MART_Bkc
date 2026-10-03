import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PropertyCreateService } from '../../../services/property-create.service';
import { StateMasterService } from '../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../services/State-Master/district-master.service';

@Component({
  selector: 'app-property-list',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './property-list.component.html',
  styleUrl: './property-list.component.css'
})
export class PropertyListComponent implements OnInit, OnDestroy {

  // All properties
  allProperties: any[] = [];
  filteredProperties: any[] = [];
  paginatedProperties: any[] = [];

  // Filters
  priceMin: number | null = null;
  priceMax: number | null = null;
  selectedState: number | null = null;
  selectedDistrict: number | null = null;
  selectedPropertyType: string = '';
  selectedTransactionType: string = '';
  selectedAmenities: number[] = [];

  // Sort & Pagination
  selectedSort: string = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [5, 10, 20, 40];
  startIndex = 0;
  endIndex = 0;

  // Sidebar toggle
  filterOpen = false;

  // Dropdown data
  states: any[] = [];
  districts: any[] = [];
  amenitiesList: any[] = [];

  // Static choices
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

  private propertySliderInterval: any;

  constructor(
    private propertyService: PropertyCreateService,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService,
    private route: ActivatedRoute,
    public router: Router,
  ) { }

  ngOnDestroy(): void {

    if (this.propertySliderInterval) {

      clearInterval(this.propertySliderInterval);

      this.propertySliderInterval = null;

    }

  }

  ngOnInit() {
    this.loadStates();
    this.loadAmenities();

    // ⭐ हा अत्यंत महत्त्वाचा कोड नॅव्हिबारमधील क्लिक कॅच करेल
    this.route.queryParams.subscribe(params => {
      this.selectedPropertyType = params['type'] || '';

      // जर प्रॉपर्टीज आधीच लोड झाल्या असतील तर थेट फिल्टर लावा, नाहीतर लोड करा
      if (this.allProperties.length > 0) {
        this.applyFilters();
      } else {
        this.loadProperties();
      }
    });

    // Auto image slider
    this.startPropertyAutoSlider();
  }

  startPropertyAutoSlider() {

    // Prevent multiple intervals
    if (this.propertySliderInterval) {
      clearInterval(this.propertySliderInterval);
    }

    this.propertySliderInterval = setInterval(() => {

      if (!this.paginatedProperties || this.paginatedProperties.length === 0) {
        return;
      }

      this.paginatedProperties.forEach((property: any) => {

        if (
          property &&
          property.images &&
          property.images.length > 1
        ) {

          const currentIndex =
            Number(property.currentImgIndex) || 0;

          property.currentImgIndex =
            currentIndex >= property.images.length - 1
              ? 0
              : currentIndex + 1;
        }

      });

    }, 3000); // every 4 seconds

  }

  // ---------- LOAD PROPERTIES ----------
  loadProperties() {
    this.propertyService.getApprovedProperties().subscribe({
      next: (res: any) => {
        if (res.status && res.data) {
          this.allProperties = res.data.map((p: any) => {

            // Price = min base_price across pricing_slabs
            let price = 0;
            if (p.pricing_slabs && p.pricing_slabs.length > 0) {
              const prices = p.pricing_slabs
                .map((s: any) => parseFloat(s.base_price) || 0)
                .filter((n: number) => n > 0);
              price = prices.length ? Math.min(...prices) : 0;
            }

            const slug = p.slug;

            // Images – fallback to placeholder if empty
            let images = (p.images && p.images.length > 0)
              ? [...p.images]
              : [{ image_s3_key: 'https://via.placeholder.com/400x300/cccccc/ffffff?text=No+Image', is_primary: false }];

            images.sort((a: any, b: any) => (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0));

            return {
              ...p,
              price,
              slug,
              images,
              currentImgIndex: 0
            };
          });
        } else {
          this.allProperties = [];
        }
        this.applyFilters();
      },
      error: (err) => {
        console.error('Failed to load properties', err);
        this.allProperties = [];
        this.applyFilters();
      }
    });
  }

  // ---------- IMAGE CAROUSEL ----------

  nextImage(property: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!property || !property.images || property.images.length <= 1) {
      return;
    }

    const currentIndex = Number(property.currentImgIndex) || 0;

    property.currentImgIndex =
      currentIndex === property.images.length - 1
        ? 0
        : currentIndex + 1;

    console.log(
      'Next Image:',
      property.currentImgIndex,
      property.images[property.currentImgIndex]
    );
  }


  prevImage(property: any, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!property || !property.images || property.images.length <= 1) {
      return;
    }

    const currentIndex = Number(property.currentImgIndex) || 0;

    property.currentImgIndex =
      currentIndex === 0
        ? property.images.length - 1
        : currentIndex - 1;

    console.log(
      'Previous Image:',
      property.currentImgIndex,
      property.images[property.currentImgIndex]
    );
  }


  setImage(property: any, index: number, event: Event) {
    event.preventDefault();
    event.stopPropagation();

    if (!property || !property.images || !property.images[index]) {
      return;
    }

    property.currentImgIndex = index;

    console.log(
      'Selected Image:',
      property.currentImgIndex,
      property.images[property.currentImgIndex]
    );
  }

  // ---------- LOAD MASTER DATA ----------
  loadStates() {
    this.stateService.getAllStates().subscribe({
      next: (res: any) => {
        if (res.data) this.states = res.data;
      },
      error: (err) => console.error('States load error', err)
    });
  }

  loadDistricts(stateId: number) {
    this.districtService.getDistrictsByState(stateId).subscribe({
      next: (res: any) => {
        if (res.status === 'success') this.districts = res.data;
      },
      error: (err) => console.error('Districts load error', err)
    });
  }

  loadAmenities() {
    this.propertyService.getAmenitiesList().subscribe({
      next: (res: any) => {
        if (res.status) this.amenitiesList = res.data || [];
      },
      error: (err) => console.error('Amenities load error', err)
    });
  }

  // ---------- STATE / DISTRICT ----------
  onStateChange(stateId: number | null) {
    if (stateId) {
      this.loadDistricts(stateId);
      this.selectedDistrict = null;
    } else {
      this.districts = [];
      this.selectedDistrict = null;
    }
    this.applyFilters();
  }

  // ---------- FILTERS ----------
  applyFilters(search: string = '') {
    let temp = [...this.allProperties];

    if (this.priceMin !== null) temp = temp.filter(p => p.price >= this.priceMin!);
    if (this.priceMax !== null) temp = temp.filter(p => p.price <= this.priceMax!);

    if (this.selectedState) {
      const stateObj = this.states.find(s => s.id === this.selectedState);
      if (stateObj) {
        const sName = stateObj.state_name.toLowerCase();
        temp = temp.filter(p =>
          p.city?.toLowerCase().includes(sName) ||
          p.address?.toLowerCase().includes(sName)
        );
      }
    }

    if (this.selectedDistrict) {
      const distObj = this.districts.find(d => d.id === this.selectedDistrict);
      if (distObj) {
        const dName = distObj.district_name.toLowerCase();
        temp = temp.filter(p =>
          p.city?.toLowerCase().includes(dName) ||
          p.area?.toLowerCase().includes(dName) ||
          p.address?.toLowerCase().includes(dName)
        );
      }
    }

    if (this.selectedPropertyType) {
      temp = temp.filter(p => p.property_type === this.selectedPropertyType);
    }

    if (this.selectedTransactionType) {
      temp = temp.filter(p => p.transaction_type === this.selectedTransactionType);
    }

    if (this.selectedAmenities.length) {
      temp = temp.filter(p =>
        Array.isArray(p.amenities) &&
        p.amenities.some((a: any) => this.selectedAmenities.includes(a.id))
      );
    }

    if (search) {
      const s = search.toLowerCase();
      temp = temp.filter(p =>
        p.city?.toLowerCase().includes(s) ||
        p.area?.toLowerCase().includes(s) ||
        p.property_type?.toLowerCase().includes(s)
      );
    }

    switch (this.selectedSort) {
      case 'price_low': temp.sort((a, b) => a.price - b.price); break;
      case 'price_high': temp.sort((a, b) => b.price - a.price); break;
      case 'a_z': temp.sort((a, b) =>
        this.getPropertyTypeLabel(a.property_type).localeCompare(this.getPropertyTypeLabel(b.property_type))); break;
      case 'z_a': temp.sort((a, b) =>
        this.getPropertyTypeLabel(b.property_type).localeCompare(this.getPropertyTypeLabel(a.property_type))); break;
    }

    this.filteredProperties = temp;
    this.resetPagination();
  }

  // ---------- PAGINATION ----------
  resetPagination() {
    this.currentPage = 1;
    this.totalItems = this.filteredProperties.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePaginatedProperties();
  }

  updatePaginatedProperties() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedProperties = this.filteredProperties.slice(start, end);
    this.startIndex = this.totalItems === 0 ? 0 : start + 1;
    this.endIndex = Math.min(end, this.totalItems);
  }

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePaginatedProperties();
  }

  goToPage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProperties();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() { if (this.currentPage > 1) this.goToPage(this.currentPage - 1); }
  nextPage() { if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1); }
  firstPage() { this.goToPage(1); }
  lastPage() { this.goToPage(this.totalPages); }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    pages.push(1);
    if (total <= 7) {
      for (let i = 2; i <= total; i++) pages.push(i);
    } else {
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);
      if (current <= 3) { start = 2; end = 4; }
      else if (current >= total - 2) { start = total - 3; end = total - 1; }
      if (start > 2) pages.push('...');
      for (let i = start; i <= end; i++) pages.push(i);
      if (end < total - 1) pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  // ---------- UTILITY ----------
  clearAllFilters() {
    this.priceMin = null;
    this.priceMax = null;
    this.selectedState = null;
    this.selectedDistrict = null;
    this.selectedPropertyType = '';
    this.selectedTransactionType = '';
    this.selectedAmenities = [];
    this.selectedSort = '';
    this.districts = [];
    this.applyFilters();
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.priceMin !== null || this.priceMax !== null) count++;
    if (this.selectedState) count++;
    if (this.selectedDistrict) count++;
    if (this.selectedPropertyType) count++;
    if (this.selectedTransactionType) count++;
    if (this.selectedAmenities.length) count++;
    return count;
  }

  toggleAmenity(amenityId: number, event: any) {
    if (event.target.checked) {
      if (!this.selectedAmenities.includes(amenityId)) {
        this.selectedAmenities.push(amenityId);
      }
    } else {
      this.selectedAmenities = this.selectedAmenities.filter(id => id !== amenityId);
    }
    this.applyFilters();
  }

  // ---------- HELPERS ----------
  getStateName(stateId: number | null): string {
    if (!stateId) return '';
    const state = this.states.find(s => s.id === stateId);
    return state ? state.state_name : '';
  }

  getDistrictName(districtId: number | null): string {
    if (!districtId) return '';
    const district = this.districts.find(d => d.id === districtId);
    return district ? district.district_name : '';
  }

  getPropertyTypeLabel(value: string): string {
    const found = this.propertyTypes.find(pt => pt.value === value);
    return found ? found.label : (value || '');
  }

  getTransactionTypeLabel(value: string): string {
    const found = this.transactionTypes.find(tt => tt.value === value);
    return found ? found.label : (value || '');
  }

  formatPrice(price: number): string {
    if (!price || price <= 0) return 'Price on request';
    return '₹ ' + price.toLocaleString('en-IN');
  }

  // ---------- PUBLIC DISPLAY (hide identity / exact location) ----------
  publicTitle(property: any): string {
    if (!property) return 'Property';
    const type = this.getPropertyTypeLabel(property.property_type);
    const city = property.city || '';
    if (type && city) return `${type} in ${city}`;
    return type || city || 'Property';
  }

  publicDescription(property: any): string {
    if (!property) return '';
    const type = this.getPropertyTypeLabel(property.property_type);
    const txn = this.getTransactionTypeLabel(property.transaction_type);
    const city = property.city || '';
    let line = `${type}`;
    if (txn) line += ` • ${txn}`;
    if (city) line += ` • ${city}`;
    return line + '. Contact us for complete details.';
  }

  locationLine(property: any): string {
    if (!property) return '';
    return property.city || 'Location available on request';
  }

  // Strip sensitive fields before caching / navigating
  private sanitize(property: any): any {
    const p: any = { ...property };
    p.title = this.publicTitle(property);
    delete p.builder;
    delete p.property_website_url;
    delete p.rera_website;
    delete p.rera_additional_urls;
    delete p.rera_qr_code;
    delete p.google_location_url;
    delete p.address;
    delete p.landmark;
    delete p.pincode;
    delete p.latitude;
    delete p.longitude;
    return p;
  }

  goToDetails(property: any) {
    try {
      sessionStorage.setItem('selected_property', JSON.stringify(this.sanitize(property)));
    } catch (e) {
      console.warn('Failed to cache property', e);
    }
    this.router.navigate(['/property-detail', property.slug]);
  }

  goToEnquiry(property: any) {
    try {
      sessionStorage.setItem('selected_property', JSON.stringify(this.sanitize(property)));
    } catch (e) {
      console.warn('Failed to cache property', e);
    }

    const refCode =
      this.route.snapshot.queryParamMap.get('ref_code') ||
      this.route.snapshot.queryParamMap.get('ref');

    const queryParams: any = { property: property.slug };
    if (refCode) queryParams.ref_code = refCode;

    this.router.navigate(['/property-enquiry'], { queryParams });
  }
}
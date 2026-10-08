import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';

import { PropertyCreateService } from '../../../services/property-create.service';
import { StateMasterService } from '../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../services/State-Master/district-master.service';
import { finalize } from 'rxjs';

@Component({
  selector: 'app-property-list',
  imports: [
    FormsModule,
    CommonModule,
    RouterModule
  ],
  templateUrl: './property-list.component.html',
  styleUrl: './property-list.component.css'
})
export class PropertyListComponent implements OnInit, OnDestroy {

  // ============================================================
  // ALL PROPERTIES
  // ============================================================

  allProperties: any[] = [];
  filteredProperties: any[] = [];
  paginatedProperties: any[] = [];

  // ============================================================
  // FILTERS
  // ============================================================

  priceMin: number | null = null;
  priceMax: number | null = null;

  selectedState: number | null = null;
  selectedDistrict: number | null = null;

  selectedPropertyType: string = '';
  selectedTransactionType: string = '';

  selectedAmenities: number[] = [];

  // ============================================================
  // SORT & PAGINATION
  // ============================================================

  selectedSort: string = '';

  currentPage = 1;
  itemsPerPage = 10;

  totalItems = 0;
  totalPages = 0;

  pageSizeOptions = [5, 10, 20, 40];

  startIndex = 0;
  endIndex = 0;

  // ============================================================
  // SIDEBAR
  // ============================================================

  filterOpen = false;

  // ============================================================
  // MASTER DATA
  // ============================================================

  states: any[] = [];
  districts: any[] = [];
  amenitiesList: any[] = [];

  // ============================================================
  // PROPERTY TYPES
  // ============================================================

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

  // ============================================================
  // TRANSACTION TYPES
  // ============================================================

  transactionTypes = [
    { value: 'sale', label: 'For Sale' },
    { value: 'rent', label: 'For Rent' },
    { value: 'lease', label: 'For Lease' },
    { value: 'pg', label: 'PG / Hostel' }
  ];

  // ============================================================
  // IMAGE AUTO SLIDER
  // ============================================================

  private propertySliderInterval: any;
  loading = false;

  videoPopupProperty: any = null;
  popupVideoIndex = 0;

  // ============================================================
  // CONSTRUCTOR
  // ============================================================

  constructor(
    private propertyService: PropertyCreateService,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService,
    private route: ActivatedRoute,
    public router: Router
  ) { }

  // ============================================================
  // INIT
  // ============================================================

  ngOnInit(): void {

    this.loadStates();

    this.loadAmenities();

    this.route.queryParams.subscribe(params => {

      this.selectedPropertyType =
        params['type'] || '';

      if (this.allProperties.length > 0) {

        this.applyFilters();

      } else {

        this.loadProperties();

      }

    });

    this.startPropertyAutoSlider();

  }

  // ============================================================
  // DESTROY
  // ============================================================

  ngOnDestroy(): void {

    if (this.propertySliderInterval) {

      clearInterval(
        this.propertySliderInterval
      );

      this.propertySliderInterval = null;

    }

  }


  openPropertyVideoPopup(property: any, event?: Event): void {
    event?.stopPropagation();
    if (!property?.propertyVideos?.length) return;
    this.videoPopupProperty = property;
    this.popupVideoIndex = 0;
  }

  closePropertyVideoPopup(): void {
    // Removing the *ngIf video element stops playback and releases it.
    this.videoPopupProperty = null;
    this.popupVideoIndex = 0;
  }

  changePopupVideo(direction: number): void {
    const count = this.videoPopupProperty?.propertyVideos?.length || 0;
    if (!count) return;
    this.popupVideoIndex = (this.popupVideoIndex + direction + count) % count;
  }

  // ============================================================
  // PROPERTY IMAGE AUTO SLIDER
  // ============================================================

  startPropertyAutoSlider(): void {

    if (this.propertySliderInterval) {

      clearInterval(
        this.propertySliderInterval
      );

    }

    this.propertySliderInterval =
      setInterval(() => {

        if (
          !this.paginatedProperties ||
          this.paginatedProperties.length === 0
        ) {

          return;

        }

        this.paginatedProperties.forEach(
          (property: any) => {

            if (
              property &&
              property.images &&
              property.images.length > 1
            ) {

              const currentIndex =
                Number(
                  property.currentImgIndex
                ) || 0;

              property.currentImgIndex =
                currentIndex >=
                  property.images.length - 1
                  ? 0
                  : currentIndex + 1;

            }

          }
        );

      }, 3000);

  }

  // ============================================================
  // LOAD PROPERTIES
  // ============================================================

  loadProperties(): void {

    this.loading = true;

    this.propertyService
      .getApprovedProperties()
      .pipe(
        finalize(() => {
          // Hide skeleton loader on success or error
          this.loading = false;
        })
      )
      .subscribe({

        next: (res: any) => {

          if (
            res.status &&
            res.data
          ) {

            this.allProperties =
              res.data.map(
                (p: any) => {

                  // =================================================
                  // PRICE
                  // =================================================

                  let price = 0;

                  if (
                    p.pricing_slabs &&
                    p.pricing_slabs.length > 0
                  ) {

                    const prices =
                      p.pricing_slabs
                        .map(
                          (s: any) =>
                            parseFloat(
                              s.base_price
                            ) || 0
                        )
                        .filter(
                          (n: number) =>
                            n > 0
                        );

                    price =
                      prices.length
                        ? Math.min(...prices)
                        : 0;

                  }

                  const slug = p.slug;

                  // =================================================
                  // IMAGES
                  // =================================================

                  let images =
                    (
                      p.images &&
                      p.images.length > 0
                    )
                      ? [...p.images]
                      : [
                        {
                          image_s3_key:
                            'https://via.placeholder.com/400x300/cccccc/ffffff?text=No+Image',
                          is_primary: false
                        }
                      ];

                  // Primary image first
                  images.sort(
                    (a: any, b: any) =>
                      (b.is_primary ? 1 : 0) -
                      (a.is_primary ? 1 : 0)
                  );

                  // =================================================
                  // PROPERTY-WISE VIDEOS
                  // IMPORTANT:
                  // प्रत्येक property चे videos त्या property मध्येच
                  // =================================================

                  const propertyVideos =
                    Array.isArray(p?.videos)

                      ? p.videos
                        .map(
                          (video: any) => {

                            const videoUrl =
                              video?.video_s3_key
                              ||
                              video?.video_url
                              ||
                              video?.url
                              ||
                              video?.file_url
                              ||
                              '';

                            if (!videoUrl) {

                              return null;

                            }

                            return {

                              ...video,

                              video_url:
                                videoUrl

                            };

                          }
                        )
                        .filter(
                          (video: any) =>
                            video !== null
                        )

                      : [];

                  // =================================================
                  // RETURN PROPERTY
                  // =================================================

                  return {

                    ...p,

                    price,

                    slug,

                    images,

                    currentImgIndex: 0,

                    // Property-specific videos
                    propertyVideos,

                    // Each property has its own current video index
                    currentVideoIndex: 0,

                    // Each property has its own playing state
                    isVideoPlaying: true

                  };

                }
              );

          } else {

            this.allProperties = [];

          }

          this.applyFilters();

        },

        error: (err) => {

          console.error(
            'Failed to load properties',
            err
          );

          this.allProperties = [];

          this.applyFilters();

        }

      });

  }

  // ============================================================
  // NEXT PROPERTY IMAGE
  // ============================================================

  nextImage(
    property: any,
    event: Event
  ): void {

    event.preventDefault();
    event.stopPropagation();

    if (
      !property ||
      !property.images ||
      property.images.length <= 1
    ) {

      return;

    }

    const currentIndex =
      Number(
        property.currentImgIndex
      ) || 0;

    property.currentImgIndex =
      currentIndex ===
        property.images.length - 1
        ? 0
        : currentIndex + 1;

  }

  // ============================================================
  // PREVIOUS PROPERTY IMAGE
  // ============================================================

  prevImage(
    property: any,
    event: Event
  ): void {

    event.preventDefault();
    event.stopPropagation();

    if (
      !property ||
      !property.images ||
      property.images.length <= 1
    ) {

      return;

    }

    const currentIndex =
      Number(
        property.currentImgIndex
      ) || 0;

    property.currentImgIndex =
      currentIndex === 0
        ? property.images.length - 1
        : currentIndex - 1;

  }

  // ============================================================
  // SELECT PROPERTY IMAGE
  // ============================================================

  setImage(
    property: any,
    index: number,
    event: Event
  ): void {

    event.preventDefault();
    event.stopPropagation();

    if (
      !property ||
      !property.images ||
      !property.images[index]
    ) {

      return;

    }

    property.currentImgIndex =
      index;

  }

  // ============================================================
  // PROPERTIES HAVING VIDEOS
  // ============================================================

  get propertiesWithVideos():
    any[] {

    return this.filteredProperties.filter(
      (property: any) =>
        property?.propertyVideos?.length > 0
    );

  }

  // ============================================================
  // NEXT VIDEO
  // ONLY FOR CURRENT PROPERTY
  // ============================================================

  nextPropertyVideo(
    property: any,
    event?: Event
  ): void {

    if (event) {

      event.preventDefault();
      event.stopPropagation();

    }

    if (
      !property?.propertyVideos?.length
    ) {

      return;

    }

    property.currentVideoIndex =
      (
        (
          property.currentVideoIndex ||
          0
        )
        +
        1
      )
      %
      property.propertyVideos.length;

    property.isVideoPlaying =
      true;

  }

  // ============================================================
  // PREVIOUS VIDEO
  // ONLY FOR CURRENT PROPERTY
  // ============================================================

  previousPropertyVideo(
    property: any,
    event?: Event
  ): void {

    if (event) {

      event.preventDefault();
      event.stopPropagation();

    }

    if (
      !property?.propertyVideos?.length
    ) {

      return;

    }

    property.currentVideoIndex =
      (
        (
          property.currentVideoIndex ||
          0
        )
        -
        1
        +
        property.propertyVideos.length
      )
      %
      property.propertyVideos.length;

    property.isVideoPlaying =
      true;

  }

  // ============================================================
  // PLAY / PAUSE
  // ONLY CURRENT PROPERTY
  // ============================================================

  togglePropertyVideo(
    property: any,
    video: HTMLVideoElement,
    event?: Event
  ): void {

    if (event) {

      event.preventDefault();
      event.stopPropagation();

    }

    if (!video) {

      return;

    }

    if (video.paused) {

      const playPromise =
        video.play();

      if (playPromise) {

        playPromise.catch(
          (err) =>
            console.warn(
              'Property video play failed',
              err
            )
        );

      }

      property.isVideoPlaying =
        true;

    } else {

      video.pause();

      property.isVideoPlaying =
        false;

    }

  }

  // ============================================================
  // FORCE VIDEO MUTED
  // ============================================================

  forcePropertyVideoMute(
    video: HTMLVideoElement
  ): void {

    if (!video) {

      return;

    }

    video.muted = true;

    video.defaultMuted = true;

    video.volume = 0;

  }

  // ============================================================
  // MUTE / UNMUTE
  // ============================================================

  togglePropertyVideoMute(
    video: HTMLVideoElement,
    event?: Event
  ): void {

    if (event) {

      event.preventDefault();
      event.stopPropagation();

    }

    if (!video) {

      return;

    }

    if (video.muted) {

      video.muted = false;

      video.volume = 1;

    } else {

      video.muted = true;

      video.volume = 0;

    }

  }

  // ============================================================
  // LOAD STATES
  // ============================================================

  loadStates(): void {

    this.stateService
      .getAllStates()
      .subscribe({

        next: (res: any) => {

          if (res.data) {

            this.states =
              res.data;

          }

        },

        error: (err) =>

          console.error(
            'States load error',
            err
          )

      });

  }

  // ============================================================
  // LOAD DISTRICTS
  // ============================================================

  loadDistricts(
    stateId: number
  ): void {

    this.districtService
      .getDistrictsByState(
        stateId
      )
      .subscribe({

        next: (res: any) => {

          if (
            res.status ===
            'success'
          ) {

            this.districts =
              res.data;

          }

        },

        error: (err) =>

          console.error(
            'Districts load error',
            err
          )

      });

  }

  // ============================================================
  // LOAD AMENITIES
  // ============================================================

  loadAmenities(): void {

    this.propertyService
      .getAmenitiesList()
      .subscribe({

        next: (res: any) => {

          if (res.status) {

            this.amenitiesList =
              res.data || [];

          }

        },

        error: (err) =>

          console.error(
            'Amenities load error',
            err
          )

      });

  }

  // ============================================================
  // STATE CHANGE
  // ============================================================

  onStateChange(
    stateId: number | null
  ): void {

    if (stateId) {

      this.loadDistricts(
        stateId
      );

      this.selectedDistrict =
        null;

    } else {

      this.districts = [];

      this.selectedDistrict =
        null;

    }

    this.applyFilters();

  }

  // ============================================================
  // FILTERS
  // ============================================================

  applyFilters(
    search: string = ''
  ): void {

    let temp = [
      ...this.allProperties
    ];

    // PRICE MIN
    if (
      this.priceMin !== null
    ) {

      temp =
        temp.filter(
          p =>
            p.price >=
            this.priceMin!
        );

    }

    // PRICE MAX
    if (
      this.priceMax !== null
    ) {

      temp =
        temp.filter(
          p =>
            p.price <=
            this.priceMax!
        );

    }

    // STATE
    if (
      this.selectedState
    ) {

      const stateObj =
        this.states.find(
          s =>
            s.id ===
            this.selectedState
        );

      if (stateObj) {

        const sName =
          stateObj.state_name
            .toLowerCase();

        temp =
          temp.filter(
            p =>
              p.city
                ?.toLowerCase()
                .includes(
                  sName
                )
              ||
              p.address
                ?.toLowerCase()
                .includes(
                  sName
                )
          );

      }

    }

    // DISTRICT
    if (
      this.selectedDistrict
    ) {

      const distObj =
        this.districts.find(
          d =>
            d.id ===
            this.selectedDistrict
        );

      if (distObj) {

        const dName =
          distObj.district_name
            .toLowerCase();

        temp =
          temp.filter(
            p =>
              p.city
                ?.toLowerCase()
                .includes(
                  dName
                )
              ||
              p.area
                ?.toLowerCase()
                .includes(
                  dName
                )
              ||
              p.address
                ?.toLowerCase()
                .includes(
                  dName
                )
          );

      }

    }

    // PROPERTY TYPE
    if (
      this.selectedPropertyType
    ) {

      temp =
        temp.filter(
          p =>
            p.property_type ===
            this.selectedPropertyType
        );

    }

    // TRANSACTION TYPE
    if (
      this.selectedTransactionType
    ) {

      temp =
        temp.filter(
          p =>
            p.transaction_type ===
            this.selectedTransactionType
        );

    }

    // AMENITIES
    if (
      this.selectedAmenities.length
    ) {

      temp =
        temp.filter(
          p =>
            Array.isArray(
              p.amenities
            )
            &&
            p.amenities.some(
              (a: any) =>
                this.selectedAmenities
                  .includes(
                    a.id
                  )
            )
        );

    }

    // SEARCH
    if (search) {

      const s =
        search.toLowerCase();

      temp =
        temp.filter(
          p =>
            p.city
              ?.toLowerCase()
              .includes(s)
            ||
            p.area
              ?.toLowerCase()
              .includes(s)
            ||
            p.property_type
              ?.toLowerCase()
              .includes(s)
        );

    }

    // SORT
    switch (
    this.selectedSort
    ) {

      case 'price_low':

        temp.sort(
          (a, b) =>
            a.price -
            b.price
        );

        break;

      case 'price_high':

        temp.sort(
          (a, b) =>
            b.price -
            a.price
        );

        break;

      case 'a_z':

        temp.sort(
          (a, b) =>
            this.getPropertyTypeLabel(
              a.property_type
            )
              .localeCompare(
                this.getPropertyTypeLabel(
                  b.property_type
                )
              )
        );

        break;

      case 'z_a':

        temp.sort(
          (a, b) =>
            this.getPropertyTypeLabel(
              b.property_type
            )
              .localeCompare(
                this.getPropertyTypeLabel(
                  a.property_type
                )
              )
        );

        break;

    }

    this.filteredProperties =
      temp;

    this.resetPagination();

  }

  // ============================================================
  // PAGINATION
  // ============================================================

  resetPagination(): void {

    this.currentPage = 1;

    this.totalItems =
      this.filteredProperties.length;

    this.totalPages =
      Math.ceil(
        this.totalItems /
        this.itemsPerPage
      );

    this.updatePaginatedProperties();

  }

  updatePaginatedProperties(): void {

    const start =
      (
        this.currentPage - 1
      )
      *
      this.itemsPerPage;

    const end =
      start +
      this.itemsPerPage;

    this.paginatedProperties =
      this.filteredProperties.slice(
        start,
        end
      );

    this.startIndex =
      this.totalItems === 0
        ? 0
        : start + 1;

    this.endIndex =
      Math.min(
        end,
        this.totalItems
      );

  }

  onItemsPerPageChange(): void {

    this.currentPage = 1;

    this.totalPages =
      Math.ceil(
        this.totalItems /
        this.itemsPerPage
      );

    this.updatePaginatedProperties();

  }

  goToPage(
    page: number | string
  ): void {

    if (
      typeof page !==
      'number'
    ) {

      return;

    }

    if (
      page >= 1 &&
      page <=
      this.totalPages
    ) {

      this.currentPage =
        page;

      this.updatePaginatedProperties();

      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });

    }

  }

  previousPage(): void {

    if (
      this.currentPage > 1
    ) {

      this.goToPage(
        this.currentPage - 1
      );

    }

  }

  nextPage(): void {

    if (
      this.currentPage <
      this.totalPages
    ) {

      this.goToPage(
        this.currentPage + 1
      );

    }

  }

  firstPage(): void {

    this.goToPage(1);

  }

  lastPage(): void {

    this.goToPage(
      this.totalPages
    );

  }

  getPageNumbers():
    (number | string)[] {

    const pages:
      (number | string)[] = [];

    const total =
      this.totalPages;

    const current =
      this.currentPage;

    pages.push(1);

    if (
      total <= 7
    ) {

      for (
        let i = 2;
        i <= total;
        i++
      ) {

        pages.push(i);

      }

    } else {

      let start =
        Math.max(
          2,
          current - 1
        );

      let end =
        Math.min(
          total - 1,
          current + 1
        );

      if (
        current <= 3
      ) {

        start = 2;
        end = 4;

      } else if (
        current >=
        total - 2
      ) {

        start =
          total - 3;

        end =
          total - 1;

      }

      if (
        start > 2
      ) {

        pages.push(
          '...'
        );

      }

      for (
        let i = start;
        i <= end;
        i++
      ) {

        pages.push(i);

      }

      if (
        end <
        total - 1
      ) {

        pages.push(
          '...'
        );

      }

      pages.push(
        total
      );

    }

    return pages;

  }

  // ============================================================
  // CLEAR FILTERS
  // ============================================================

  clearAllFilters(): void {

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

  // ============================================================
  // ACTIVE FILTER COUNT
  // ============================================================

  get activeFilterCount():
    number {

    let count = 0;

    if (
      this.priceMin !== null ||
      this.priceMax !== null
    ) {

      count++;

    }

    if (
      this.selectedState
    ) {

      count++;

    }

    if (
      this.selectedDistrict
    ) {

      count++;

    }

    if (
      this.selectedPropertyType
    ) {

      count++;

    }

    if (
      this.selectedTransactionType
    ) {

      count++;

    }

    if (
      this.selectedAmenities.length
    ) {

      count++;

    }

    return count;

  }

  // ============================================================
  // AMENITY
  // ============================================================

  toggleAmenity(
    amenityId: number,
    event: any
  ): void {

    if (
      event.target.checked
    ) {

      if (
        !this.selectedAmenities
          .includes(
            amenityId
          )
      ) {

        this.selectedAmenities
          .push(
            amenityId
          );

      }

    } else {

      this.selectedAmenities =
        this.selectedAmenities
          .filter(
            id =>
              id !==
              amenityId
          );

    }

    this.applyFilters();

  }

  // ============================================================
  // STATE NAME
  // ============================================================

  getStateName(
    stateId: number | null
  ): string {

    if (!stateId) {

      return '';

    }

    const state =
      this.states.find(
        s =>
          s.id ===
          stateId
      );

    return state
      ? state.state_name
      : '';

  }

  // ============================================================
  // DISTRICT NAME
  // ============================================================

  getDistrictName(
    districtId: number | null
  ): string {

    if (!districtId) {

      return '';

    }

    const district =
      this.districts.find(
        d =>
          d.id ===
          districtId
      );

    return district
      ? district.district_name
      : '';

  }

  // ============================================================
  // PROPERTY TYPE LABEL
  // ============================================================

  getPropertyTypeLabel(
    value: string
  ): string {

    const found =
      this.propertyTypes.find(
        pt =>
          pt.value ===
          value
      );

    return found
      ? found.label
      : (
        value ||
        ''
      );

  }

  // ============================================================
  // TRANSACTION LABEL
  // ============================================================

  getTransactionTypeLabel(
    value: string
  ): string {

    const found =
      this.transactionTypes.find(
        tt =>
          tt.value ===
          value
      );

    return found
      ? found.label
      : (
        value ||
        ''
      );

  }

  // ============================================================
  // FORMAT PRICE
  // ============================================================

  formatPrice(
    price: number
  ): string {

    if (
      !price ||
      price <= 0
    ) {

      return 'Price on request';

    }

    return (
      '₹ ' +
      price.toLocaleString(
        'en-IN'
      )
    );

  }

  // ============================================================
  // PUBLIC TITLE
  // ============================================================

  publicTitle(
    property: any
  ): string {

    if (!property) {

      return 'Property';

    }

    const type =
      this.getPropertyTypeLabel(
        property.property_type
      );

    const city =
      property.city || '';

    if (
      type &&
      city
    ) {

      return `${type} in ${city}`;

    }

    return (
      type ||
      city ||
      'Property'
    );

  }

  // ============================================================
  // PUBLIC DESCRIPTION
  // ============================================================

  publicDescription(
    property: any
  ): string {

    if (!property) {

      return '';

    }

    const type =
      this.getPropertyTypeLabel(
        property.property_type
      );

    const txn =
      this.getTransactionTypeLabel(
        property.transaction_type
      );

    const city =
      property.city || '';

    let line =
      `${type}`;

    if (txn) {

      line +=
        ` • ${txn}`;

    }

    if (city) {

      line +=
        ` • ${city}`;

    }

    return (
      line +
      '. Contact us for complete details.'
    );

  }

  // ============================================================
  // LOCATION
  // ============================================================

  locationLine(
    property: any
  ): string {

    if (!property) {

      return '';

    }

    return (
      property.city ||
      'Location available on request'
    );

  }

  // ============================================================
  // SANITIZE
  // ============================================================

  private sanitize(
    property: any
  ): any {

    const p: any = {
      ...property
    };

    p.title =
      this.publicTitle(
        property
      );

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

  // ============================================================
  // DETAILS
  // ============================================================

  goToDetails(
    property: any
  ): void {

    try {

      sessionStorage.setItem(
        'selected_property',
        JSON.stringify(
          this.sanitize(
            property
          )
        )
      );

    } catch (e) {

      console.warn(
        'Failed to cache property',
        e
      );

    }

    this.router.navigate(
      [
        '/property-detail',
        property.slug
      ]
    );

  }

  // ============================================================
  // ENQUIRY
  // ============================================================

  goToEnquiry(
    property: any
  ): void {

    try {

      sessionStorage.setItem(
        'selected_property',
        JSON.stringify(
          this.sanitize(
            property
          )
        )
      );

    } catch (e) {

      console.warn(
        'Failed to cache property',
        e
      );

    }

    const refCode =
      this.route.snapshot
        .queryParamMap
        .get(
          'ref_code'
        )
      ||
      this.route.snapshot
        .queryParamMap
        .get(
          'ref'
        );

    const queryParams:
      any = {

      property:
        property.slug

    };

    if (refCode) {

      queryParams.ref_code =
        refCode;

    }

    this.router.navigate(
      [
        '/property-enquiry'
      ],
      {
        queryParams
      }
    );

  }

}
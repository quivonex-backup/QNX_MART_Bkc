import { CommonModule } from '@angular/common';

import { Component, HostListener, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';

import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { HttpClient } from '@angular/common/http';

import { AddCartService } from '../../../services/add-cart.service';

import { CartStateService } from '../../../services/cart-state.service';

import { Const } from '../../const';

import { ProductService } from '../../../services/product.service';

import { CarouselService } from '../../../services/carousel.service';

import { AlertService } from '../../../services/alert.service';

import { Meta, Title } from '@angular/platform-browser';

@Component({
  selector: 'app-home',

  imports: [FormsModule, CommonModule, RouterLink],

  templateUrl: './home.component.html',

  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
  latestProducts: any[] = [];

  allProducts: any[] = [];

  products: any[] = [];

  loadingProducts = false;

  cartLoadingId: number | null = null;

  recentProducts: any[] = [];

  loadingRecent = false;

  carouselImages: any[] = [];

  currentSlide = 0;

  // Discount filter section

  discountOptions: any = null;

  loadingDiscounts = false;

  isMobile: boolean = window.innerWidth < 768;

  // Filter state

  activeCat: string = '';

  activeSubCat: string = '';

  activeBrand: string = '';

  priceMin: number | null = null;

  priceMax: number | null = null;

  selectedSort: string = '';

  filterOpen = false;

  discountLabel: string = '';

  // Sidebar data

  categories: string[] = [];

  subcategoriesForCat: string[] = [];

  brandsForFilter: string[] = [];

  // Franchise popup

  franchisePopupOpen = false;

  franchisePlans: any[] = [];

  selectedProduct: any = null;

  franchiseLoading = false;

  franchiseError = '';

  showNoPlansMessage = false;

  qnxAssured: boolean = true;

  aiNeuralRank: boolean = true;

  minRating: number = 4.5;

  showScrollTop: boolean = false;

  homeVideos: any[] = [];
  // Product-specific video popup; existing API and reels stay unchanged.
  videoPopupProduct: any = null;
  productPopupVideos: any[] = [];
  productPopupVideoIndex = 0;

  currentReelIndex: number = 0;

  isReelPlaying: boolean = true;

  // Price range configuration

  maxProductPrice: number = 500000;

  priceStep: number = 1;

  constructor(
    private http: HttpClient,

    private cartService: AddCartService,

    private cartState: CartStateService,

    private productService: ProductService,

    private carouselService: CarouselService,

    private router: Router,

    private alertService: AlertService,

    private route: ActivatedRoute,

    private titleService: Title,

    private metaService: Meta,
  ) {}

  ngOnInit() {
    this.loadLatestProducts();

    this.getRecentlyViewedProducts();

    this.loadCarousel();

    this.loadDiscountOptions();

    this.route.queryParams.subscribe((params) => {
      const search = (params['search'] || '').trim().toLowerCase();

      const category = params['category'] || '';

      const encoded = params['data'];

      const discountLabel = params['discount_label'] || '';

      let productIds = '';

      if (encoded) {
        productIds = atob(encoded);
      }

      this.productService.getProducts({}).subscribe((res: any) => {
        this.allProducts = res.data || [];

        if (productIds) {
          const ids = productIds
            .split(',')
            .map((id: string) => Number(id.trim()));

          this.products = this.allProducts.filter((p: any) =>
            ids.includes(p.id),
          );

          this.discountLabel = discountLabel;
        } else {
          this.products = this.allProducts;

          this.discountLabel = '';

          const highestPrice = Math.max(
            0,

            ...this.allProducts.map((p: any) => this.getFinalPrice(p)),
          );

          this.maxProductPrice = Math.max(1, Math.ceil(highestPrice));
        }

        this.buildSidebarData();

        if (!productIds && category) {
          this.activeCat = category;

          this.updateSubcategoriesAndBrands();
        }

        this.applyFilters(search);
      });
    });

    this.titleService.setTitle(
      'QNX Mart B2B | B2B Marketplace for Buyers & Suppliers in India',
    );

    this.metaService.updateTag({
      name: 'description',

      content:
        'QNX Mart B2B is an online B2B marketplace connecting buyers, suppliers and businesses across India. Explore products, business opportunities, real estate and resale listings.',
    });
  }

  // Minimum price change

  onMinPriceChange(value: number | string): void {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) return;

    const newValue = Math.max(
      0,

      Math.min(numberValue, this.priceMax ?? this.maxProductPrice),
    );

    this.priceMin = newValue === 0 ? null : newValue;
  }

  // Maximum price change

  onMaxPriceChange(value: number | string): void {
    const numberValue = Number(value);

    if (!Number.isFinite(numberValue)) return;

    const newValue = Math.min(
      this.maxProductPrice,

      Math.max(numberValue, this.priceMin ?? 0),
    );

    this.priceMax = newValue === this.maxProductPrice ? null : newValue;
  }

  // Minimum percentage

  getMinPricePercent(): number {
    if (this.maxProductPrice <= 0) return 0;

    return ((this.priceMin ?? 0) / this.maxProductPrice) * 100;
  }

  // Maximum percentage

  getMaxPricePercent(): number {
    if (this.maxProductPrice <= 0) return 100;

    return (
      ((this.priceMax ?? this.maxProductPrice) / this.maxProductPrice) * 100
    );
  }

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.showScrollTop = window.scrollY > 300;
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,

      behavior: 'smooth',
    });
  }

  priceValue: number = 45000;

  onRangeChange(event: any) {
    const val = event.target.value;

    const min = event.target.min || 500;

    const max = event.target.max || 150000;

    const percentage = ((val - min) / (max - min)) * 100;

    event.target.style.background = `linear-gradient(to right, #303f9f ${percentage}%, #e0e0e0 ${percentage}%)`;
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.isMobile = window.innerWidth < 768;
  }

  getTranslateStep(): number {
    return this.isMobile ? 100 : 34;
  }

  loadDiscountOptions() {
    this.loadingDiscounts = true;

    this.http
      .post(Const.constUrl + 'offer/offers/filter-options/', {})
      .subscribe({
        next: (res: any) => {
          this.discountOptions = res;

          this.loadingDiscounts = false;
        },

        error: () => {
          this.loadingDiscounts = false;
        },
      });
  }

  goToDiscountFilter(item: any) {
    if (!item.product_ids?.length) return;

    const encoded = btoa(item.product_ids.join(','));

    this.router.navigate(['/product_list'], {
      queryParams: {
        data: encoded,

        discount_label: item.label,
      },
    });
  }

  loadLatestProducts() {
    this.loadingProducts = true;

    this.productService.getProducts({}).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.allProducts = res.data || [];

          this.products = res.data || [];

          this.latestProducts = res.data || [];
        }

        // Prepare actual product videos for Home Reels section

        this.prepareHomeVideos(this.allProducts);

        this.loadingProducts = false;
      },

      error: (err) => {
        console.error(err);

        this.loadingProducts = false;
      },
    });
  }

  get activeFilterCount(): number {
    let count = 0;

    if (this.activeCat) count++;

    if (this.activeSubCat) count++;

    if (this.activeBrand) count++;

    if (this.priceMin !== null || this.priceMax !== null) count++;

    return count;
  }

  selectCategory(cat: string) {
    this.activeCat = cat;

    this.activeSubCat = '';

    this.activeBrand = '';

    this.updateSubcategoriesAndBrands();

    this.applyFilters();
  }

  selectSubCategory(sub: string) {
    this.activeSubCat = sub;

    this.activeBrand = '';

    this.updateSubcategoriesAndBrands();

    this.applyFilters();
  }

  selectBrand(brand: string) {
    this.activeBrand = brand;

    this.applyFilters();
  }

  clearPriceFilter() {
    this.priceMin = null;

    this.priceMax = null;

    this.applyFilters();
  }

  viewDetails(product: any) {
    this.router.navigate(['/product-details', product.slug]);
  }

  openFranchise(product: any) {
    const productSlug = product.slug;

    if (!productSlug) {
      this.franchiseError = 'Product slug is missing.';

      this.franchisePopupOpen = true;

      this.showNoPlansMessage = true;

      return;
    }

    this.selectedProduct = product;

    this.franchiseLoading = true;

    this.franchiseError = '';

    this.showNoPlansMessage = false;

    this.franchisePlans = [];

    this.franchisePopupOpen = true;

    this.productService.getProductFranchisePlans(productSlug).subscribe({
      next: (res: any) => {
        this.franchiseLoading = false;

        if (res.status) {
          this.franchisePlans = res.data || [];

          if (this.franchisePlans.length === 0) {
            this.showNoPlansMessage = true;

            this.franchiseError =
              res.message || 'No franchise plans available.';
          } else {
            this.franchiseError = '';

            this.showNoPlansMessage = false;
          }
        } else {
          this.showNoPlansMessage = true;

          this.franchiseError =
            res.message || 'Failed to load franchise plans.';
        }
      },

      error: (err) => {
        console.error(err);

        this.franchiseLoading = false;

        this.showNoPlansMessage = true;

        this.franchiseError =
          err.error?.message ||
          'An error occurred while loading franchise plans.';
      },
    });
  }

  showAll() {
    this.activeCat = '';

    this.activeSubCat = '';

    this.activeBrand = '';

    this.priceMin = null;

    this.priceMax = null;

    this.selectedSort = '';

    if (this.discountLabel) {
      this.products = this.allProducts;

      this.discountLabel = '';

      this.buildSidebarData();
    }

    this.updateSubcategoriesAndBrands();

    this.applyFilters();
  }

  buildSidebarData() {
    this.categories = [
      ...new Set(this.products.map((p) => p.category_name).filter(Boolean)),
    ].sort();
  }

  // --- Core Filtering Logic (Pagination Removed) ---

  applyFilters(search: string = '') {
    let temp = [...this.products];

    if (this.activeCat)
      temp = temp.filter((p) => p.category_name === this.activeCat);

    if (this.activeSubCat)
      temp = temp.filter((p) => p.subcategory_name === this.activeSubCat);

    if (this.activeBrand)
      temp = temp.filter((p) => p.brand_name === this.activeBrand);

    // if (this.priceMin !== null) temp = temp.filter(p => Number(p.final_price || p.price) >= this.priceMin!);

    // if (this.priceMax !== null) temp = temp.filter(p => Number(p.final_price || p.price) <= this.priceMax!);

    if (this.priceMin !== null) {
      temp = temp.filter((p) => this.getFinalPrice(p) >= this.priceMin!);
    }

    if (this.priceMax !== null) {
      temp = temp.filter((p) => this.getFinalPrice(p) <= this.priceMax!);
    }

    if (search) {
      temp = temp.filter(
        (p) =>
          p.name?.toLowerCase().includes(search) ||
          p.category_name?.toLowerCase().includes(search) ||
          p.description?.toLowerCase().includes(search),
      );
    }

    // switch (this.selectedSort) {

    //   case 'price_low': temp.sort((a, b) => Number(a.final_price || a.price) - Number(b.final_price || b.price)); break;

    //   case 'price_high': temp.sort((a, b) => Number(b.final_price || b.price) - Number(a.final_price || a.price)); break;

    //   case 'a_z': temp.sort((a, b) => a.name.localeCompare(b.name)); break;

    //   case 'z_a': temp.sort((a, b) => b.name.localeCompare(a.name)); break;

    // }

    switch (this.selectedSort) {
      case 'price_low':
        temp.sort((a, b) => this.getFinalPrice(a) - this.getFinalPrice(b));

        break;

      case 'price_high':
        temp.sort((a, b) => this.getFinalPrice(b) - this.getFinalPrice(a));

        break;

      case 'a_z':
        temp.sort((a, b) => a.name.localeCompare(b.name));

        break;

      case 'z_a':
        temp.sort((a, b) => b.name.localeCompare(a.name));

        break;
    }

    // Direct assignment to latestProducts since pagination is no longer needed

    this.latestProducts = temp;
  }

  updateSubcategoriesAndBrands() {
    const catProducts = this.activeCat
      ? this.products.filter((p) => p.category_name === this.activeCat)
      : this.products;

    this.subcategoriesForCat = [
      ...new Set(catProducts.map((p) => p.subcategory_name).filter(Boolean)),
    ].sort();

    const subProducts = this.activeSubCat
      ? catProducts.filter((p) => p.subcategory_name === this.activeSubCat)
      : catProducts;

    this.brandsForFilter = [
      ...new Set(subProducts.map((p) => p.brand_name).filter(Boolean)),
    ].sort();
  }

  getDiscountDisplay(product: any): string {
    if (product.applied_offer) {
      const o = product.applied_offer;

      return o.type === 'flat' ? `₹${o.value} OFF` : `${o.value}% OFF`;
    }

    const discVal = parseFloat(product.discount_value) || 0;

    if (!discVal) return '';

    return product.discount_type === 'flat'
      ? `₹${discVal} OFF`
      : `${discVal}% OFF`;
  }

  getOfferTitle(product: any): string {
    return product.applied_offer?.title || '';
  }

  getDiscountValue(product: any): number | null {
    if (product.applied_offer?.value)
      return parseFloat(product.applied_offer.value);

    const v = parseFloat(product.discount_value);

    return v > 0 ? v : null;
  }

  getOriginalPrice(product: any): number {
    return parseFloat(product.price) || 0;
  }

  // getFinalPrice(product: any): number {

  //   if (product.applied_offer) {

  //     return parseFloat(product.final_price) || parseFloat(product.price) || 0;

  //   }

  //   const price = parseFloat(product.price) || 0;

  //   const discVal = parseFloat(product.discount_value) || 0;

  //   if (!discVal) return price;

  //   if (product.discount_type === 'percent') return Math.max(0, price - (price * discVal / 100));

  //   if (product.discount_type === 'flat') return Math.max(0, price - discVal);

  //   return price;

  // }

  getFinalPrice(product: any): number {
    if (product.applied_offer) {
      return Math.round(
        parseFloat(product.final_price) || parseFloat(product.price) || 0,
      );
    }

    const price = parseFloat(product.price) || 0;

    const discVal = parseFloat(product.discount_value) || 0;

    if (!discVal) {
      return Math.round(price);
    }

    if (product.discount_type === 'percent') {
      const finalPrice = price - (price * discVal) / 100;

      return Math.round(Math.max(0, finalPrice));
    }

    if (product.discount_type === 'flat') {
      const finalPrice = price - discVal;

      return Math.round(Math.max(0, finalPrice));
    }

    return Math.round(price);
  }

  getRecentlyViewedProducts() {
    this.loadingRecent = true;

    this.productService.getRecentlyViewedProducts().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.recentProducts = res.data.map((item: any) => ({
            ...item,

            thumbnail:
              item.thumbnail_s3_key?.replace(/"/g, '') ||
              'assets/placeholder.png',

            display_price: item.variants?.length
              ? item.variants[0].price
              : item.final_price,
          }));
        }

        this.loadingRecent = false;
      },

      error: (err) => {
        console.error(err);

        this.loadingRecent = false;
      },
    });
  }

  loadCarousel() {
    this.carouselService.getCarouselImages().subscribe({
      next: (res: any) => {
        if (res.status && res.data.length > 0) {
          this.originalImagesLength = res.data.length;

          this.carouselImages = [...res.data, ...res.data];

          this.startAutoSlide();
        }
      },

      error: (err) => console.log(err),
    });
  }

  private carouselInterval: any;

  private carouselPaused = false;

  startAutoSlide() {
    if (this.carouselInterval) {
      clearInterval(this.carouselInterval);
    }

    this.carouselInterval = setInterval(() => {
      if (!this.carouselPaused) {
        this.nextSlide();
      }
    }, 3000);
  }

  stopAutoSlide() {
    this.carouselPaused = true;
  }

  resumeAutoSlide() {
    this.carouselPaused = false;
  }

  originalImagesLength: number = 0;

  isTransitionEnabled: boolean = true;

  get slideDots(): number[] {
    return Array(this.originalImagesLength)
      .fill(0)
      .map((_, i) => i);
  }

  nextSlide() {
    if (this.carouselImages.length === 0) return;

    this.isTransitionEnabled = true;

    this.currentSlide++;

    if (this.currentSlide >= this.originalImagesLength) {
      setTimeout(() => {
        this.isTransitionEnabled = false;

        this.currentSlide = 0;
      }, 600);
    }
  }

  prevSlide() {
    if (this.carouselImages.length === 0) return;

    if (this.currentSlide <= 0) {
      this.isTransitionEnabled = false;

      this.currentSlide = this.originalImagesLength;

      setTimeout(() => {
        this.isTransitionEnabled = true;

        this.currentSlide--;
      }, 50);
    } else {
      this.isTransitionEnabled = true;

      this.currentSlide--;
    }
  }

  goToCategory(product: any) {
    this.router.navigate(['/product_list'], {
      queryParams: { category: product.category_name },
    });
  }

  goToEnquiry(product: any) {
    this.router.navigate(['/product-enquiry'], {
      queryParams: {
        product: product.slug,
      },
    });
  }

  addToCart(product: any) {
    const userId = sessionStorage.getItem('user_id');

    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cartLoadingId = product.id;

    this.cartService
      .addToCart({
        product_id: product.id,
        user_id: Number(userId),
        quantity: 1,
      })
      .subscribe({
        next: (res: any) => {
          this.cartLoadingId = null;

          this.alertService.unialert(res.message || 'Added to cart');

          this.cartService.getCart(Number(userId)).subscribe((cartRes: any) => {
            const items = cartRes.cart_items || [];

            const total = items.reduce(
              (sum: number, item: any) => sum + item.quantity,
              0,
            );

            this.cartState.setCartCount(total);
          });
        },

        error: () => {
          this.cartLoadingId = null;
          this.alertService.unialert('Failed to add to cart');
        },
      });
  }

  // ================= HOME REELS & PRODUCT VIDEOS =================

  prepareHomeVideos(products: any[]): void {
    this.homeVideos = [];

    this.currentReelIndex = 0;

    if (!products?.length) {
      return;
    }

    products.forEach((product: any) => {
      if (!product?.videos?.length) {
        return;
      }

      product.videos.forEach((video: any) => {
        if (!video?.video_s3_key) {
          return;
        }

        this.homeVideos.push({
          video_url: video.video_s3_key,

          product_id: product.id,

          product_slug: product.slug,

          product_name: product.name,

          thumbnail: product.thumbnail_s3_key,

          price: product.final_price ?? product.price,
        });
      });
    });

    console.log('Home Reel Videos:', this.homeVideos);
  }

  nextReel(): void {
    if (!this.homeVideos.length) {
      return;
    }

    this.currentReelIndex =
      (this.currentReelIndex + 1) % this.homeVideos.length;
  }

  previousReel(): void {
    if (!this.homeVideos.length) {
      return;
    }

    this.currentReelIndex =
      (this.currentReelIndex - 1 + this.homeVideos.length) %
      this.homeVideos.length;
  }

  toggleReelVideo(video: HTMLVideoElement) {
    if (!video) return;

    if (video.paused) {
      video.play();

      this.isReelPlaying = true;
    } else {
      video.pause();

      this.isReelPlaying = false;
    }
  }

  forceMute(video: HTMLVideoElement) {
    if (!video) return;

    video.muted = true;

    video.defaultMuted = true;

    video.volume = 0;
  }

  toggleMute(video: HTMLVideoElement) {
    if (!video) return;

    if (video.muted) {
      video.muted = false;

      video.volume = 1;
    } else {
      video.muted = true;

      video.volume = 0;
    }
  }

  openReelProduct(reel: any): void {
    if (!reel?.product_slug) {
      return;
    }

    this.router.navigate(['/product-details', reel.product_slug]);
  }

  // ===== PRODUCT CARD VIDEO POPUP =====
  getProductVideos(product: any): any[] {
    if (product?.id === undefined || product?.id === null) return [];
    return this.homeVideos.filter(
      (video: any) =>
        !!video?.video_url && String(video.product_id) === String(product.id),
    );
  }

  openProductVideoPopup(product: any, event?: Event): void {
    event?.preventDefault();
    event?.stopPropagation();
    const videos = this.getProductVideos(product);
    if (!videos.length) return;
    this.videoPopupProduct = product;
    this.productPopupVideos = videos;
    this.productPopupVideoIndex = 0;
  }

  closeProductVideoPopup(): void {
    this.videoPopupProduct = null;
    this.productPopupVideos = [];
    this.productPopupVideoIndex = 0;
  }

  changeProductPopupVideo(direction: number): void {
    const count = this.productPopupVideos.length;
    if (!count) return;
    this.productPopupVideoIndex =
      (this.productPopupVideoIndex + direction + count) % count;
  }

  bankLogos: string[] = [
    'AXIS-Bank-logo.jpg',
    'HDFC-Bank-logo.jpg',
    'ICICI-Bank-logo.jpg',

    'IndusInd-Bank-logo.png',
    'Kotak-Mahindra-Bank-logo.png',

    'Bajaj-Finserv.jpg',
    'chola.jpg',
    'LnT-Finanace.png',
    'MMFSL.png',
    'Tata-capital.png',
  ];

  financeLogos: string[] = [
    'Bajaj-Finserv.jpg',
    'chola.jpg',
    'LnT-Finanace.png',
    'MMFSL.png',
    'Tata-capital.png',
  ];

  pauseBankSlider = false;

  pauseFinanceSlider = false;
}

import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink, NavigationEnd, ActivatedRoute, RouterLinkActive } from '@angular/router';
import { CartStateService } from '../../../services/cart-state.service';
import { AddCartService } from '../../../services/add-cart.service';
import { ProductService } from '../../../services/product.service';
import { filter } from 'rxjs/operators';
import { LanguageService } from '../../../services/language.service';
import { PropertyCreateService } from '../../../services/property-create.service';
import { OlxService } from '../../../services/olx.service';

@Component({
  selector: 'app-navbar',
  imports: [FormsModule, CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent implements OnInit {

  isMobileMenuOpen = false;
  activeDropdown: string = '';
  cartCount: number = 0;
  isScrolled = false;
  products: any[] = [];
  productsLoaded = false;
  searchResults: any[] = [];
  showResults = false;
  searchTimeout: any;
  isLoggedIn: boolean = false;

  username = '';
  email = '';
  userId = '';

  categories: string[] = [];

  // Filter state
  activeCat: string = '';
  activeSubCat: string = '';
  activeBrand: string = '';
  priceMin: number | null = null;
  priceMax: number | null = null;
  selectedSort: string = '';
  filterOpen = false;
  discountLabel: string = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [1, 5, 10, 20, 40];
  startIndex = 0;
  endIndex = 0;

  filteredProducts: any[] = [];
  paginatedProducts: any[] = [];
  subcategoriesForCat: string[] = [];
  brandsForFilter: string[] = [];

  allProducts: any[] = [];
  showLeftArrow: boolean = false;
  showRightArrow: boolean = false;

  showNavLeftArrow: boolean = false;
  showNavRightArrow: boolean = false;


  // Track the last user we fetched the cart for
  private previousUserId: string | null = null;

  isCategorySidebarOpen: boolean = false;

  isRealEstateRoute: boolean = false;

  activePropertyType: string = '';

  // रियल इस्टेटसाठी प्रॉपर्टी टाईप्स आणि त्यांचे आयकॉन्स
  propertyTypes = [
    { value: 'flat', label: 'Flat / Apartment', icon: 'bi-building' },
    { value: 'villa', label: 'Villa / Bungalow', icon: 'bi-house-door' },
    { value: 'plot', label: 'Plot / Land', icon: 'bi-map' },
    { value: 'commercial', label: 'Commercial Space', icon: 'bi-shop' },
    { value: 'shop', label: 'Shop / Retail', icon: 'bi-tag' },
    { value: 'office', label: 'Office Space', icon: 'bi-briefcase' },
    { value: 'warehouse', label: 'Warehouse', icon: 'bi-box-seam' },
    { value: 'other', label: 'Other', icon: 'bi-three-dots' }
  ];

  // All properties
  allProperties: any[] = [];
  filteredProperties: any[] = [];
  paginatedProperties: any[] = [];
  selectedPropertyType: string = '';

  isRemartRoute: boolean = false;
  remartCategories: any[] = [];
  activeRemartCat: any = '';
  isShoppingRoute: boolean = false;

  searchResultType: 'product' | 'property' | 'remart' = 'product';

  private searchRequestId = 0;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cartState: CartStateService,
    private cartService: AddCartService,
    private productService: ProductService,
    private languageService: LanguageService,
    private propertyService: PropertyCreateService,
    private olxService: OlxService
  ) { }

  ngOnInit() {
    // १. युजर लॉगिन स्टेटस आणि कार्ट काऊंट चेक करा
    this.checkLoginStatus();

    this.cartState.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    this.checkActiveRoute(this.router.url);
    // २. ड्रॉपडाऊनसाठी प्रॉडक्ट्स लोड करा
    this.loadNavProducts();

    this.loadRemartCategories();

    // ३. पेज बदलल्यावर (Route Change) मेनु बंद करणे, युजर अपडेट करणे आणि रियल इस्टेट रूट चेक करणे एकाच ठिकाणी
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe((event: any) => {
      // सर्व ड्रॉपडाऊन/मेनु बंद करा
      this.activeDropdown = '';
      this.isMobileMenuOpen = false;
      this.showResults = false;
      this.searchResults = [];
      // this.searchQuery = ''; // आवश्यक असल्यास अनकमेंट करा

      // युजर माहिती अपडेट करा
      this.checkLoginStatus();
      this.username = sessionStorage.getItem('username') || '';
      this.email = sessionStorage.getItem('email') || '';
      this.userId = sessionStorage.getItem('user_id') || '';

      const currentUrl = event.urlAfterRedirects || event.url;
      this.checkActiveRoute(currentUrl);

      // Re-trigger scroll check after view stabilization
      setTimeout(() => this.checkAllScrolls(), 100);
    });

    // सुरुवातीला एकदा रूट चेक करा
    this.checkActiveRoute(this.router.url);

    // ४. Query Parameters हँडल करणे (शॉपिंग आणि रियल इस्टेट दोन्हीसाठी)
    this.route.queryParams.subscribe(params => {
      const search = (params['search'] || '').trim().toLowerCase();
      const category = params['category'] || '';
      const encoded = params['data'];
      const discountLabel = params['discount_label'] || '';

      // रियल इस्टेट प्रॉपर्टी टाईप सिंक करण्यासाठी
      const propType = params['type'] || '';
      this.activePropertyType = propType;
      this.selectedPropertyType = propType;

      // Sync active Remart category if param exists
      if (params['category'] && this.isRemartRoute) {
        const catId = Number(params['category']);
        this.activeRemartCat = this.remartCategories.find(c => c.id === catId) || null;
      } else if (!params['category'] && this.isRemartRoute) {
        this.activeRemartCat = null;
      }

      let productIds = '';
      if (encoded) {
        productIds = atob(encoded);
      }

      // प्रॉडक्ट्स फिल्टरिंग लॉजिक
      this.productService.getProducts({}).subscribe((res: any) => {
        this.allProducts = res.data || [];

        if (productIds) {
          const ids = productIds.split(',').map((id: string) => Number(id.trim()));
          this.products = this.allProducts.filter((p: any) => ids.includes(p.id));
          this.discountLabel = discountLabel;
          this.activeCat = '';
        } else {
          this.products = this.allProducts;
          this.discountLabel = '';
          this.activeCat = category;
          this.updateSubcategoriesAndBrands();
        }

        this.applyFilters(search);

        setTimeout(() => {
          this.checkAllScrolls();
        }, 100);
      });
    });

    // पेज रेंडर झाल्यावर लगेच एकदा चेक करा
    setTimeout(() => {
      this.checkAllScrolls();
    }, 50); // वेळ ५०ms केल्याने पेज लोड झाल्यावर लगेच एरो गायब होईल
  }

  // Synchronized route checking for all related paths
  checkActiveRoute(url: string): void {
    this.isRealEstateRoute = url.includes('/property-list') || url.includes('/property-detail') || url.includes('/property-create');
    this.isRemartRoute = url.includes('/remart-product-list') || url.includes('/remart-product-detail') || url.includes('/remart-product-create') || url.includes('/remart-product-enquiry');
    this.isShoppingRoute = !this.isRealEstateRoute && !this.isRemartRoute;
  }

  // Page load kinva resize nantar donhi scroll containers tpasnyasathi
  checkAllScrolls() {
    const catEl = document.querySelector('#categoryScroll') as HTMLElement;
    if (catEl) {
      this.checkScroll(catEl);
    }

    const navTabsEl = document.querySelector('#navTabsScroll') as HTMLElement;
    if (navTabsEl) {
      this.checkNavScroll(navTabsEl);
    }
  }

  // Window resize zalyavar donhi scroll check karne
  @HostListener('window:resize')
  onResize() {
    this.checkAllScrolls();
  }



  // टॅब्स डावीकडे किंवा उजवीकडे स्क्रोल करण्यासाठी फंक्शन
  scrollNavTabs(element: HTMLElement, distance: number) {
    element.scrollBy({ left: distance, behavior: 'smooth' });
  }

  // Vertical navigation tabs scroll check karnare function
  checkNavScroll(element: HTMLElement) {
    if (!element) return;
    const maxScrollLeft = element.scrollWidth - element.clientWidth;

    // Jar content overflow hot nasel tar donhi arrows disnar nahit
    if (maxScrollLeft <= 5) {
      this.showNavLeftArrow = false;

      this.showNavRightArrow = false;
      return;
    }

    this.showNavLeftArrow = element.scrollLeft > 10;
    this.showNavRightArrow = element.scrollLeft < maxScrollLeft - 10;
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

  // Keep alias method pointing to the exact same logic to prevent function mismatches
  checkRoute(url: string) {
    this.checkActiveRoute(url);
  }

  // प्रॉपर्टी टाईपवर क्लिक केल्यावर रियल इस्टेट पेजवर फिल्टर होण्यासाठी
  selectPropertyType(value: string) {
    this.activePropertyType = value;
    this.selectedPropertyType = value; // दोन्ही व्हेरिएबल्स एकच ठेवा
    this.router.navigate(['/property-list'], { queryParams: { type: value } });
  }

  loadRemartCategories(): void {
    this.olxService.getCategories().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.remartCategories = res.data;
        }
      },
      error: (err) => console.error('Categories load error', err)
    });
  }

  // "All Remart Items" वर क्लिक केल्यावर सर्व कॅटेगरीचे प्रॉडक्ट्स दाखवण्यासाठी
  selectAllRemartItems(): void {
    this.activeRemartCat = null;
    this.router.navigate(['/remart-product-list'], { queryParams: {} });
  }

  selectRemartCategory(cat: any): void {
    this.activeRemartCat = cat;
    const catId = cat ? cat.id : '';
    this.router.navigate(['/remart-product-list'], { queryParams: { category: catId } });
  }


  changeLanguage(language: string): void {

    this.languageService.changeLanguage(language);

  }


  getLanguageLabel(): string {

    const language = this.languageService.getLanguage();

    switch (language) {

      case 'mr':
        return 'मराठी';

      case 'hi':
        return 'हिन्दी';

      case 'en':
      default:
        return 'EN';

    }

  }



  toggleCategorySidebar() {
    this.isCategorySidebarOpen = !this.isCategorySidebarOpen;
  }

  scrollCategories(element: HTMLElement, distance: number) {
    element.scrollBy({ left: distance, behavior: 'smooth' });
  }

  // Category scroll check karnare function
  checkScroll(element: HTMLElement) {
    if (!element) return;
    const maxScrollLeft = element.scrollWidth - element.clientWidth;

    // Jar content overflow hot nasel tar donhi arrows disnar nahit
    if (maxScrollLeft <= 5) {
      this.showLeftArrow = false;
      this.showRightArrow = false;
      return;
    }

    this.showLeftArrow = element.scrollLeft > 10;
    this.showRightArrow = element.scrollLeft < maxScrollLeft - 10;
  }

  // कॅटेगरीच्या नावावरून आयकॉन ठरवणारे फंक्शन
  getCategoryIcon(categoryName: string): string {
    if (!categoryName) return 'bi-tag-fill';
    const name = categoryName.toLowerCase();

    if (name.includes('mob') || name.includes('phone')) return 'bi-phone';
    if (name.includes('elec') || name.includes('laptop') || name.includes('computer')) return 'bi-laptop';
    if (name.includes('fash') || name.includes('cloth') || name.includes('apparel') || name.includes('wear')) return 'bi-bag';
    if (name.includes('home') || name.includes('decor') || name.includes('furniture')) return 'bi-house';
    if (name.includes('applian') || name.includes('tv') || name.includes('screen')) return 'bi-tv';
    if (name.includes('book') || name.includes('study') || name.includes('edu')) return 'bi-book';
    if (name.includes('auto') || name.includes('vehicle') || name.includes('bike') || name.includes('car')) return 'bi-car-front';
    if (name.includes('toy') || name.includes('baby') || name.includes('kid')) return 'bi-controller';
    if (name.includes('beauty') || name.includes('care') || name.includes('cosmetic')) return 'bi-heart-pulse';
    if (name.includes('food') || name.includes('agro') || name.includes('irrigation') || name.includes('mart')) return 'bi-basket';

    return 'bi-tag'; // डीफॉल्ट आयकॉन
  }

  selectCategory(cat: string) {
    this.activeCat = cat;
    this.activeSubCat = '';
    this.activeBrand = '';

    if (!cat) {

      this.router.navigate(['/product_list']);
    } else {
      // इतर कॅटेगरीवर क्लिक केल्यास प्रॉडक्ट लिस्ट पेजवर जा
      this.router.navigate(['/product_list'], {
        queryParams: { category: cat }
      });
    }
  }



  applyFilters(search: string = '') {
    let temp = [...this.products];

    if (this.activeCat) temp = temp.filter(p => p.category_name === this.activeCat);
    if (this.activeSubCat) temp = temp.filter(p => p.subcategory_name === this.activeSubCat);
    if (this.activeBrand) temp = temp.filter(p => p.brand_name === this.activeBrand);

    if (this.priceMin !== null) temp = temp.filter(p => Number(p.final_price || p.price) >= this.priceMin!);
    if (this.priceMax !== null) temp = temp.filter(p => Number(p.final_price || p.price) <= this.priceMax!);

    if (search) {
      temp = temp.filter(p =>
        p.name?.toLowerCase().includes(search) ||
        p.category_name?.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }

    switch (this.selectedSort) {
      case 'price_low': temp.sort((a, b) => Number(a.final_price || a.price) - Number(b.final_price || b.price)); break;
      case 'price_high': temp.sort((a, b) => Number(b.final_price || b.price) - Number(a.final_price || a.price)); break;
      case 'a_z': temp.sort((a, b) => a.name.localeCompare(b.name)); break;
      case 'z_a': temp.sort((a, b) => b.name.localeCompare(a.name)); break;
    }

    this.filteredProducts = temp;
    this.resetPagination();
  }


  updateSubcategoriesAndBrands() {
    const catProducts = this.activeCat
      ? this.products.filter(p => p.category_name === this.activeCat)
      : this.products;

    this.subcategoriesForCat = [...new Set(catProducts.map(p => p.subcategory_name).filter(Boolean))].sort();

    const subProducts = this.activeSubCat
      ? catProducts.filter(p => p.subcategory_name === this.activeSubCat)
      : catProducts;

    this.brandsForFilter = [...new Set(subProducts.map(p => p.brand_name).filter(Boolean))].sort();
  }

  resetPagination() {
    this.currentPage = 1;
    this.totalItems = this.filteredProducts.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePaginatedProducts();
  }

  updatePaginatedProducts() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedProducts = this.filteredProducts.slice(start, end);
    this.startIndex = this.totalItems === 0 ? 0 : start + 1;
    this.endIndex = Math.min(end, this.totalItems);
  }

  /**
   * Checks if the logged-in user has changed.
   * If yes, either fetches the new user's cart or resets the count to 0.
   */
  // checkLoginStatus() {
  //   const userId = sessionStorage.getItem('user_id');
  //   const isLoggedIn = !!userId;

  //   // Only act if the user ID has changed (or first run)
  //   if (userId !== this.previousUserId) {
  //     this.previousUserId = userId;

  //     if (isLoggedIn) {
  //       // New user logged in → load their cart
  //       this.loadCartCount();
  //     } else {
  //       // User logged out → reset cart count to 0
  //       this.cartState.setCartCount(0);
  //       this.cartCount = 0;
  //     }
  //   }

  //   this.isLoggedIn = isLoggedIn;
  // }

  isRealEstateActive: boolean = false;

  openRealEstate(): void {
    this.isRealEstateActive = true;

    if (this.isLoggedIn) {
      this.router.navigate(['/property-list']);
    } else {
      this.router.navigate(['/login']);
    }
  }

  checkLoginStatus() {
    const userId = sessionStorage.getItem('user_id');
    const accessToken = sessionStorage.getItem('access_token');

    const isLoggedIn = !!userId && !!accessToken;

    if (userId !== this.previousUserId) {
      this.previousUserId = userId;

      if (isLoggedIn) {
        this.loadCartCount();
      } else {
        this.cartState.setCartCount(0);
        this.cartCount = 0;
      }
    }

    this.isLoggedIn = isLoggedIn;

    // User information
    this.username = sessionStorage.getItem('username') || '';
    this.email = sessionStorage.getItem('email') || '';
    this.userId = sessionStorage.getItem('user_id') || '';
  }

  /**
   * Logout – clear session and reset cart count immediately
   */
  logout() {
    sessionStorage.clear();
    this.isLoggedIn = false;
    // Reset cart count so it doesn't linger
    this.cartState.setCartCount(0);
    this.cartCount = 0;
    // Navigate to login
    this.router.navigate(['/login']);
    // Update the tracker so next login will reload
    this.previousUserId = null;
  }

  /**
   * Load cart count from the API for the current user
   */
  loadCartCount() {
    const userId = Number(sessionStorage.getItem('user_id'));
    if (!userId) return;

    this.cartService.getCart(userId).subscribe((res: any) => {
      const items = res.cart_items || [];
      let totalQty = 0;
      items.forEach((item: any) => { totalQty += item.quantity; });
      this.cartState.setCartCount(totalQty);
    });
  }

  /**
   * Load products for the dropdown (first 8)
   */
  // loadNavProducts() {
  //   this.productService.getProducts({}).subscribe({
  //     next: (res: any) => {
  //       this.products = (res.data || []).slice(0, 8);
  //       this.productsLoaded = true;
  //     },
  //     error: () => { this.productsLoaded = true; }
  //   });
  // }

  loadNavProducts() {
    this.productService.getProducts({}).subscribe({
      next: (res: any) => {
        const allProducts = res.data || [];
        this.products = allProducts.slice(0, 8); // ड्रॉपडाउनसाठी पहिले ८ प्रॉडक्ट्स

        // ProductListComponent प्रमाणेच इथेही कॅटेगरी एक्सट्रॅक्ट करा:
        // this.categories = [...new Set(allProducts.map((p: any) => p.category_name).filter(Boolean))].sort();
        this.categories = [...new Set(this.products.map(p => p.category_name).filter(Boolean))].sort();

        this.productsLoaded = true;
      },
      error: () => { this.productsLoaded = true; }
    });
  }

  // ===== UI / INTERACTION METHODS =====

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 10;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement;
    if (!target.closest('.nav-dropdown-wrap') && !target.closest('.mobile-menu')) {
      this.activeDropdown = '';
    }
    if (!target.closest('.mobile-menu') && !target.closest('.hamburger')) {
      this.isMobileMenuOpen = false;
    }
    if (!target.closest('.qnx-search') && !target.closest('.qnx-mobile-search')) {
      this.showResults = false;
    }
  }

  // onSearchKey(event: KeyboardEvent) {
  //   if (event.key === 'Enter') {
  //     this.search();
  //     return;
  //   }
  //   clearTimeout(this.searchTimeout);
  //   const q = this.searchQuery.trim();
  //   if (!q) {
  //     this.showResults = false;
  //     this.searchResults = [];
  //     return;
  //   }
  //   this.searchTimeout = setTimeout(() => {
  //     this.productService.searchApprovedProducts(q).subscribe({
  //       next: (res: any) => {
  //         this.searchResults = res.data || [];
  //         this.showResults = true;
  //       },
  //       error: () => {
  //         this.searchResults = [];
  //         this.showResults = false;
  //       }
  //     });
  //   }, 400);
  // }

  onSearchKey(event: Event): void {
    clearTimeout(this.searchTimeout);

    const q = this.searchQuery.trim().toLowerCase();
    const requestId = ++this.searchRequestId;

    if (!q) {
      this.searchResults = [];
      this.showResults = false;
      return;
    }

    this.searchTimeout = setTimeout(() => {

      if (this.isRealEstateRoute) {

        this.searchResultType = 'property';

        this.propertyService.getApprovedProperties().subscribe({
          next: (res: any) => {
            if (requestId !== this.searchRequestId) return;

            const properties = Array.isArray(res.data)
              ? res.data
              : [];

            this.searchResults = properties.filter((p: any) => {
              const text = [
                p.title,
                p.name,
                p.city,
                p.area,
                p.description,
                p.property_type
              ].filter(Boolean).join(' ').toLowerCase();

              return text.includes(q);
            });

            this.showResults = true;
          },
          error: () => {
            if (requestId !== this.searchRequestId) return;
            this.searchResults = [];
            this.showResults = false;
          }
        });

      } else if (this.isRemartRoute) {

        this.searchResultType = 'remart';

        // Remart listing API जोडण्यासाठी खाली दिलेली
        // loadRemartSearchResults method वापरा.
        this.loadRemartSearchResults(q, requestId);

      } else {

        this.searchResultType = 'product';

        this.productService.getProducts({}).subscribe({
          next: (res: any) => {
            if (requestId !== this.searchRequestId) return;

            const products = Array.isArray(res.data)
              ? res.data
              : [];

            this.searchResults = products.filter((p: any) => {
              const text = [
                p.name,
                p.brand_name,
                p.category_name,
                p.description
              ].filter(Boolean).join(' ').toLowerCase();

              return p.is_active === true &&
                p.status === 'approved' &&
                text.includes(q);
            });

            this.showResults = true;
          },
          error: () => {
            if (requestId !== this.searchRequestId) return;
            this.searchResults = [];
            this.showResults = false;
          }
        });
      }

    }, 350);
  }

  loadRemartSearchResults(q: string, requestId: number): void {

    this.olxService.getListings().subscribe({

      next: (res: any) => {

        // Prevent old search responses from overwriting new results
        if (requestId !== this.searchRequestId) return;

        // Handle API response
        const listings = Array.isArray(res.data)
          ? res.data
          : Array.isArray(res.data?.results)
            ? res.data.results
            : Array.isArray(res.results)
              ? res.results
              : Array.isArray(res)
                ? res
                : [];

        const searchText = q.trim().toLowerCase();

        // Search in Remart listings
        this.searchResults = listings.filter((item: any) => {

          const searchableText = [
            item.title,
            item.name,
            item.description,
            item.category_name,
            item.subcategory_name,
            item.brand,
            item.location,
            item.city,
            item.area
          ]
            .filter(value => typeof value === 'string')
            .join(' ')
            .toLowerCase();

          return searchableText.includes(searchText);

        });

        this.searchResultType = 'remart';
        this.showResults = true;

        console.log('Remart Search Results:', this.searchResults);

      },

      error: (err) => {

        if (requestId !== this.searchRequestId) return;

        console.error('Remart search error:', err);

        this.searchResults = [];
        this.showResults = false;

      }

    });

  }

  clearSearch() {
    this.searchQuery = '';
    this.showResults = false;
    this.searchResults = [];
  }

  closeDropdown() {
    this.activeDropdown = '';
  }

  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    this.activeDropdown = '';

    if (!this.isMobileMenuOpen) {
      this.mobileOpenSection = '';
    }
  }

  toggleDropdown(name: string) {
    this.activeDropdown = this.activeDropdown === name ? '' : name;
  }

  isDropdownOpen(name: string) {
    return this.activeDropdown === name;
  }

  searchQuery = '';

  // search() {
  //   const q = this.searchQuery.trim();
  //   if (!q) return;
  //   this.router.navigate(['/product-list'], { queryParams: { search: q } });
  //   this.searchQuery = '';
  //   this.isMobileMenuOpen = false;
  // }

  search(): void {
    const q = this.searchQuery.trim();

    if (!q) return;

    let path = '/product_list';

    if (this.isRealEstateRoute) {
      path = '/property-list';
    } else if (this.isRemartRoute) {
      path = '/remart-product-list';
    }

    this.router.navigate([path], {
      queryParams: { search: q }
    });

    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
  }

  goToProduct(item: any): void {

    if (this.searchResultType === 'property') {
      // तुमच्या property-detail route प्रमाणे वापरा
      this.router.navigate(['/property-detail', item.slug]);

    } else if (this.searchResultType === 'remart') {

      const listingId = item.id ?? item.listing_id;

      console.log('Selected Remart Product:', item);

      this.router.navigate(['/remart-product-detail'], {
        state: {
          product: item,
          listing: item,
          listingId: listingId
        }
      });

    } else {
      this.router.navigate(['/product-details', item.slug]);
    }

    this.searchResults = [];
    this.showResults = false;
    this.searchQuery = '';
  }

  // goToProduct(product: any) {
  //   this.router.navigate(['/product-details', product.slug]);
  //   this.activeDropdown = '';
  //   this.showResults = false;
  //   this.searchResults = [];
  //   this.searchQuery = '';
  // }

  goToProductList() {
    this.router.navigate(['/product_list']);
    this.activeDropdown = '';
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  mobileOpenSection: string = '';

  toggleMobileSection(section: string): void {
    if (this.mobileOpenSection === section) {
      this.mobileOpenSection = '';
    } else {
      this.mobileOpenSection = section;
    }
  }

}
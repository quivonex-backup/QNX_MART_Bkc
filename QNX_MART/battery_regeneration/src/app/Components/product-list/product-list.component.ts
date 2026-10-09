import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { ActivatedRoute, Router } from '@angular/router';
import { AddCartService } from '../../../services/add-cart.service';
import { CartStateService } from '../../../services/cart-state.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-product-list',
  imports: [FormsModule, CommonModule],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.css'
})
export class ProductListComponent implements OnInit {

  products: any[] = [];
  allProducts: any[] = [];
  filteredProducts: any[] = [];
  paginatedProducts: any[] = [];

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

  // Pagination
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [1, 5, 10, 20, 40];
  startIndex = 0;
  endIndex = 0;

  // Franchise popup
  franchisePopupOpen = false;
  franchisePlans: any[] = [];
  selectedProduct: any = null;
  franchiseLoading = false;
  franchiseError = '';
  showNoPlansMessage = false;

  sliderMaxPrice: number = 5000;
  priceStep: number = 10;

  constructor(
    private productService: ProductService,
    private router: Router,
    private route: ActivatedRoute,
    private cartService: AddCartService,
    private cartState: CartStateService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      const search = (params['search'] || '').trim().toLowerCase();
      const category = params['category'] || '';
      const encoded = params['data'];
      const discountLabel = params['discount_label'] || '';

      let productIds = '';

      if (encoded) {
        productIds = atob(encoded);
      }

      // IMPORTANT: query param बदलला की active filters sync करा
      this.activeCat = category;

      // Category clear झाली तर dependent filters पण clear करा
      if (!category) {
        this.activeSubCat = '';
        this.activeBrand = '';
      }

      this.productService.getProducts({}).subscribe((res: any) => {
        this.allProducts = res.data || [];

        if (productIds) {
          const ids = productIds
            .split(',')
            .map((id: string) => Number(id.trim()));

          this.products = this.allProducts.filter((p: any) =>
            ids.includes(p.id)
          );

          this.discountLabel = discountLabel;

          // encoded products असतील तर category filter नको
          this.activeCat = '';
          this.activeSubCat = '';
          this.activeBrand = '';

        } else {
          this.products = this.allProducts;
          this.discountLabel = '';

          // category query param वरून state sync
          this.activeCat = category;
        }

        this.buildSidebarData();

        this.updateSubcategoriesAndBrands();

        this.applyFilters(search);
      });
    });
  }


  onMinPriceChange(value: number | string): void {
    const n = Number(value);
    if (!Number.isFinite(n)) return;

    this.priceMin = Math.max(
      0,
      Math.min(n, this.priceMax ?? this.sliderMaxPrice)
    );
  }

  onMaxPriceChange(value: number | string): void {
    const n = Number(value);
    if (!Number.isFinite(n)) return;

    this.priceMax = Math.min(
      this.sliderMaxPrice,
      Math.max(n, this.priceMin ?? 0)
    );
  }

  getMinPricePercent(): number {
    return this.sliderMaxPrice > 0
      ? ((this.priceMin ?? 0) / this.sliderMaxPrice) * 100
      : 0;
  }

  getMaxPricePercent(): number {
    return this.sliderMaxPrice > 0
      ? ((this.priceMax ?? this.sliderMaxPrice) / this.sliderMaxPrice) * 100
      : 100;
  }

  // Increase or decrease slider range
  changePriceRange(value: number): void {
    this.sliderMaxPrice = value === 0
      ? this.maxProductPrice
      : value;

    this.priceStep = this.sliderMaxPrice <= 5000 ? 10 : 100;

    this.priceMin = null;
    this.priceMax = null;
  }

  // ngOnInit() {
  //   this.route.queryParams.subscribe(params => {
  //     const search = (params['search'] || '').trim().toLowerCase();
  //     const category = params['category'] || '';
  //     const encoded = params['data'];
  //     const discountLabel = params['discount_label'] || '';
  //     let productIds = '';
  //     if (encoded) {
  //       productIds = atob(encoded);
  //     }

  //     this.productService.getProducts({}).subscribe((res: any) => {
  //       this.allProducts = res.data || [];

  //       if (productIds) {
  //         const ids = productIds.split(',').map((id: string) => Number(id.trim()));
  //         this.products = this.allProducts.filter((p: any) => ids.includes(p.id));
  //         this.discountLabel = discountLabel;
  //       } else {
  //         this.products = this.allProducts;
  //         this.discountLabel = '';
  //       }

  //       this.buildSidebarData();

  //       if (!productIds && category) {
  //         this.activeCat = category;
  //         this.updateSubcategoriesAndBrands();
  //       }

  //       this.applyFilters(search);
  //     });
  //   });
  // }

  buildSidebarData() {
    this.categories = [...new Set(this.products.map(p => p.category_name).filter(Boolean))].sort();
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

  // ------------------- FRANCHISE (UPDATED) -------------------
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
            this.franchiseError = res.message || 'No franchise plans available.';
          } else {
            // Plans found – clear any error
            this.franchiseError = '';
            this.showNoPlansMessage = false;
          }
        } else {
          // API returned status false
          this.showNoPlansMessage = true;
          this.franchiseError = res.message || 'Failed to load franchise plans.';
        }
      },
      error: (err) => {
        console.error(err);
        this.franchiseLoading = false;
        this.showNoPlansMessage = true;
        // Use the error message from the API if available
        this.franchiseError = err.error?.message || 'An error occurred while loading franchise plans.';
      }
    });
  }

  // Navigate to franchise application page with product slug (no plan id)
  goToFranchiseApply() {
    if (!this.selectedProduct) return;
    this.closeFranchisePopup();
    this.router.navigate(['/franchise-apply'], {
      queryParams: {
        product: this.selectedProduct.slug
      }
    });
  }

  closeFranchisePopup() {
    this.franchisePopupOpen = false;
    this.franchisePlans = [];
    this.franchiseError = '';
    this.showNoPlansMessage = false;
  }

  // ------------------- FILTERS & PAGINATION -------------------
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

  clearPriceFilter() {
    this.priceMin = null;
    this.priceMax = null;
    this.applyFilters();
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.activeCat) count++;
    if (this.activeSubCat) count++;
    if (this.activeBrand) count++;
    if (this.priceMin !== null || this.priceMax !== null) count++;
    return count;
  }

  // applyFilters(search: string = '') {
  //   let temp = [...this.products];

  //   if (this.activeCat) temp = temp.filter(p => p.category_name === this.activeCat);
  //   if (this.activeSubCat) temp = temp.filter(p => p.subcategory_name === this.activeSubCat);
  //   if (this.activeBrand) temp = temp.filter(p => p.brand_name === this.activeBrand);

  //   if (this.priceMin !== null) temp = temp.filter(p => Number(p.final_price || p.price) >= this.priceMin!);
  //   if (this.priceMax !== null) temp = temp.filter(p => Number(p.final_price || p.price) <= this.priceMax!);

  //   if (search) {
  //     temp = temp.filter(p =>
  //       p.name?.toLowerCase().includes(search) ||
  //       p.category_name?.toLowerCase().includes(search) ||
  //       p.description?.toLowerCase().includes(search)
  //     );
  //   }

  //   switch (this.selectedSort) {
  //     case 'price_low': temp.sort((a, b) => Number(a.final_price || a.price) - Number(b.final_price || b.price)); break;
  //     case 'price_high': temp.sort((a, b) => Number(b.final_price || b.price) - Number(a.final_price || a.price)); break;
  //     case 'a_z': temp.sort((a, b) => a.name.localeCompare(b.name)); break;
  //     case 'z_a': temp.sort((a, b) => b.name.localeCompare(a.name)); break;
  //   }

  //   this.filteredProducts = temp;
  //   this.resetPagination();
  // }

  applyFilters(search: string = '') {
    let temp = [...this.products];

    // Category Filter
    if (this.activeCat) {
      temp = temp.filter(
        p => p.category_name === this.activeCat
      );
    }

    // Subcategory Filter
    if (this.activeSubCat) {
      temp = temp.filter(
        p => p.subcategory_name === this.activeSubCat
      );
    }

    // Brand Filter
    if (this.activeBrand) {
      temp = temp.filter(
        p => p.brand_name === this.activeBrand
      );
    }

    // Minimum Price Filter
    if (this.priceMin !== null) {
      temp = temp.filter(
        p => this.getFinalPrice(p) >= this.priceMin!
      );
    }

    // Maximum Price Filter
    if (this.priceMax !== null) {
      temp = temp.filter(
        p => this.getFinalPrice(p) <= this.priceMax!
      );
    }

    // Search Filter
    const searchText = search.trim().toLowerCase();

    if (searchText) {
      temp = temp.filter(p =>
        p.name?.toLowerCase().includes(searchText) ||
        p.category_name?.toLowerCase().includes(searchText) ||
        p.description?.toLowerCase().includes(searchText)
      );
    }

    // Sorting
    switch (this.selectedSort) {

      case 'price_low':
        temp.sort(
          (a, b) => this.getFinalPrice(a) - this.getFinalPrice(b)
        );
        break;

      case 'price_high':
        temp.sort(
          (a, b) => this.getFinalPrice(b) - this.getFinalPrice(a)
        );
        break;

      case 'a_z':
        temp.sort(
          (a, b) => (a.name || '').localeCompare(b.name || '')
        );
        break;

      case 'z_a':
        temp.sort(
          (a, b) => (b.name || '').localeCompare(a.name || '')
        );
        break;
    }

    this.filteredProducts = temp;
    this.resetPagination();
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

  onItemsPerPageChange() {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePaginatedProducts();
  }

  goToPage(page: number | string) {
    if (typeof page !== 'number') return;
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedProducts();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage() { if (this.currentPage > 1) this.goToPage(this.currentPage - 1); }
  nextPage() { if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1); }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    pages.push(1);

    if (total <= 7) {
      for (let i = 2; i <= total; i++) {
        pages.push(i);
      }
    } else {
      let start = Math.max(2, current - 1);
      let end = Math.min(total - 1, current + 1);

      if (current <= 3) {
        start = 2;
        end = 4;
      } else if (current >= total - 2) {
        start = total - 3;
        end = total - 1;
      }

      if (start > 2) {
        pages.push('...');
      }

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (end < total - 1) {
        pages.push('...');
      }

      pages.push(total);
    }

    return pages;
  }

  firstPage() {
    this.goToPage(1);
  }

  lastPage() {
    this.goToPage(this.totalPages);
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
        parseFloat(product.final_price) ||
        parseFloat(product.price) ||
        0
      );
    }

    const price = parseFloat(product.price) || 0;
    const discVal = parseFloat(product.discount_value) || 0;

    if (!discVal) {
      return Math.round(price);
    }

    if (product.discount_type === 'percent') {
      const finalPrice = price - (price * discVal / 100);

      return Math.round(
        Math.max(0, finalPrice)
      );
    }

    if (product.discount_type === 'flat') {
      const finalPrice = price - discVal;

      return Math.round(
        Math.max(0, finalPrice)
      );
    }

    return Math.round(price);
  }

  getDiscountDisplay(product: any): string {
    if (product.applied_offer) {
      const o = product.applied_offer;
      return o.type === 'flat' ? `₹${o.value} OFF` : `${o.value}% OFF`;
    }
    const discVal = parseFloat(product.discount_value) || 0;
    if (!discVal) return '';
    return product.discount_type === 'flat' ? `₹${discVal} OFF` : `${discVal}% OFF`;
  }

  getOfferTitle(product: any): string {
    return product.applied_offer?.title || '';
  }

  getSavedAmount(product: any): number {
    return Math.round((this.getOriginalPrice(product) - this.getFinalPrice(product)) * 100) / 100;
  }

  getDiscountValue(product: any): number | null {
    if (product.applied_offer?.value) return parseFloat(product.applied_offer.value);
    const v = parseFloat(product.discount_value);
    return v > 0 ? v : null;
  }

  getDiscountType(product: any): string {
    return product.applied_offer?.type || product.discount_type || '';
  }

  viewDetails(product: any) {
    this.router.navigate(['/product-details', product.slug]);
  }

  addToCart(product: any) {
    const userId = sessionStorage.getItem('user_id');
    if (!userId) {
      this.alertService.unialert('Please login first');
      this.router.navigate(['/login']);
      return;
    }
    this.cartService.addToCart({
      user_id: userId,
      product_id: product.id,
      quantity: 1
    }).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.alertService.unialert(product.name + ' added to cart');
          this.cartService.getCart(Number(userId)).subscribe((cartRes: any) => {
            const items = cartRes.cart_items || [];
            this.cartState.setCartCount(items.length);
          });
        } else {
          this.alertService.unialert(res.msg);
        }
      },
      error: () => this.alertService.unialert('Failed to add product')
    });
  }

  goToEnquiry(product: any) {
    this.router.navigate(['/product-enquiry'], {
      queryParams: {
        product: product.slug
      }
    });
  }

  get maxProductPrice(): number {
    if (!this.products.length) return 100000;
    return Math.ceil(Math.max(...this.products.map(p => Number(p.final_price || p.price) || 0)));
  }
}
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { OlxService } from '../../../services/olx.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-olx-product-list',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './olx-product-list.component.html',
  styleUrl: './olx-product-list.component.css'
})
export class OlxProductListComponent implements OnInit {

  private remartSliderInterval: any;

  // Data
  allListings: any[] = [];
  filteredListings: any[] = [];
  paginatedListings: any[] = [];

  // Filters
  priceMin: number | null = null;
  priceMax: number | null = null;
  selectedCategory: number | null = null;
  selectedSubcategory: number | null = null;
  selectedCondition: string = '';
  selectedSellerType: string = '';
  searchCity: string = '';

  // Sort & Pagination
  selectedSort: string = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;
  pageSizeOptions = [5, 10, 20, 40];
  startIndex = 0;
  endIndex = 0;

  // Sidebar toggle (mobile)
  filterOpen = false;

  // Dropdown data
  categories: any[] = [];
  subcategories: any[] = [];

  // Static options (matching backend CHOICES)
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
    private olxService: OlxService,
    private alertService: AlertService,
    private route: ActivatedRoute,
    public router: Router
  ) { }

  ngOnInit(): void {
    this.loadCategories();

    // Optional query param support: ?category=1
    // this.route.queryParams.subscribe(params => {
    //   if (params['category']) {
    //     this.selectedCategory = Number(params['category']);
    //     this.onCategoryChange(this.selectedCategory);
    //   }
    //   this.loadListings();
    // });

    // Query parameters वाचणे आणि कॅटेगरी नसताना सर्व लिस्ट रिसेट करणे
    this.route.queryParams.subscribe(params => {
      if (params['category']) {
        this.selectedCategory = Number(params['category']);
        this.onCategoryChange(this.selectedCategory);
      } else {
        // जर URL मध्ये category नसेल (म्हणजेच "All Remart Items" वर क्लिक केले असेल)
        this.selectedCategory = null;
        this.selectedSubcategory = null;
        this.subcategories = [];
        this.applyFilters();
      }

      // जर listings आधीच लोड नसतील तर लोड करा
      if (this.allListings.length === 0) {
        this.loadListings();
      }
    });

    this.startRemartAutoSlider();
  }

  startRemartAutoSlider(): void {

    // Prevent duplicate intervals
    if (this.remartSliderInterval) {
      clearInterval(this.remartSliderInterval);
    }

    this.remartSliderInterval = setInterval(() => {

      if (
        !this.paginatedListings ||
        this.paginatedListings.length === 0
      ) {
        return;
      }

      this.paginatedListings.forEach((item: any) => {

        if (
          item?.images &&
          item.images.length > 1
        ) {

          const currentIndex =
            Number(item.currentImgIndex) || 0;

          item.currentImgIndex =
            currentIndex >= item.images.length - 1
              ? 0
              : currentIndex + 1;

        }

      });

    }, 3000);

  }

  // ---------- LOAD ----------
  loadListings(): void {
    this.olxService.getListings().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.allListings = res.data
            // .filter((p: any) => p.status === 'active')
            .map((p: any) => {
              const images = (p.images && p.images.length > 0)
                ? [...p.images].sort((a: any, b: any) =>
                  (b.is_primary ? 1 : 0) - (a.is_primary ? 1 : 0))
                : [{
                  image_url: 'https://via.placeholder.com/400x300/cccccc/ffffff?text=No+Image',
                  is_primary: true
                }];

              return {
                ...p,
                price: parseFloat(p.price) || 0,
                images,
                currentImgIndex: 0
              };
            });
        } else {
          this.allListings = [];
        }
        this.applyFilters();
      },
      error: (err) => {
        console.error('Listings load error', err);
        this.alertService.unialert('❌ Failed to load listings.');
        this.allListings = [];
        this.applyFilters();
      }
    });
  }

  loadCategories(): void {
    this.olxService.getCategories().subscribe({
      next: (res: any) => {
        if (res?.success && Array.isArray(res.data)) {
          this.categories = res.data;
        }
      },
      error: (err) => console.error('Categories load error', err)
    });
  }

  onCategoryChange(catId: number | null): void {
    this.selectedSubcategory = null;
    this.subcategories = [];

    if (catId) {
      this.olxService.getSubcategories(catId).subscribe({
        next: (res: any) => {
          if (res?.success && Array.isArray(res.data)) {
            this.subcategories = res.data;
          }
        },
        error: (err) => console.error('Subcategories load error', err)
      });
    }
    this.applyFilters();
  }

  // ---------- IMAGE CAROUSEL ----------
  // nextImage(item: any, event?: Event): void {
  //   event?.stopPropagation();
  //   if (!item?.images?.length) return;
  //   item.currentImgIndex = (item.currentImgIndex + 1) % item.images.length;
  // }

  // prevImage(item: any, event?: Event): void {
  //   event?.stopPropagation();
  //   if (!item?.images?.length) return;
  //   item.currentImgIndex = (item.currentImgIndex - 1 + item.images.length) % item.images.length;
  // }

  // setImage(item: any, index: number, event?: Event): void {
  //   event?.stopPropagation();
  //   if (!item?.images?.length) return;
  //   item.currentImgIndex = index;
  // }

  // =========================================
  // IMAGE CAROUSEL
  // =========================================

  nextImage(item: any, event?: Event): void {

    event?.preventDefault();
    event?.stopPropagation();

    if (
      !item ||
      !item.images ||
      item.images.length <= 1
    ) {
      return;
    }

    const currentIndex =
      Number(item.currentImgIndex) || 0;

    item.currentImgIndex =
      currentIndex >= item.images.length - 1
        ? 0
        : currentIndex + 1;
  }


  prevImage(item: any, event?: Event): void {

    event?.preventDefault();
    event?.stopPropagation();

    if (
      !item ||
      !item.images ||
      item.images.length <= 1
    ) {
      return;
    }

    const currentIndex =
      Number(item.currentImgIndex) || 0;

    item.currentImgIndex =
      currentIndex === 0
        ? item.images.length - 1
        : currentIndex - 1;
  }


  setImage(
    item: any,
    index: number,
    event?: Event
  ): void {

    event?.preventDefault();
    event?.stopPropagation();

    if (
      !item ||
      !item.images ||
      !item.images[index]
    ) {
      return;
    }

    item.currentImgIndex = index;
  }

  // ---------- FILTERS ----------
  applyFilters(): void {
    let temp = [...this.allListings];

    if (this.priceMin !== null) temp = temp.filter(p => p.price >= this.priceMin!);
    if (this.priceMax !== null) temp = temp.filter(p => p.price <= this.priceMax!);

    if (this.selectedCategory) {
      temp = temp.filter(p => p.category_id === this.selectedCategory);
    }
    if (this.selectedSubcategory) {
      temp = temp.filter(p => p.subcategory_id === this.selectedSubcategory);
    }
    if (this.selectedCondition) {
      temp = temp.filter(p => p.condition === this.selectedCondition);
    }
    if (this.selectedSellerType) {
      temp = temp.filter(p => p.seller_type === this.selectedSellerType);
    }
    if (this.searchCity && this.searchCity.trim()) {
      const s = this.searchCity.trim().toLowerCase();
      temp = temp.filter(p =>
        p.city?.toLowerCase().includes(s) ||
        p.area?.toLowerCase().includes(s)
      );
    }

    // Sort
    switch (this.selectedSort) {
      case 'price_low': temp.sort((a, b) => a.price - b.price); break;
      case 'price_high': temp.sort((a, b) => b.price - a.price); break;
      case 'a_z': temp.sort((a, b) => (a.title || '').localeCompare(b.title || '')); break;
      case 'z_a': temp.sort((a, b) => (b.title || '').localeCompare(a.title || '')); break;
      case 'newest': temp.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()); break;
    }

    this.filteredListings = temp;
    this.resetPagination();
  }

  // ---------- PAGINATION ----------
  resetPagination(): void {
    this.currentPage = 1;
    this.totalItems = this.filteredListings.length;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePaginatedListings();
  }

  updatePaginatedListings(): void {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedListings = this.filteredListings.slice(start, end);
    this.startIndex = this.totalItems === 0 ? 0 : start + 1;
    this.endIndex = Math.min(end, this.totalItems);
  }

  onItemsPerPageChange(): void {
    this.currentPage = 1;
    this.totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
    this.updatePaginatedListings();
  }

  goToPage(page: number | string): void {
    if (typeof page !== 'number') return;
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePaginatedListings();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  previousPage(): void { if (this.currentPage > 1) this.goToPage(this.currentPage - 1); }
  nextPage(): void { if (this.currentPage < this.totalPages) this.goToPage(this.currentPage + 1); }
  firstPage(): void { this.goToPage(1); }
  lastPage(): void { this.goToPage(this.totalPages); }

  getPageNumbers(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 0) return pages;
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

  // ---------- CLEAR ----------
  clearAllFilters(): void {
    this.priceMin = null;
    this.priceMax = null;
    this.selectedCategory = null;
    this.selectedSubcategory = null;
    this.selectedCondition = '';
    this.selectedSellerType = '';
    this.searchCity = '';
    this.selectedSort = '';
    this.subcategories = [];
    this.applyFilters();
  }

  get activeFilterCount(): number {
    let count = 0;
    if (this.priceMin !== null || this.priceMax !== null) count++;
    if (this.selectedCategory) count++;
    if (this.selectedSubcategory) count++;
    if (this.selectedCondition) count++;
    if (this.selectedSellerType) count++;
    if (this.searchCity && this.searchCity.trim()) count++;
    return count;
  }

  // ---------- LABELS ----------
  getConditionLabel(value: string): string {
    return this.conditions.find(c => c.value === value)?.label || value || '';
  }

  getSellerTypeLabel(value: string): string {
    return this.sellerTypes.find(s => s.value === value)?.label || value || '';
  }

  getCategoryName(id: number | null): string {
    if (!id) return '';
    return this.categories.find(c => c.id === id)?.name || '';
  }

  getSubcategoryName(id: number | null): string {
    if (!id) return '';
    return this.subcategories.find(s => s.id === id)?.name || '';
  }

  formatPrice(price: number | string): string {
    const n = typeof price === 'string' ? parseFloat(price) : price;
    if (!n || n <= 0 || isNaN(n as number)) return 'Price on request';
    return '₹ ' + (n as number).toLocaleString('en-IN');
  }

  locationLine(item: any): string {
    if (!item) return '';
    const parts = [item.area, item.city].filter(Boolean);
    return parts.length ? parts.join(', ') : 'Location available on request';
  }

  // ---------- NAVIGATION (no ID in URL) ----------
  private sanitize(item: any): any {
    const p: any = { ...item };
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

  goToDetails(item: any): void {
    try {
      sessionStorage.setItem('selected_product', JSON.stringify(this.sanitize(item)));
    } catch (e) {
      console.warn('Failed to cache product', e);
    }
    this.router.navigate(['/remart-product-detail']);
  }

  goToEnquiry(item: any): void {
    try {
      sessionStorage.setItem('selected_product', JSON.stringify(this.sanitize(item)));
    } catch (e) {
      console.warn('Failed to cache product', e);
    }
    this.router.navigate(['/remart-product-enquiry']);
  }
}
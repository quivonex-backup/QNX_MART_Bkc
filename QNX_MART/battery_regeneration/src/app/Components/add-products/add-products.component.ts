import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { Router } from '@angular/router';
import { CompanyCreateService } from '../../../services/company-create.service';
import { UnitMasterService } from '../../../services/State-Master/unit-master.service';
import { AlertService } from '../../../services/alert.service';
declare var bootstrap: any;

interface VariantGroup {
  name: string;
  options: string[];
  inputVal: string;
}

interface VariantCombo {
  id?: number;
  values: string[];
  price: number | null;
  stock: number | null;
  sku: string;
  imageFile: File | null;
  imagePreview: string | null;
  originalImageIndex: number | null;
}

interface ProductTypePreset {
  label: string;
  icon: string;
  groups: { name: string; suggestions: string[] }[];
}

@Component({
  selector: 'app-add-products',
  imports: [FormsModule, CommonModule],
  templateUrl: './add-products.component.html',
  styleUrl: './add-products.component.css'
})
export class AddProductsComponent implements OnInit {

  @ViewChild('thumbnailInput') thumbnailInput!: ElementRef<HTMLInputElement>;
  @ViewChild('imagesInput') imagesInput!: ElementRef<HTMLInputElement>;
  @ViewChild('videosInput') videosInput!: ElementRef<HTMLInputElement>;

  companies: any[] = [];
  categories: any[] = [];
  subcategories: any[] = [];
  brands: any[] = [];
  units: any[] = [];
  branches: any[] = [];
  specifications: any[] = [{ key: '', value: '' }];

  variantGroups: VariantGroup[] = [];
  variantCombinations: VariantCombo[] = [];
  selectedPreset: string = '';
  showTechImage: boolean = false;

  readonly productTypePresets: ProductTypePreset[] = [
    {
      label: 'Clothing / Apparel',
      icon: 'bi-bag',
      groups: [
        { name: 'Size', suggestions: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
        { name: 'Color', suggestions: ['Red', 'Blue', 'Black', 'White', 'Green', 'Yellow', 'Pink', 'Grey'] }
      ]
    },
    {
      label: 'Footwear',
      icon: 'bi-boot',
      groups: [
        { name: 'Size', suggestions: ['6', '7', '8', '9', '10', '11', '12'] },
        { name: 'Color', suggestions: ['Black', 'Brown', 'White', 'Navy', 'Red'] }
      ]
    },
    {
      label: 'Car / Vehicle',
      icon: 'bi-car-front',
      groups: [
        { name: 'Color', suggestions: ['White', 'Black', 'Silver', 'Red', 'Blue', 'Grey'] },
        { name: 'Variant', suggestions: ['Base', 'Mid', 'Top', 'Sport', 'Limited'] },
        { name: 'Fuel Type', suggestions: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'] }
      ]
    },
    {
      label: 'Electronics / Mobile',
      icon: 'bi-phone',
      groups: [
        { name: 'Storage', suggestions: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
        { name: 'RAM', suggestions: ['4GB', '6GB', '8GB', '12GB', '16GB'] },
        { name: 'Color', suggestions: ['Black', 'White', 'Blue', 'Gold', 'Silver'] }
      ]
    },
    {
      label: 'Laptop / Computer',
      icon: 'bi-laptop',
      groups: [
        { name: 'RAM', suggestions: ['8GB', '16GB', '32GB', '64GB'] },
        { name: 'Storage', suggestions: ['256GB SSD', '512GB SSD', '1TB SSD', '1TB HDD'] },
        { name: 'Processor', suggestions: ['i3', 'i5', 'i7', 'i9', 'Ryzen 5', 'Ryzen 7'] }
      ]
    },
    {
      label: 'Furniture',
      icon: 'bi-house',
      groups: [
        { name: 'Color', suggestions: ['Brown', 'Black', 'White', 'Walnut', 'Oak'] },
        { name: 'Material', suggestions: ['Wood', 'Metal', 'Plastic', 'Fabric', 'Leather'] },
        { name: 'Size', suggestions: ['Small', 'Medium', 'Large', 'King', 'Queen'] }
      ]
    },
    {
      label: 'Jewellery',
      icon: 'bi-gem',
      groups: [
        { name: 'Metal', suggestions: ['Gold', 'Silver', 'Rose Gold', 'Platinum'] },
        { name: 'Size', suggestions: ['6', '7', '8', '9', '10', 'Free Size'] }
      ]
    },
    {
      label: 'Custom',
      icon: 'bi-sliders',
      groups: []
    }
  ];

  // ===== PRODUCT OBJECT – fields are uncommented (active) =====
  product: any = {
    company: '', branch: '', category: '', subcategory: '', brand: '', unit: '',
    name: '', description: '', price: '', discount_price: '',
    discount_type: '', discount_value: '', stock_quantity: '',
    HSN_code: '', GST_percent: '',
    voltage: '', voltage_unit: 'V',
    power: '', power_unit: 'W',
    weight: '', weight_unit: 'kg',
    length: '', length_unit: 'cm',
    height: '', height_unit: 'cm',
    width: '', width_unit: 'cm',
    manufacturing_date: '', expiry_type: 'duration',
    best_before_duration: '', expiry_date: '',
    is_franchise_available: false,
    ISI_certified: false,
    ISO_certified: false,
    COD_available: false,
  };

  readonly weightUnits = ['g', 'kg', 'lb', 'oz', 'mg', 'ton'];
  readonly dimensionUnits = ['mm', 'cm', 'm', 'inch', 'ft'];
  readonly voltageUnits = ['V', 'mV', 'kV'];
  readonly powerUnits = ['W', 'mW', 'kW', 'HP'];

  expiryMode: 'duration' | 'exact' = 'duration';

  bestBeforeOptions = [
    { label: '3 Months', value: '3' },
    { label: '6 Months', value: '6' },
    { label: '12 Months', value: '12' },
    { label: '18 Months', value: '18' },
    { label: '24 Months', value: '24' },
    { label: '36 Months', value: '36' },
    { label: '48 Months', value: '48' },
    { label: '60 Months', value: '60' },
    { label: 'Life Time', value: 'Life Time' },
  ];

  private originalProduct: any = null;
  thumbnailFile!: File;
  thumbnailPreview: string | null = null;
  imageFiles: File[] = [];
  previewUrls: any[] = [];
  selectedVideos: File[] = [];
  videoPreviewUrls: any[] = [];

  submitted = false;
  isSubmitting = false;
  validationErrors: any = {};

  readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/Avif'];
  readonly ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'];
  readonly MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  readonly MAX_VIDEO_SIZE = 50 * 1024 * 1024;
  readonly MAX_IMAGES_COUNT = 10;
  readonly MAX_VIDEOS_COUNT = 5;
  private readonly DRAFT_KEY = 'add_product_draft';

  private originalWeightBase: number = 0;
  private originalLengthBase: number = 0;
  private originalWidthBase: number = 0;
  private originalHeightBase: number = 0;

  // ===== PRODUCT LIST PROPERTIES =====
  showProductList = false;
  productList: any[] = [];
  productListLoading = false;
  filterCompanyId: any = '';
  isEditMode = false;
  editProductId: number | null = null;
  originalStock: number = 0;
  originalVariantStocks: number[] = [];
  existingImages: { id: number; url: string }[] = [];
  deletedImageIds: number[] = [];
  existingVideos: { id: number; url: string; name: string }[] = [];
  deletedVideoIds: number[] = [];

  constructor(
    private productService: ProductService,
    private router: Router,
    private companyService: CompanyCreateService,
    private unitService: UnitMasterService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    const token = sessionStorage.getItem('access_token');
    const userId = sessionStorage.getItem('user_id');
    if (!token || !userId) {
      this.alertService.unialert('Please login first');
      this.router.navigate(['/login']);
      return;
    }
    this.restoreDraft();
    this.loadCompanyNames();
    this.loadUnits();
  }


  hsnError: boolean = false;

  validateHSNCode(): void {
    const value = (this.product.HSN_code || '').toString().trim();

    // Only numbers allowed
    if (value && !/^\d+$/.test(value)) {
      this.hsnError = true;
      return;
    }

    // Only 4, 6 or 8 digits allowed
    if (value && !/^\d{4}$|^\d{6}$|^\d{8}$/.test(value)) {
      this.hsnError = true;
      return;
    }

    this.hsnError = false;
  }

  selectedProduct: any = null;
  selectedDetailType: string = '';

  getShortText(text: string, limit: number = 80): string {
    if (!text) {
      return '—';
    }

    return text.length > limit
      ? text.substring(0, limit) + '...'
      : text;
  }

  openProductDetails(product: any, type: string): void {
    this.selectedProduct = product;
    this.selectedDetailType = type;

    const modalElement = document.getElementById('productDetailsModal');

    if (modalElement) {
      const modal = new bootstrap.Modal(modalElement);
      modal.show();
    }
  }

  // ===== LIST & FORM TOGGLE =====

  toggleProductList() {
    this.showProductList = !this.showProductList;
    if (this.showProductList && this.productList.length === 0) {
      this.loadProductList();
    }
  }

  showAddForm() {
    this.showProductList = false;
    this.isEditMode = false;
    this.editProductId = null;
    this.resetFormData();
  }

  // ===== LOAD PRODUCT LIST =====

  loadProductList() {
    this.productListLoading = true;
    const payload = this.filterCompanyId ? { company_id: this.filterCompanyId } : {};
    this.productService.getProductsByCompany(payload).subscribe({
      next: (res: any) => {
        this.productList = (res.data || []).map((p: any) => {
          if (typeof p.specifications === 'string') {
            try { p.specifications = JSON.parse(p.specifications); } catch { p.specifications = []; }
          }
          return p;
        });
        this.productListLoading = false;
      },
      error: (err) => {
        console.error(err);
        this.productListLoading = false;
      }
    });
  }

  onFilterCompanyChange() {
    this.loadProductList();
  }

  // ===== EDIT PRODUCT =====

  editProduct(p: any) {
    this.showProductList = false;
    this.isEditMode = true;
    this.editProductId = p.id;
    this.populateForm(p);
  }

  private populateForm(p: any) {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    this.originalStock = Number(p.stock_quantity) || 0;

    const weight = this.splitUnit(p.weight, 'kg');
    const length = this.splitUnit(p.length, 'cm');
    const height = this.splitUnit(p.height, 'cm');
    const width = this.splitUnit(p.width, 'cm');

    this.product = {
      company: String(p.company ?? ''),
      branch: String(p.branch ?? ''),
      category: String(p.category ?? ''),
      subcategory: String(p.subcategory ?? ''),
      brand: String(p.brand ?? ''),
      unit: String(p.unit ?? ''),
      name: p.name || '',
      description: p.description || '',
      price: p.price || '',
      discount_price: p.discount_price || '',
      discount_type: p.discount_type || '',
      discount_value: p.discount_value || '',
      stock_quantity: '',
      HSN_code: p.HSN_code || '',
      GST_percent: p.GST_percent || '',
      voltage: '', voltage_unit: 'V',
      power: '', power_unit: 'W',
      weight: weight.val, weight_unit: weight.unit,
      length: length.val, length_unit: length.unit,
      height: height.val, height_unit: height.unit,
      width: width.val, width_unit: width.unit,
      manufacturing_date: p.manufacturing_date || '',
      expiry_type: 'duration',
      best_before_duration: p.best_before_duration || '',
      expiry_date: p.expiry_date || '',
      is_franchise_available: p.is_franchise_available === true || p.is_franchise_available === 1 || p.is_franchise_available === '1',
      ISI_certified: p.ISI_certified === true || p.ISI_certified === 1 || p.ISI_certified === '1',
      ISO_certified: p.ISO_certified === true || p.ISO_certified === 1 || p.ISO_certified === '1',
      COD_available: p.COD_available === true || p.COD_available === 1 || p.COD_available === '1',
    };

    this.originalWeightBase = this.convertWeightToKg(Number(this.product.weight), this.product.weight_unit);
    this.originalLengthBase = this.convertDimensionToCm(Number(this.product.length), this.product.length_unit);
    this.originalWidthBase = this.convertDimensionToCm(Number(this.product.width), this.product.width_unit);
    this.originalHeightBase = this.convertDimensionToCm(Number(this.product.height), this.product.height_unit);

    this.expiryMode = p.expiry_date ? 'exact' : 'duration';

    this.thumbnailPreview = p.thumbnail_s3_key || null;
    this.thumbnailFile = null as any;

    this.existingImages = (p.images || []).map((img: any) => ({ id: img.id, url: img.image_s3_key }));
    this.deletedImageIds = [];
    this.previewUrls = [];
    this.imageFiles = [];

    this.existingVideos = (p.videos || []).map((v: any, vi: number) => ({
      id: v.id,
      url: v.video_s3_key,
      name: `Video ${vi + 1}`
    }));
    this.deletedVideoIds = [];
    this.videoPreviewUrls = [];
    this.selectedVideos = [];

    if (p.variants?.length) {
      const keys: string[] = [];
      p.variants.forEach((v: any) => {
        Object.keys(v.attributes || {}).forEach(k => {
          if (!keys.includes(k)) keys.push(k);
        });
      });

      this.variantGroups = keys.map(k => {
        const opts = [...new Set(p.variants.map((v: any) => v.attributes[k]).filter(Boolean))] as string[];
        return { name: k, options: opts, inputVal: '' };
      });

      this.originalVariantStocks = p.variants.map((v: any) => Number(v.stock_quantity) || 0);

      this.variantCombinations = p.variants.map((v: any) => ({
        id: v.id,
        values: keys.map(k => v.attributes[k] ?? ''),
        price: Number(v.price) || null,
        stock: null,
        sku: v.sku || '',
        imageFile: null,
        imagePreview: v.image || null,
        originalImageIndex: v.image_index ?? null
      }));
    } else {
      this.variantGroups = [];
      this.variantCombinations = [];
      this.originalVariantStocks = [];
    }

    if (Array.isArray(p.specifications)) {
      this.specifications = p.specifications.map((s: any) => ({ key: s.key, value: s.value }));
    } else if (typeof p.specifications === 'string') {
      try {
        const parsed = JSON.parse(p.specifications);
        if (Array.isArray(parsed)) {
          this.specifications = parsed;
        } else {
          this.specifications = Object.entries(parsed).map(([key, value]) => ({ key, value: String(value) }));
        }
      } catch {
        this.specifications = [{ key: '', value: '' }];
      }
    } else if (typeof p.specifications === 'object' && p.specifications !== null) {
      this.specifications = Object.entries(p.specifications).map(([key, value]) => ({ key, value: String(value) }));
    } else {
      this.specifications = [{ key: '', value: '' }];
    }

    if (p.company) {
      this.companyService.getBranchesByCompany(p.company).subscribe((r: any) => {
        if (r.status) this.branches = r.data;
      });
      this.companyService.getCategoriesByCompany(p.company).subscribe((r: any) => {
        if (r.status) {
          this.categories = r.data;
          if (p.category) {
            this.companyService.getSubCategoriesByCategory(p.category).subscribe((r2: any) => {
              if (r2.status) {
                this.subcategories = r2.data;
                if (p.subcategory) {
                  this.companyService.getBrandsBySubCategory(p.subcategory).subscribe((r3: any) => {
                    if (r3.status) this.brands = r3.data;
                  });
                }
              }
            });
          }
        }
      });
    }

    this.originalProduct = {
      company: String(p.company ?? ''),
      branch: String(p.branch ?? ''),
      category: String(p.category ?? ''),
      subcategory: String(p.subcategory ?? ''),
      brand: String(p.brand ?? ''),
      unit: String(p.unit ?? ''),
      name: p.name || '',
      description: p.description || '',
      price: p.price || '',
      discount_type: p.discount_type || '',
      discount_value: p.discount_value || '',
      HSN_code: p.HSN_code || '',
      GST_percent: p.GST_percent || '',
      weight: weight.val, weight_unit: weight.unit,
      length: length.val, length_unit: length.unit,
      height: height.val, height_unit: height.unit,
      width: width.val, width_unit: width.unit,
      manufacturing_date: p.manufacturing_date || '',
      best_before_duration: p.best_before_duration || '',
      expiry_date: p.expiry_date || '',
      ISI_certified: p.ISI_certified === true || p.ISI_certified === 1 || p.ISI_certified === '1',
      ISO_certified: p.ISO_certified === true || p.ISO_certified === 1 || p.ISO_certified === '1',
      COD_available: p.COD_available === true || p.COD_available === 1 || p.COD_available === '1',
    };
  }

  private splitUnit(raw: string, defaultUnit: string): { val: string; unit: string } {
    if (!raw) return { val: '', unit: defaultUnit };
    const parts = raw.trim().split(/\s+/);
    return parts.length >= 2
      ? { val: parts[0], unit: parts.slice(1).join(' ') }
      : { val: parts[0], unit: defaultUnit };
  }

  private convertWeightToKg(value: number, unit: string): number {
    if (!value || value <= 0) return 0;
    const u = unit?.toLowerCase() || 'kg';
    const conversions: Record<string, number> = {
      'g': 0.001, 'kg': 1, 'lb': 0.453592, 'oz': 0.0283495, 'mg': 0.000001, 'ton': 1000
    };
    return value * (conversions[u] || 1);
  }

  private convertDimensionToCm(value: number, unit: string): number {
    if (!value || value <= 0) return 0;
    const u = unit?.toLowerCase() || 'cm';
    const conversions: Record<string, number> = {
      'mm': 0.1, 'cm': 1, 'm': 100, 'inch': 2.54, 'ft': 30.48
    };
    return value * (conversions[u] || 1);
  }

  // ===== OTHER METHODS =====

  loadCompanyNames() {
    this.companyService.getCompanyNames().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.companies = res.data;
          if (this.product.company) {
            this.companyService.getBranchesByCompany(this.product.company).subscribe((r: any) => {
              if (r.status) this.branches = r.data;
            });
            this.companyService.getCategoriesByCompany(this.product.company).subscribe((r: any) => {
              if (r.status) {
                this.categories = r.data;
                if (this.product.category) {
                  this.companyService.getSubCategoriesByCategory(this.product.category).subscribe((r2: any) => {
                    if (r2.status) {
                      this.subcategories = r2.data;
                      if (this.product.subcategory) {
                        this.companyService.getBrandsBySubCategory(this.product.subcategory).subscribe((r3: any) => {
                          if (r3.status) this.brands = r3.data;
                        });
                      }
                    }
                  });
                }
              }
            });
          }
        }
      }
    });
  }

  loadUnits() {
    this.unitService.getUnitList().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.units = (res.data || []).filter((u: any) => u.is_active === true);
        }
      }
    });
  }

  onCompanyChange(id: any) {
    this.branches = []; this.categories = []; this.subcategories = []; this.brands = [];
    this.product.branch = ''; this.product.category = ''; this.product.subcategory = ''; this.product.brand = '';
    this.companyService.getBranchesByCompany(id).subscribe((r: any) => { if (r.status) this.branches = r.data; });
    this.companyService.getCategoriesByCompany(id).subscribe((r: any) => { if (r.status) this.categories = r.data; });
  }

  onBranchChange(id: any) {
    // No-op
  }

  onCategoryChange(id: any) {
    this.subcategories = []; this.brands = [];
    this.product.subcategory = ''; this.product.brand = '';
    this.companyService.getSubCategoriesByCategory(id).subscribe((r: any) => { if (r.status) this.subcategories = r.data; });
  }

  onSubCategoryChange(id: any) {
    this.brands = []; this.product.brand = '';
    this.companyService.getBrandsBySubCategory(id).subscribe((r: any) => { if (r.status) this.brands = r.data; });
  }

  // ===== PRICE HELPERS =====

  /** Price after discount (before GST) */
  getPriceAfterDiscount(): number {
    const price = Number(this.product.price) || 0;
    const discount = Number(this.product.discount_value) || 0;
    if (this.product.discount_type === 'percent') {
      return Math.max(price - (price * discount / 100), 0);
    }
    if (this.product.discount_type === 'flat') {
      return Math.max(price - discount, 0);
    }
    return price;
  }

  /** GST amount = GST% of (price after discount) */
  getGstAmount(): number {
    const afterDiscount = this.getPriceAfterDiscount();
    const gst = Number(this.product.GST_percent) || 0;
    return Number(((afterDiscount * gst) / 100).toFixed(2));
  }

  /** Final price = price after discount + GST */
  getFinalPrice(): number {
    return Number((this.getPriceAfterDiscount() + this.getGstAmount()).toFixed(2));
  }

  addSpecification() { this.specifications.push({ key: '', value: '' }); }
  removeSpecification(i: number) { this.specifications.splice(i, 1); }

  onThumbnailSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > this.MAX_IMAGE_SIZE) {
      this.alertService.unialert('Invalid file. Use JPG/PNG/WebP under 5MB.');
      return;
    }
    this.validateImageFile(file).then(ok => {
      if (!ok) { this.alertService.unialert('File content invalid.'); return; }
      this.thumbnailFile = file;
      const r = new FileReader();
      r.onload = (e: any) => this.thumbnailPreview = e.target.result;
      r.readAsDataURL(file);
    });
  }

  onImagesSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    if (files.length > this.MAX_IMAGES_COUNT) { this.alertService.unialert(`Max ${this.MAX_IMAGES_COUNT} images.`); return; }
    this.imageFiles = []; this.previewUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!this.ALLOWED_IMAGE_TYPES.includes(file.type) || file.size > this.MAX_IMAGE_SIZE) continue;
      this.validateImageFile(file).then(ok => {
        if (!ok) return;
        this.imageFiles.push(file);
        const r = new FileReader();
        r.onload = (e: any) => this.previewUrls.push(e.target.result);
        r.readAsDataURL(file);
      });
    }
  }

  onVideosSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (!files) return;
    if (files.length > this.MAX_VIDEOS_COUNT) { this.alertService.unialert(`Max ${this.MAX_VIDEOS_COUNT} videos.`); return; }
    this.selectedVideos = []; this.videoPreviewUrls = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!this.ALLOWED_VIDEO_TYPES.includes(file.type) || file.size > this.MAX_VIDEO_SIZE) continue;
      this.selectedVideos.push(file);
      const r = new FileReader();
      r.onload = (e: any) => this.videoPreviewUrls.push({ url: e.target.result, name: file.name });
      r.readAsDataURL(file);
    }
  }

  removeThumbnail() { this.thumbnailFile = null as any; this.thumbnailPreview = null; }
  removeImage(i: number) { this.imageFiles.splice(i, 1); this.previewUrls.splice(i, 1); }
  removeExistingImage(i: number) {
    const img = this.existingImages[i];
    if (img?.id) this.deletedImageIds.push(img.id);
    this.existingImages.splice(i, 1);
  }
  removeExistingVideo(i: number) {
    const vid = this.existingVideos[i];
    if (vid?.id) this.deletedVideoIds.push(vid.id);
    this.existingVideos.splice(i, 1);
  }
  removeVideo(i: number) { this.selectedVideos.splice(i, 1); this.videoPreviewUrls.splice(i, 1); }

  goToCompanyPage() { this.router.navigate(['/company_create']); }
  goToBranchPage() {
    const companyId = this.product.company;
    if (companyId) {
      this.router.navigate(['/Branch_Master'], { queryParams: { company: companyId } });
    } else {
      this.router.navigate(['/Branch_Master']);
    }
  }
  goToCategoryPage() {
    const companyId = this.product.company;
    const branchId = this.product.branch;
    const queryParams: any = {};
    if (companyId) queryParams.company = companyId;
    if (branchId) queryParams.branch = branchId;
    this.router.navigate(['/Category_Master'], { queryParams });
  }
  goToBrandPage() {
    const categoryId = this.product.category;
    const subcategoryId = this.product.subcategory;
    const queryParams: any = {};
    if (categoryId) queryParams.category = categoryId;
    if (subcategoryId) queryParams.subcategory = subcategoryId;
    this.router.navigate(['/Brand_Master'], { queryParams });
  }
  goToUnitPage() { this.router.navigate(['/Unit_Master']); }
  goToSubCategoryPage() {
    const categoryId = this.product.category;
    if (categoryId) {
      this.router.navigate(['/Sub-Category_Master'], { queryParams: { category: categoryId } });
    } else {
      this.router.navigate(['/Sub-Category_Master']);
    }
  }

  // ===== VARIANT METHODS =====

  applyPreset(presetLabel: string) {
    this.selectedPreset = presetLabel;
    const preset = this.productTypePresets.find(p => p.label === presetLabel);
    if (!preset || preset.groups.length === 0) return;
    this.variantGroups = preset.groups.map(g => ({ name: g.name, options: [], inputVal: '' }));
    this.variantCombinations = [];
  }

  addVariantGroup() {
    this.variantGroups.push({ name: '', options: [], inputVal: '' });
  }

  removeVariantGroup(gi: number) {
    this.variantGroups.splice(gi, 1);
    this.regenerateCombinations();
  }

  onVariantOptionKey(event: KeyboardEvent, gi: number) {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      const val = this.variantGroups[gi].inputVal.trim();
      if (val && !this.variantGroups[gi].options.includes(val)) {
        this.variantGroups[gi].options.push(val);
        this.variantGroups[gi].inputVal = '';
        this.regenerateCombinations();
      }
    }
  }

  removeVariantOption(gi: number, oi: number) {
    this.variantGroups[gi].options.splice(oi, 1);
    this.regenerateCombinations();
  }

  regenerateCombinations() {
    const validGroups = this.variantGroups.filter(g => g.name && g.options.length > 0);
    if (validGroups.length === 0) {
      this.variantCombinations = [];
      return;
    }
    let result: string[][] = [[]];
    for (const group of validGroups) {
      const newResult: string[][] = [];
      for (const existing of result) {
        for (const opt of group.options) {
          newResult.push([...existing, opt]);
        }
      }
      result = newResult;
    }
    const existingMap = new Map<string, VariantCombo>();
    this.variantCombinations.forEach(c => existingMap.set(c.values.join('|'), c));
    this.variantCombinations = result.map(values => {
      const key = values.join('|');
      const prev = existingMap.get(key);
      return {
        values,
        price: prev?.price ?? null,
        stock: prev?.stock ?? null,
        sku: prev?.sku ?? '',
        imageFile: prev?.imageFile ?? null,
        imagePreview: prev?.imagePreview ?? null,
        originalImageIndex: prev?.originalImageIndex ?? null
      };
    });
  }

  onVariantImageSelect(event: Event, ci: number) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) { this.alertService.unialert('Only image files allowed'); return; }
    if (file.size > this.MAX_IMAGE_SIZE) { this.alertService.unialert('Max 5MB per image'); return; }
    this.variantCombinations[ci].imageFile = file;
    const reader = new FileReader();
    reader.onload = (e: any) => this.variantCombinations[ci].imagePreview = e.target.result;
    reader.readAsDataURL(file);
  }

  deleteVariantCombo(ci: number) {
    this.variantCombinations.splice(ci, 1);
  }

  getPresetSuggestions(gi: number): string[] {
    const preset = this.productTypePresets.find(p => p.label === this.selectedPreset);
    return preset?.groups[gi]?.suggestions ?? [];
  }

  addSuggestion(gi: number, val: string) {
    if (!this.variantGroups[gi].options.includes(val)) {
      this.variantGroups[gi].options.push(val);
      this.regenerateCombinations();
    }
  }

  getMinVariantPrice(): number {
    const prices = this.variantCombinations.map(c => Number(c.price)).filter(p => p > 0);
    return prices.length ? Math.min(...prices) : 0;
  }

  getMaxVariantPrice(): number {
    const prices = this.variantCombinations.map(c => Number(c.price)).filter(p => p > 0);
    return prices.length ? Math.max(...prices) : 0;
  }

  getTotalVariantStock(): number {
    return this.variantCombinations.reduce((s, c) => s + (Number(c.stock) || 0), 0);
  }

  // ===== DRAFT =====

  saveDraft() {
    const draft = {
      product: this.product,
      specifications: this.specifications,
      variantGroups: this.variantGroups.map(g => ({ name: g.name, options: g.options, inputVal: '' })),
      expiryMode: this.expiryMode
    };
    localStorage.setItem(this.DRAFT_KEY, JSON.stringify(draft));
  }

  restoreDraft() {
    const raw = localStorage.getItem(this.DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.product) this.product = { ...this.product, ...draft.product };
      if (draft.specifications?.length) this.specifications = draft.specifications;
      if (draft.variantGroups?.length) {
        this.variantGroups = draft.variantGroups;
        this.regenerateCombinations();
      }
      if (draft.expiryMode) this.expiryMode = draft.expiryMode;
    } catch { }
  }

  clearDraft() { localStorage.removeItem(this.DRAFT_KEY); }

  // ===== RESET WITHOUT CONFIRM =====

  private resetFormData() {
    this.clearDraft();
    this.product = {
      company: '', branch: '', category: '', subcategory: '', brand: '', unit: '',
      name: '', description: '', price: '', discount_price: '', discount_type: '',
      discount_value: '', stock_quantity: '', HSN_code: '', GST_percent: '',
      voltage: '', voltage_unit: 'V', power: '', power_unit: 'W',
      weight: '', weight_unit: 'kg', length: '', length_unit: 'cm',
      height: '', height_unit: 'cm', width: '', width_unit: 'cm',
      manufacturing_date: '', expiry_type: 'duration', best_before_duration: '', expiry_date: '',
      is_franchise_available: false,
      ISI_certified: false,
      ISO_certified: false,
      COD_available: false,
    };
    this.specifications = [{ key: '', value: '' }];
    this.variantGroups = [];
    this.variantCombinations = [];
    this.selectedPreset = '';
    this.expiryMode = 'duration';
    this.thumbnailFile = null as any;
    this.thumbnailPreview = null;
    this.imageFiles = [];
    this.previewUrls = [];
    this.selectedVideos = [];
    this.videoPreviewUrls = [];
    this.branches = [];
    this.categories = [];
    this.subcategories = [];
    this.brands = [];
    this.submitted = false;
    this.validationErrors = {};
    this.existingImages = [];
    this.deletedImageIds = [];
    this.existingVideos = [];
    this.deletedVideoIds = [];
    this.isEditMode = false;
    this.editProductId = null;
    this.originalProduct = null;
    this.originalStock = 0;
    this.originalVariantStocks = [];
    this.originalWeightBase = 0;
    this.originalLengthBase = 0;
    this.originalWidthBase = 0;
    this.originalHeightBase = 0;
  }

  // ===== CLEAR WITH CONFIRM =====

  clearForm() {
    this.alertService.uniConfirm('Clear all filled data?').then(confirm => {
      if (!confirm) return;
      this.resetFormData();
    });
  }

  // ===== CANCEL EDIT =====

  cancelEdit() {
    this.resetFormData();
  }

  // ===== SHELF LIFE =====

  getShelfLifeLabel(): string {
    const mfg = this.product.manufacturing_date;
    if (!mfg) return '';
    let expiryDate: Date | null = null;
    if (this.expiryMode === 'exact' && this.product.expiry_date) {
      expiryDate = new Date(this.product.expiry_date);
    } else if (this.expiryMode === 'duration' && this.product.best_before_duration) {
      expiryDate = new Date(mfg);
      expiryDate.setMonth(expiryDate.getMonth() + Number(this.product.best_before_duration));
    }
    if (!expiryDate) return '';
    const mfgDate = new Date(mfg);
    const diffMs = expiryDate.getTime() - mfgDate.getTime();
    if (diffMs <= 0) return 'Expiry must be after manufacture date';
    const totalDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const months = Math.floor(totalDays / 30);
    const days = totalDays % 30;
    const parts = [];
    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
    if (days > 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);
    return `Shelf life: ${parts.join(' ')} (${totalDays} total days)`;
  }

  // ===== VALIDATION HELPERS =====

  hasError(field: string): boolean { return this.submitted && !!this.validationErrors[field]; }
  getError(field: string): string { return this.validationErrors[field] || ''; }

  private validateImageFile(file: File): Promise<boolean> {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        if (!e.target.result) { resolve(false); return; }
        const arr = new Uint8Array(e.target.result).subarray(0, 4);
        let header = '';
        for (let i = 0; i < arr.length; i++) header += arr[i].toString(16).padStart(2, '0');
        resolve(
          header.startsWith('ffd8ff') || header.startsWith('89504e47') ||
          header.startsWith('47494638') || header.startsWith('52494646')
        );
      };
      reader.onerror = () => resolve(false);
      reader.readAsArrayBuffer(file.slice(0, 4));
    });
  }

  // ===== SUBMIT =====

  submitProduct() {
    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.submitted = true;
    this.validationErrors = {};

    // Validation
    if (!this.product.company) this.validationErrors.company = 'Company is required';
    if (!this.product.category) this.validationErrors.category = 'Category is required';
    if (!this.product.subcategory) this.validationErrors.subcategory = 'Sub Category is required';
    if (!this.product.brand) this.validationErrors.brand = 'Brand is required';
    if (!this.product.name?.trim()) this.validationErrors.name = 'Product Name is required';
    if (!this.product.unit) this.validationErrors.unit = 'Unit is required';

    if (this.product.GST_percent === '' || this.product.GST_percent === null || isNaN(Number(this.product.GST_percent))) {
      this.validationErrors.GST_percent = 'Valid GST Percentage is required';
    }

    if (this.product.weight === '' || this.product.weight === null || Number(this.product.weight) <= 0) {
      this.validationErrors.weight = 'Weight is required';
    }
    if (this.product.length === '' || this.product.length === null || Number(this.product.length) <= 0) {
      this.validationErrors.length = 'Length is required';
    }
    if (this.product.width === '' || this.product.width === null || Number(this.product.width) <= 0) {
      this.validationErrors.width = 'Width is required';
    }
    if (this.product.height === '' || this.product.height === null || Number(this.product.height) <= 0) {
      this.validationErrors.height = 'Height is required';
    }

    if (this.variantCombinations.length > 0) {
      const combosMissingSKU = this.variantCombinations.filter(c => !c.sku || !c.sku.trim());
      if (combosMissingSKU.length > 0) {
        this.validationErrors.variantSKU = `All variant combinations require a SKU. ${combosMissingSKU.length} missing.`;
      }
      const combosMissingImage = this.variantCombinations.filter(c => !c.imageFile && !c.imagePreview);
      if (combosMissingImage.length > 0) {
        this.validationErrors.variantImages = `All variant combinations require an image. ${combosMissingImage.length} missing.`;
      }
    }

    if (!this.isEditMode && !this.thumbnailFile) {
      this.validationErrors.thumbnail = 'Thumbnail is required';
    }

    if (!this.isEditMode) {
      if (this.variantCombinations.length === 0) {
        if (!this.product.price || this.product.price <= 0) this.validationErrors.price = 'Valid Price is required';
        if (this.product.stock_quantity === '' || this.product.stock_quantity < 0) this.validationErrors.stock_quantity = 'Valid Stock is required';
      } else {
        const invalidCombos = this.variantCombinations.filter(
          c => c.price === null || c.price === undefined || Number(c.price) <= 0 ||
            c.stock === null || c.stock === undefined || Number(c.stock) < 0
        );
        if (invalidCombos.length > 0) {
          this.validationErrors.variants = `${invalidCombos.length} variant(s) are missing price or stock`;
        }
      }
    }

    if (Object.keys(this.validationErrors).length > 0) {
      this.isSubmitting = false;
      const msg = this.validationErrors.variants
        ? `Variants error: ${this.validationErrors.variants}\n\nPlease fill price and stock for every variant combination.`
        : 'Please fill all required fields';
      this.alertService.unialert(msg);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Build data
    const allSpecs = [...this.specifications.filter((s: any) => s.key && s.value)];
    const validGroups = this.variantGroups.filter(g => g.name && g.options.length > 0);

    const variantsPayload = this.variantCombinations.length > 0
      ? this.variantCombinations.map((c, i) => {
        let finalStock: number | null = null;
        if (this.isEditMode) {
          const orig = this.originalVariantStocks[i] ?? 0;
          const input = c.stock === null || c.stock === undefined ? null : Number(c.stock);
          finalStock = input === null ? orig : input === 0 ? 0 : orig + input;
        } else {
          finalStock = c.stock;
        }
        return {
          attributes: Object.fromEntries(validGroups.map((g, gi) => [g.name, c.values[gi] ?? ''])),
          id: c.id,
          price: c.price,
          stock: finalStock,
          sku: c.sku || '',
          image_index: c.imageFile ? i : (this.isEditMode ? (c.originalImageIndex ?? null) : null)
        };
      })
      : [];

    const variantAttributesMeta = validGroups.map(g => ({ name: g.name, options: g.options }));

    const formData = new FormData();
    formData.append('is_franchise_available', this.product.is_franchise_available ? '1' : '0');
    formData.append('company', this.product.company);
    formData.append('branch', this.product.branch);
    formData.append('category', this.product.category);
    formData.append('subcategory', this.product.subcategory);
    formData.append('brand', this.product.brand);
    formData.append('unit', this.product.unit);
    formData.append('name', this.product.name);
    formData.append('description', this.product.description);

    if (this.variantCombinations.length > 0) {
      const prices = this.variantCombinations.map(c => Number(c.price)).filter(p => p > 0);
      formData.append('price', String(prices.length ? Math.min(...prices) : 0));
      formData.append('stock_quantity', String(this.variantCombinations.reduce((s, c) => s + (Number(c.stock) || 0), 0)));
    } else {
      formData.append('price', this.product.price);
      formData.append('stock_quantity', this.product.stock_quantity);
    }

    formData.append('discount_price', this.product.discount_price);
    formData.append('discount_type', this.product.discount_type);
    formData.append('discount_value', this.product.discount_value);
    formData.append('HSN_code', this.product.HSN_code);
    formData.append('GST_percent', this.product.GST_percent);
    formData.append('voltage', this.product.voltage ? `${this.product.voltage} ${this.product.voltage_unit}` : '');
    formData.append('power', this.product.power ? `${this.product.power} ${this.product.power_unit}` : '');
    formData.append('weight', String(this.convertWeightToKg(Number(this.product.weight), this.product.weight_unit)));
    formData.append('length', String(this.convertDimensionToCm(Number(this.product.length), this.product.length_unit)));
    formData.append('height', String(this.convertDimensionToCm(Number(this.product.height), this.product.height_unit)));
    formData.append('width', String(this.convertDimensionToCm(Number(this.product.width), this.product.width_unit)));

    formData.append('manufacturing_date', this.product.manufacturing_date);
    formData.append('expiry_type', this.expiryMode);
    if (this.expiryMode === 'duration') {
      formData.append('best_before_duration', this.product.best_before_duration);
    } else {
      formData.append('expiry_date', this.product.expiry_date);
    }
    formData.append('specifications', JSON.stringify(allSpecs));
    formData.append('variants', JSON.stringify(variantsPayload));
    formData.append('variant_attributes', JSON.stringify(variantAttributesMeta));

    if (this.thumbnailFile) formData.append('thumbnail', this.thumbnailFile);
    this.imageFiles.forEach(f => formData.append('images', f));
    this.selectedVideos.forEach(f => formData.append('videos', f));
    this.variantCombinations.forEach((c, i) => {
      if (c.imageFile) formData.append(`variant_image_${i}`, c.imageFile);
    });

    // ============ UPDATE MODE ============
    if (this.isEditMode && this.editProductId) {
      const updateData = new FormData();
      updateData.append('product_id', String(this.editProductId));

      const orig = this.originalProduct || {};
      const appendIfChanged = (key: string, current: string, original: string) => {
        if (current !== original) updateData.append(key, current);
      };

      updateData.append('is_franchise_available', this.product.is_franchise_available ? '1' : '0');

      appendIfChanged('company', String(this.product.company), orig.company ?? '');
      appendIfChanged('branch', String(this.product.branch), orig.branch ?? '');
      appendIfChanged('category', String(this.product.category), orig.category ?? '');
      appendIfChanged('subcategory', String(this.product.subcategory), orig.subcategory ?? '');
      appendIfChanged('brand', String(this.product.brand), orig.brand ?? '');
      appendIfChanged('unit', String(this.product.unit), orig.unit ?? '');
      appendIfChanged('name', this.product.name, orig.name ?? '');
      appendIfChanged('description', this.product.description, orig.description ?? '');
      appendIfChanged('price', String(this.product.price), String(orig.price ?? ''));
      appendIfChanged('discount_type', this.product.discount_type, orig.discount_type ?? '');
      appendIfChanged('discount_value', String(this.product.discount_value), String(orig.discount_value ?? ''));
      appendIfChanged('HSN_code', this.product.HSN_code, orig.HSN_code ?? '');
      appendIfChanged('GST_percent', String(this.product.GST_percent), String(orig.GST_percent ?? ''));
      appendIfChanged('manufacturing_date', this.product.manufacturing_date, orig.manufacturing_date ?? '');
      appendIfChanged('best_before_duration', this.product.best_before_duration, orig.best_before_duration ?? '');
      appendIfChanged('expiry_date', this.product.expiry_date, orig.expiry_date ?? '');

      const currentWeight = this.convertWeightToKg(Number(this.product.weight), this.product.weight_unit);
      const currentLength = this.convertDimensionToCm(Number(this.product.length), this.product.length_unit);
      const currentWidth = this.convertDimensionToCm(Number(this.product.width), this.product.width_unit);
      const currentHeight = this.convertDimensionToCm(Number(this.product.height), this.product.height_unit);

      if (Math.abs(currentWeight - this.originalWeightBase) > 0.001) {
        updateData.append('weight', String(currentWeight));
      }
      if (Math.abs(currentLength - this.originalLengthBase) > 0.001) {
        updateData.append('length', String(currentLength));
      }
      if (Math.abs(currentWidth - this.originalWidthBase) > 0.001) {
        updateData.append('width', String(currentWidth));
      }
      if (Math.abs(currentHeight - this.originalHeightBase) > 0.001) {
        updateData.append('height', String(currentHeight));
      }

      const inputStock = this.product.stock_quantity === '' || this.product.stock_quantity === null
        ? null : Number(this.product.stock_quantity);
      if (inputStock !== null) {
        updateData.append('stock_quantity', String(inputStock === 0 ? 0 : this.originalStock + inputStock));
      }

      if (this.thumbnailFile) updateData.append('thumbnail', this.thumbnailFile);
      if (this.imageFiles.length) this.imageFiles.forEach(f => updateData.append('images', f));
      if (this.deletedImageIds.length) this.deletedImageIds.forEach(id => updateData.append('delete_images', String(id)));
      if (this.deletedVideoIds.length) this.deletedVideoIds.forEach(id => updateData.append('delete_videos', String(id)));
      if (this.selectedVideos.length) this.selectedVideos.forEach(f => updateData.append('videos', f));

      updateData.append('specifications', JSON.stringify(allSpecs));

      if (variantsPayload.length) {
        updateData.append('variants', JSON.stringify(variantsPayload));
        updateData.append('variant_attributes', JSON.stringify(variantAttributesMeta));
        this.variantCombinations.forEach((c, i) => {
          if (c.imageFile) updateData.append(`variant_image_${i}`, c.imageFile);
        });
      }

      this.productService.updateProduct(updateData).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res.status) {
            this.alertService.unialert('Product Updated Successfully');

            // ===== FULLY RESET FORM & SWITCH TO LIST =====
            this.resetFormData();
            this.showProductList = true;
            this.loadProductList();
          } else {
            this.alertService.unialert(res.message || 'Failed to update product.');
          }
        },
        error: (err: any) => {
          this.isSubmitting = false;
          console.error(err);
          const errorMessage = err?.error?.message || 'Error updating product. Please try again.';
          this.alertService.unialert(errorMessage);
        }
      });
    } else {
      // ============ CREATE MODE ============
      this.productService.createProduct(formData).subscribe({
        next: (res: any) => {
          this.isSubmitting = false;
          if (res.status) {
            this.clearDraft();
            this.alertService.unialert('Product Created Successfully');
            this.router.navigate(['/product_list']);
          } else {
            this.alertService.unialert(res.message || 'Failed to create product.');
          }
        },
        error: (err: any) => {
          this.isSubmitting = false;
          console.error(err);
          const errorMessage = err?.error?.message || 'Error creating product. Please try again.';
          this.alertService.unialert(errorMessage);
        }
      });
    }
  }

  // ===== LIST HELPER METHODS (for variant labels) =====

  getVariantShort(v: any): string {
    if (!v.attributes) return '';
    const parts = Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`);
    return parts.join(' ');
  }

  getVariantLabel(v: any, allVariants: any[]): string {
    if (!v.attributes) return '';
    const parts = Object.entries(v.attributes).map(([k, val]) => `${k}: ${val}`);
    const price = v.final_price ?? v.price;
    return `${parts.join(' ')} | ₹${price} | Stock: ${v.stock_quantity}`;
  }
}
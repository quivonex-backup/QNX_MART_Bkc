import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { BrandMasterService } from '../../../../services/State-Master/brand-master.service';
import { CompanyCreateService } from '../../../../services/company-create.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-brand-master',
  imports: [FormsModule, CommonModule],
  templateUrl: './brand-master.component.html',
  styleUrl: './brand-master.component.css'
})
export class BrandMasterComponent implements OnInit {

  categories: any[] = [];
  subcategories: any[] = [];
  brands: any[] = [];
  isEditMode = false;
  editBrandId: number | null = null;

  formData = {
    category: '',
    subcategory: '',
    name: '',
    description: ''
  };

  constructor(
    private brandService: BrandMasterService,
    private service: CompanyCreateService,
    private router: Router,
    private route: ActivatedRoute,
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
    this.loadCategories();
    this.loadBrands();

    // Pre‑select category and subcategory from query params
    this.route.queryParams.subscribe(params => {
      const categoryId = params['category'];
      const subcategoryId = params['subcategory'];
      if (categoryId) {
        this.formData.category = categoryId;
        // Load subcategories for the pre‑selected category
        this.brandService.getSubCategoriesByCategory(categoryId).subscribe({
          next: (res: any) => {
            this.subcategories = res.data;
            if (subcategoryId) {
              this.formData.subcategory = subcategoryId;
            }
          },
          error: (err) => console.log(err)
        });
      }
    });
  }

  loadCategories() {
    this.service.getCategoryNames().subscribe({
      next: (res) => { this.categories = res.data; },
      error: (err) => console.log(err)
    });
  }

  loadBrands() {
    this.brandService.getBrandList().subscribe({
      next: (res: any) => { this.brands = res.data || []; },
      error: (err) => console.log(err)
    });
  }

  editBrand(brand: any) {
    console.log('Edit Brand:', brand);
    this.isEditMode = true;
    this.editBrandId = brand.id;

    this.formData = {
      category: String(brand.category_id),
      subcategory: '',
      name: brand.name,
      description: brand.description
    };

    this.brandService.getSubCategoriesByCategory(brand.category_id).subscribe({
      next: (res: any) => {
        this.subcategories = res.data;
        this.formData.subcategory = String(brand.subcategory_id);
      },
      error: (err) => console.log(err)
    });

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleBrandStatus(brand: any) {
    if (brand.is_active) {
      if (!confirm('Are you sure you want to delete this brand?')) return;
      this.brandService.softDeleteBrand(brand.id).subscribe({
        next: (res: any) => {
          this.alertService.unialert('Brand deleted successfully');
          this.loadBrands();
        },
        error: (err) => {
          console.error(err);
          this.alertService.unialert('Error deleting brand');
        }
      });
    } else {
      this.brandService.restoreBrand(brand.id).subscribe({
        next: (res: any) => {
          this.alertService.unialert('Brand restored successfully');
          this.loadBrands();
        },
        error: (err) => {
          console.error(err);
          this.alertService.unialert('Error restoring brand');
        }
      });
    }
  }

  onCategoryChange(categoryId: any) {
    this.formData.subcategory = '';
    this.brandService.getSubCategoriesByCategory(categoryId).subscribe({
      next: (res: any) => { this.subcategories = res.data; },
      error: (err) => console.log(err)
    });
  }

  onSubmit() {
    const payload: any = {
      name: this.formData.name,
      description: this.formData.description,
      category: this.formData.category,
      subcategory: this.formData.subcategory
    };

    if (this.isEditMode && this.editBrandId) {
      payload.id = this.editBrandId;
      this.brandService.updateBrand(payload).subscribe({
        next: (res: any) => {
          this.alertService.unialert(res.message);
          this.resetForm();
          this.loadBrands();
        },
        error: (err) => {
          console.error(err);
          this.alertService.unialert('Error updating brand');
        }
      });
    } else {
      this.brandService.createBrand(this.formData).subscribe({
        next: (res) => {
          this.alertService.unialert(res.message);
          this.resetForm();
          this.loadBrands();
        },
        error: (err) => console.log(err)
      });
    }
  }

  resetForm() {
    this.formData = { category: '', subcategory: '', name: '', description: '' };
    this.subcategories = [];
    this.isEditMode = false;
    this.editBrandId = null;
  }
}
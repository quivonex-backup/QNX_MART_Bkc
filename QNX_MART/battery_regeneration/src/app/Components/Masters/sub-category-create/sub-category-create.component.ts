import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { CompanyCreateService } from '../../../../services/company-create.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-sub-category-create',
  imports: [FormsModule, CommonModule],
  templateUrl: './sub-category-create.component.html',
  styleUrl: './sub-category-create.component.css'
})
export class SubCategoryCreateComponent implements OnInit {

  categories: any[] = [];
  subCategories: any[] = [];

  isEditMode = false;
  editId: number | null = null;

  formData = {
    category: '',
    name: '',
    description: ''
  };

  constructor(
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
    this.loadSubCategories();

    // Pre‑select category from query param
    this.route.queryParams.subscribe(params => {
      const categoryId = params['category'];
      if (categoryId) {
        this.formData.category = categoryId;
      }
    });
  }

  loadCategories() {
    this.service.getCategoryNames().subscribe({
      next: (res) => {
        console.log("Category API:", res);
        this.categories = res.data;
      },
      error: (err) => console.log(err)
    });
  }

  loadSubCategories() {
    this.service.getSubCategoryList().subscribe({
      next: (res: any) => {
        console.log("SubCategory List API:", res);
        this.subCategories = res.data || [];
      },
      error: (err) => console.log(err)
    });
  }

  onSubmit() {
    const payload: any = {
      category: this.formData.category,
      name: this.formData.name,
      description: this.formData.description
    };

    if (this.isEditMode && this.editId) {
      payload.id = this.editId;
      this.service.updateSubCategory(payload).subscribe({
        next: (res: any) => {
          this.alertService.unialert('Updated Successfully 🔥');
          this.resetForm();
          this.loadSubCategories();
        },
        error: (err) => console.log(err)
      });
    } else {
      this.service.createSubCategory(payload).subscribe({
        next: (res: any) => {
          this.alertService.unialert('Created Successfully ✅');
          this.resetForm();
          this.loadSubCategories();
        },
        error: (err) => console.log(err)
      });
    }
  }

  editSubCategory(sc: any) {
    this.isEditMode = true;
    this.editId = sc.id;
    this.formData = {
      category: sc.category_id ? String(sc.category_id) : String(sc.category),
      name: sc.name,
      description: sc.description
    };
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleStatus(sc: any) {
    if (sc.is_active) {
      if (!confirm('Delete this subcategory?')) return;
      this.service.softDeleteSubCategory(sc.id).subscribe({
        next: () => {
          this.alertService.unialert('Deleted 🗑️');
          this.loadSubCategories();
        }
      });
    } else {
      this.service.restoreSubCategory(sc.id).subscribe({
        next: () => {
          this.alertService.unialert('Restored 🔄');
          this.loadSubCategories();
        }
      });
    }
  }

  resetForm() {
    this.formData = {
      category: '',
      name: '',
      description: ''
    };
    this.isEditMode = false;
    this.editId = null;
  }
}
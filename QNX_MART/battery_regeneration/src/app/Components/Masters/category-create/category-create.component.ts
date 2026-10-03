import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Category, CategoryMasterService } from '../../../../services/State-Master/category-master.service';
import { CompanyCreateService } from '../../../../services/company-create.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-category-create',
  imports: [FormsModule, CommonModule],
  templateUrl: './category-create.component.html',
  styleUrl: './category-create.component.css'
})
export class CategoryCreateComponent implements OnInit {

  companies: any[] = [];
  branches: any[] = [];
  categoriesList: any[] = [];
  isEditMode = false;
  editId: number | null = null;

  category: Category = {
    user: '',
    company: '',
    branch: '',
    name: '',
    description: '',
    status: true
  };

  constructor(
    private categoryService: CategoryMasterService,
    private companyService: CompanyCreateService,
    private router: Router,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    const userId = sessionStorage.getItem('user_id');
    const token = sessionStorage.getItem('access_token');
    if (userId) this.category.user = userId;

    if (!token || !userId) {
      this.alertService.unialert('Please login first');
      this.router.navigate(['/login']);
      return;
    }

    this.loadCompanies();
    this.loadCategoriesList();

    // Pre‑select company (and optionally branch) from query params
    this.route.queryParams.subscribe(params => {
      const companyId = params['company'];
      const branchId = params['branch'];
      if (companyId) {
        this.category.company = companyId;
        // Load branches for the pre‑selected company
        this.companyService.getBranchesByCompany(companyId).subscribe({
          next: (res: any) => {
            if (res.status) {
              this.branches = res.data;
              // If branchId is also given, pre‑select it
              if (branchId) {
                this.category.branch = branchId;
              }
            }
          },
          error: (err) => console.log(err)
        });
      }
    });
  }

  loadCompanies() {
    this.companyService.getCompanyList().subscribe({
      next: (res: any) => {
        if (res.status) this.companies = res.data;
      },
      error: (err) => console.log(err)
    });
  }

  loadCategoriesList() {
    this.categoryService.getCategoryList().subscribe({
      next: (res: any) => {
        console.log('Category List:', res);
        this.categoriesList = res.data || [];
      },
      error: (err) => console.log(err)
    });
  }

  onCompanyChange(companyId: any) {
    this.branches = [];
    this.category.branch = '';
    this.companyService.getBranchesByCompany(companyId).subscribe({
      next: (res: any) => {
        if (res.status) this.branches = res.data;
      },
      error: (err) => console.log(err)
    });
  }

  editCategory(cat: any) {
    this.isEditMode = true;
    this.editId = cat.id;

    // Set company and load branches
    this.category.company = cat.company;
    this.companyService.getBranchesByCompany(cat.company).subscribe({
      next: (res: any) => {
        this.branches = res.data || [];
        this.category.branch = cat.branch;
      }
    });

    this.category.user = cat.user;
    this.category.name = cat.name;
    this.category.description = cat.description;
    this.category.status = cat.is_active;

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  toggleCategoryStatus(cat: any) {
    if (cat.is_active) {
      if (!confirm('Delete this category?')) return;
      this.categoryService.softDeleteCategory(cat.id).subscribe({
        next: () => {
          this.alertService.unialert('Deleted 🗑️');
          this.loadCategoriesList();
        }
      });
    } else {
      this.categoryService.restoreCategory(cat.id).subscribe({
        next: () => {
          this.alertService.unialert('Restored 🔄');
          this.loadCategoriesList();
        }
      });
    }
  }

  createCategory() {
    if (!this.category.company) { this.alertService.unialert('Select company'); return; }
    if (!this.category.name) { this.alertService.unialert('Enter name'); return; }

    const payload: any = {
      ...this.category,
      is_active: this.category.status
    };

    if (this.isEditMode && this.editId) {
      payload.id = this.editId;
      this.categoryService.updateCategory(payload).subscribe({
        next: (res: any) => {
          this.alertService.unialert('Updated Successfully 🔥');
          this.resetForm();
          this.loadCategoriesList();
        },
        error: () => this.alertService.unialert('Update failed')
      });
    } else {
      this.categoryService.createCategory(payload).subscribe({
        next: (res: any) => {
          this.alertService.unialert('Created Successfully ✅');
          this.resetForm();
          this.loadCategoriesList();
        },
        error: () => this.alertService.unialert('Create failed')
      });
    }
  }

  resetForm() {
    this.category = {
      user: sessionStorage.getItem('user_id') || '',
      company: '',
      branch: '',
      name: '',
      description: '',
      status: true
    };
    this.branches = [];
    this.isEditMode = false;
    this.editId = null;
  }
}
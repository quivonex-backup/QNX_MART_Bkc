import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';   // ← added ActivatedRoute
import { BranchMasterService } from '../../../../services/State-Master/branch-master.service';
import { CompanyCreateService } from '../../../../services/company-create.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
    selector: 'app-branch-master',
    imports: [FormsModule, CommonModule],
    templateUrl: './branch-master.component.html',
    styleUrl: './branch-master.component.css'
})
export class BranchMasterComponent implements OnInit {

    companies: any[] = [];
    branchesList: any[] = [];
    loading = false;
    isEditMode = false;
    editId: number | null = null;

    formData = {
        company: '',
        name: '',
        address: '',
        phone_number: '',
        email: ''
    };

    constructor(
        private branchService: BranchMasterService,
        private companyService: CompanyCreateService,
        private router: Router,
        private route: ActivatedRoute,          // ← added
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

        this.loadCompanies();
        this.loadBranchesList();

        // 🔥 Pre‑select company from query parameter
        this.route.queryParams.subscribe(params => {
            const companyId = params['company'];
            if (companyId) {
                this.formData.company = companyId;
                // The dropdown will automatically show the matching company once companies are loaded.
                // If you want to lock the field, you can add a boolean flag and disable the select.
            }
        });
    }

    onPhoneInput(event: any): void {
        const input = event.target as HTMLInputElement;

        // Remove anything except numbers
        const value = input.value.replace(/[^0-9]/g, '');

        // Maximum 10 digits
        this.formData.phone_number = value.slice(0, 10);

        // Update input value
        input.value = this.formData.phone_number;
    }

    loadCompanies() {
        this.companyService.getCompanyNames().subscribe({
            next: (res: any) => {
                if (res.status) this.companies = res.data;
            },
            error: (err) => console.log(err)
        });
    }

    loadBranchesList() {
        this.loading = true;
        this.branchService.getCompanyBranches().subscribe({
            next: (res: any) => {
                console.log('Branch List API:', res);
                this.branchesList = res.data || [];
                this.loading = false;
            },
            error: (err) => {
                console.log(err);
                this.loading = false;
            }
        });
    }

    editBranch(b: any) {
        this.isEditMode = true;
        this.editId = b.id;

        this.formData = {
            company: b.company,
            name: b.name,
            address: b.address,
            phone_number: b.phone_number,
            email: b.email
        };

        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onSubmit() {
        const payload: any = {
            ...this.formData
        };

        // 🔥 UPDATE
        if (this.isEditMode && this.editId) {
            payload.id = this.editId;
            this.branchService.updateBranch(payload).subscribe({
                next: (res: any) => {
                    this.alertService.unialert('Updated Successfully 🔥');
                    this.resetForm();
                    this.loadBranchesList();
                },
                error: () => this.alertService.unialert('Update failed')
            });
        }
        // 🔥 CREATE
        else {
            this.branchService.createBranch(payload).subscribe({
                next: (res: any) => {
                    this.alertService.unialert('Created Successfully ✅');
                    this.resetForm();
                    this.loadBranchesList();
                },
                error: () => this.alertService.unialert('Create failed')
            });
        }
    }

    resetForm() {
        this.formData = {
            company: '',
            name: '',
            address: '',
            phone_number: '',
            email: ''
        };
        this.isEditMode = false;
        this.editId = null;
    }

    toggleBranchStatus(b: any) {
        if (b.is_active) {
            if (!confirm('Delete this branch?')) return;
            this.branchService.softDeleteBranch(b.id).subscribe({
                next: () => {
                    this.alertService.unialert('Deleted 🗑️');
                    this.loadBranchesList();
                }
            });
        } else {
            this.branchService.restoreBranch(b.id).subscribe({
                next: () => {
                    this.alertService.unialert('Restored 🔄');
                    this.loadBranchesList();
                }
            });
        }
    }
}
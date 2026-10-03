import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { SellerRegistrationService } from '../../../services/seller-registration.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-seller-registration',
  imports: [FormsModule, CommonModule, RouterModule],
  templateUrl: './seller-registration.component.html',
  styleUrl: './seller-registration.component.css'
})
export class SellerRegistrationComponent implements OnInit {

  loading = false;
  isEditMode = false;
  sellerId: number | null = null;
  approvalStatus = false;
  agreedToTerms = false;

  sellerData = {
    // Business
    businessType: '',
    businessCategory: '',
    // Contact
    contactPersonName: '',
    designation: '',
    email: '',
    mobile: '',
    alternateMobile: '',
    landline: '',
    // Address
    address: '',
    city: '',
    state: '',
    pincode: '',
    // Tax (only PAN)
    pan: '',
    // Bank
    accountNumber: '',
    ifscCode: '',
    bankName: '',
    branchName: '',
  };

  constructor(
    private router: Router,
    private sellerService: SellerRegistrationService,
    private alertService: AlertService
  ) { }

  ngOnInit() {
    const token = sessionStorage.getItem('access_token');
    const userId = sessionStorage.getItem('user_id');

    // Save referral code from URL
    const currentUrl = window.location.href;
    const url = new URL(currentUrl);
    const referralCode = url.searchParams.get('ref');
    if (referralCode) {
      sessionStorage.setItem('referral_code', referralCode);
    }

    if (!token || !userId) {
      this.alertService.unialert('Please login first.');
      sessionStorage.setItem('redirect_after_login', '/seller-registration');
      this.router.navigate(['/login']);
      return;
    }
    this.loadSellerData();
    window.scrollTo(0, 0);
  }

  loadSellerData() {
    this.sellerService.getSellerList().subscribe({
      next: (res: any) => {
        if (res.status === 'success' && res.data?.length) {
          const sorted = [...res.data].sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          const s = sorted[0];
          this.isEditMode = true;
          this.sellerId = s.id;
          this.approvalStatus = s.is_approved;
          sessionStorage.setItem('seller_id', String(s.id));

          this.sellerData = {
            businessType: s.business_type || '',
            businessCategory: s.business_category || '',
            contactPersonName: s.contact_person_name || '',
            designation: s.designation || '',
            email: s.email || '',
            mobile: s.mobile || '',
            alternateMobile: s.alternate_mobile || '',
            landline: s.landline || '',
            address: s.address || '',
            city: s.city || '',
            state: s.state || '',
            pincode: s.pincode || '',
            pan: s.pan_number || '',          // only pan
            accountNumber: s.account_number || '',
            ifscCode: s.ifsc_code || '',
            bankName: s.bank_name || '',
            branchName: s.branch_name || '',
          };
        }
      },
      error: (err) => console.error(err)
    });
  }

  onSubmit() {
    if (!this.agreedToTerms && !this.isEditMode) {
      this.alertService.unialert('Please agree to Terms & Conditions');
      return;
    }

    this.loading = true;
    const userId = sessionStorage.getItem('user_id');

    const base: any = {
      business_type: this.sellerData.businessType,
      business_category: this.sellerData.businessCategory,
      contact_person_name: this.sellerData.contactPersonName,
      designation: this.sellerData.designation,
      email: this.sellerData.email,
      mobile: this.sellerData.mobile,
      alternate_mobile: this.sellerData.alternateMobile || null,
      landline: this.sellerData.landline || null,
      address: this.sellerData.address,
      state: this.sellerData.state,
      city: this.sellerData.city,
      pincode: this.sellerData.pincode,
      pan_number: this.sellerData.pan || null,
      account_number: this.sellerData.accountNumber || null,
      ifsc_code: this.sellerData.ifscCode || null,
      bank_name: this.sellerData.bankName || null,
      branch_name: this.sellerData.branchName || null,
    };

    if (this.isEditMode && this.sellerId) {
      const payload = { ...base, id: this.sellerId };
      this.sellerService.updateSeller(payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.status === 'success') this.alertService.unialert('✅ ' + res.message);
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.alertService.unialert('❌ Update failed. Please try again.');
        }
      });
    } else {
      const payload = { ...base, user: Number(userId) };
      this.sellerService.registerSeller(payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          if (res.status === 'success') {
            sessionStorage.setItem('seller_id', res.data.id);
            this.sellerId = res.data.id;
            this.isEditMode = true;
            this.alertService.unialert('✅ ' + res.message);

              const referralCode = sessionStorage.getItem('referral_code');

  if (referralCode) {
    this.router.navigate(['/company_create'], {
      queryParams: { ref: referralCode }
    });
  } else {
    this.router.navigate(['/company_create']);
  }

          }
        },
        error: (err) => {
          this.loading = false;
          console.error(err);
          this.alertService.unialert('❌ Registration failed. Please try again.');
        }
      });
    }
  }

  showTermsModal = false;

  openTermsModal(event: Event) {
    event.preventDefault();
    this.showTermsModal = true;
    document.body.style.overflow = 'hidden';
  }
  
  closeTermsModal() {
    this.showTermsModal = false;
    document.body.style.overflow = '';
  }
  
  agreeAndCloseTerms() {
    this.agreedToTerms = true;
    this.closeTermsModal();
  }

}

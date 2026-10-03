import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { PropertyCreateService } from '../../../../services/property-create.service';
import { AlertService } from '../../../../services/alert.service';
import { StateMasterService } from '../../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../../services/State-Master/district-master.service';

@Component({
  selector: 'app-channel-partner-create',
  imports: [CommonModule, FormsModule],
  templateUrl: './channel-partner-create.component.html',
  styleUrls: ['./channel-partner-create.component.css']
})
export class ChannelPartnerCreateComponent implements OnInit {

  isSubmitting = false;

  // Logged-in user id (from session) — sent as `user` in payload
  loggedInUserId: string = '';

  // ===== Master data =====
  states: any[] = [];
  districts: any[] = [];

  // ===== Terms & Conditions =====
  termsAccepted = false;
  showTermsModal = false;

  partner: any = {
    name: '',
    company_name: '',
    mobile: '',
    email: '',
    address: '',
    state: '',      // state id (from state-master)
    city: '',       // district id (from district-master) — used as City
    pincode: '',
    rera_number: '',
    commission_percentage: '',
    notes: ''
  };

  constructor(
    private propertyService: PropertyCreateService,
    private alertService: AlertService,
    private router: Router,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService
  ) { }

  ngOnInit(): void {
    // Pull logged-in user id from session (fallback keys supported)
    this.loggedInUserId =
      sessionStorage.getItem('user_id') ||
      localStorage.getItem('user_id') ||
      this.extractUserIdFromUserObject() ||
      '';

    // 🔒 If not logged in → popup + save current URL + redirect to login
    if (!this.isLoggedIn()) {
      this.alertService.unialert('Please login first.');
      sessionStorage.setItem('redirect_after_login', this.router.url);
      this.router.navigate(['/login']);
      return;
    }

    // Load states for the Location section
    this.loadStates();
  }

  // ---------- AUTH HELPERS ----------
  private isLoggedIn(): boolean {
    if (this.loggedInUserId) return true;

    const tokenKeys = ['token', 'access_token', 'auth_token', 'authToken', 'jwt', 'user_token'];
    for (const k of tokenKeys) {
      const v = localStorage.getItem(k) || sessionStorage.getItem(k);
      if (v && v !== 'null' && v !== 'undefined' && v.trim() !== '') {
        return true;
      }
    }

    return !!this.extractUserIdFromUserObject();
  }

  private extractUserIdFromUserObject(): string {
    const raw = sessionStorage.getItem('user') || localStorage.getItem('user');
    if (!raw) return '';
    try {
      const u = JSON.parse(raw);
      return u?.id || u?._id || '';
    } catch {
      return '';
    }
  }

  private redirectToLogin(message: string) {
    this.alertService.unialert(message);
    sessionStorage.setItem('redirect_after_login', this.router.url);
    this.router.navigate(['/login']);
  }

  // ---------- MASTER DATA ----------
  loadStates() {
    this.stateService.getAllStates().subscribe({
      next: (res: any) => {
        if (res?.status) {
          this.states = res.data || [];
        }
      },
      error: (err: any) => {
        console.error('Load states error', err);
      }
    });
  }

  onStateChange() {
    // Reset dependent data
    this.districts = [];
    this.partner.city = '';

    if (!this.partner.state) return;

    this.districtService
      .getDistrictsByState(Number(this.partner.state))
      .subscribe({
        next: (res: any) => {
          if (res?.status) {
            this.districts = res.data || [];
          }
        },
        error: (err: any) => {
          console.error('Load districts error', err);
        }
      });
  }

  getStateName(id: any): string {
    return this.states.find(s => s.id == id)?.state_name || '';
  }

  getDistrictName(id: any): string {
    return this.districts.find(d => d.id == id)?.district_name || '';
  }

  // ---------- TERMS ----------
  openTermsModal() {
    this.showTermsModal = true;
  }

  closeTermsModal() {
    this.showTermsModal = false;
  }

  acceptTermsFromModal() {
    this.termsAccepted = true;
    this.showTermsModal = false;
  }

  // ---------- NAV ----------
  goBack(): void {
    window.history.back();
  }

  clearForm() {
    this.partner = {
      name: '',
      company_name: '',
      mobile: '',
      email: '',
      address: '',
      state: '',
      city: '',
      pincode: '',
      rera_number: '',
      commission_percentage: '',
      notes: ''
    };
    this.districts = [];
    this.termsAccepted = false;
  }

  // ---------- SUBMIT ----------
  submitForm() {
    // ===== AUTH SAFETY NET =====
    if (!this.isLoggedIn()) {
      this.redirectToLogin('🔒 Please login first to create a channel partner.');
      return;
    }

    // ===== VALIDATION =====
    if (!this.partner.name || !this.partner.mobile || !this.partner.email) {
      this.alertService.unialert('Please fill all required fields');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.partner.email)) {
      this.alertService.unialert('Please enter a valid email address');
      return;
    }

    if (this.partner.mobile.length < 10) {
      this.alertService.unialert('Please enter a valid 10-digit mobile number');
      return;
    }

    if (!this.termsAccepted) {
      this.alertService.unialert('Please accept the Terms & Conditions to continue.');
      return;
    }

    this.isSubmitting = true;

    // ===== PAYLOAD (cp_code & status are managed by backend) =====
    const payload: any = {
      user: this.loggedInUserId,
      name: this.partner.name,
      company_name: this.partner.company_name || '',
      mobile: this.partner.mobile,
      email: this.partner.email,
      address: this.partner.address || '',
      city: this.getDistrictName(this.partner.city),
      city_id: this.partner.city || '',
      state: this.getStateName(this.partner.state),
      state_id: this.partner.state || '',
      pincode: this.partner.pincode || '',
      rera_number: this.partner.rera_number || '',
      commission_percentage: this.partner.commission_percentage || 0,
      notes: this.partner.notes || ''
    };

    console.log('Submitting Channel Partner Payload:', payload);

    // ===== API =====
    this.propertyService.createChannelPartner(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;

        if (res.success) {
          this.alertService.unialert(res.message || 'Channel Partner created successfully.');
          this.clearForm();
        } else {
          this.alertService.unialert(res.message || 'Failed to create channel partner');
        }
      },
      error: (err: any) => {
        this.isSubmitting = false;
        console.error(err);
      
        // 🔒 401 / 403 → popup + redirect to login
        if (err?.status === 401 || err?.status === 403) {
          this.redirectToLogin('Please login first.');
          return;
        }
      
        let errorMessage = 'Something went wrong';
      
        if (err?.error?.errors) {
          const errorObj = err.error.errors;
          const messages: string[] = [];
        
          for (const field in errorObj) {
            const fieldErrors = errorObj[field];
            if (Array.isArray(fieldErrors)) {
              messages.push(...fieldErrors.map((msg: string) => `${field}: ${msg}`));
            } else if (typeof fieldErrors === 'string') {
              messages.push(`${field}: ${fieldErrors}`);
            }
          }
        
          if (messages.length) {
            errorMessage = messages.join('\n');
          }
        } else if (err?.error?.message) {
          errorMessage = err.error.message;
        } else if (err?.message) {
          errorMessage = err.message;
        }
      
        this.alertService.unialert(errorMessage);
      }
    });
  }
}
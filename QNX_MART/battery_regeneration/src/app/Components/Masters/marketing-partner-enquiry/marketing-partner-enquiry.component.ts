import { Component } from '@angular/core';
import { PartnerService } from '../../../../services/partner.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { StateMasterService } from '../../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../../services/State-Master/district-master.service';
import { ActivatedRoute } from '@angular/router';
import { AlertService } from '../../../../services/alert.service';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-marketing-partner-enquiry',
  imports: [CommonModule, FormsModule],
  templateUrl: './marketing-partner-enquiry.component.html',
  styleUrls: ['./marketing-partner-enquiry.component.css']
})
export class MarketingPartnerEnquiryComponent {

  isSubmitting = false;

  states: any[] = [];
  districts: any[] = [];
  talukas: any[] = [];
  villages: any[] = [];
  referralCode: string | null = null;

  imagePreview: SafeUrl | null = null;

  enquiry: any = {
    application_type: '',
    full_name: '',
    email: '',
    mobile: '',
    state: '',
    district: '',
    taluka: '',
    village: '',
    pincode: '',
    working_area: '',
    profession: '',
    experience: '',
    promotion_platforms: [],
    team_size: '',
    profile_image: null
  };

  constructor(
    private enquiryService: PartnerService,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService,
    private route: ActivatedRoute,
    private alertService: AlertService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit(): void {
    this.loadStates();

    // 👇 Set default UI selection here
    this.enquiry.application_type = 'marketing_partner';

    this.route.queryParams.subscribe(params => {
      if (params['ref']) {
        this.referralCode = params['ref'];
        localStorage.setItem('referral_code', this.referralCode ?? '');
      } else {
        this.referralCode = localStorage.getItem('referral_code');
      }
    });
  }

  // ================= STATES =================
  loadStates() {
    this.stateService.getAllStates().subscribe({
      next: (res: any) => {
        if (res.status) {
          this.states = res.data || [];
        }
      },
      error: (err: any) => {
        console.error(err);
      }
    });
  }

  // ================= STATE CHANGE =================
  onStateChange() {
    this.districts = [];
    this.talukas = [];
    this.villages = [];
    this.enquiry.district = '';
    this.enquiry.taluka = '';
    this.enquiry.village = '';

    if (!this.enquiry.state) return;

    this.districtService
      .getDistrictsByState(Number(this.enquiry.state))
      .subscribe({
        next: (res: any) => {
          if (res.status) {
            this.districts = res.data || [];
          }
        },
        error: (err: any) => {
          console.error(err);
        }
      });
  }

  // ================= DISTRICT CHANGE =================
  onDistrictChange() {
    this.talukas = [];
    this.villages = [];
    this.enquiry.taluka = '';
    this.enquiry.village = '';

    if (!this.enquiry.district) return;

    this.districtService
      .getTalukas(
        Number(this.enquiry.state),
        Number(this.enquiry.district)
      )
      .subscribe({
        next: (res: any) => {
          if (res.status) {
            this.talukas = res.data || [];
          }
        },
        error: (err: any) => {
          console.error(err);
        }
      });
  }

  // ================= TALUKA CHANGE =================
  onTalukaChange() {
    this.villages = [];
    this.enquiry.village = '';

    if (!this.enquiry.taluka) return;

    this.districtService
      .getVillages(
        Number(this.enquiry.state),
        Number(this.enquiry.district),
        Number(this.enquiry.taluka)
      )
      .subscribe({
        next: (res: any) => {
          if (res.status) {
            this.villages = res.data || [];
          }
        },
        error: (err: any) => {
          console.error(err);
        }
      });
  }

  getStateName(id: any) {
    return this.states.find(s => s.id == id)?.state_name || '';
  }

  getDistrictName(id: any) {
    return this.districts.find(d => d.id == id)?.district_name || '';
  }

  getTalukaName(id: any) {
    return this.talukas.find(t => t.id == id)?.taluka_name || '';
  }

  getVillageName(id: any) {
    return this.villages.find(v => v.id == id)?.village_name || '';
  }

  // ================= FILE HANDLING =================
  onFileChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.enquiry.profile_image = file;

      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = this.sanitizer.bypassSecurityTrustUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  }

  removePhoto() {
    this.enquiry.profile_image = null;
    this.imagePreview = null;

    // Reset file input
    const fileInput = document.getElementById('profile-photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  goBack(): void {
      // Acts like the browser back button – same as product-enquiry
      window.history.back();
  }

  // ================= PLATFORM HANDLING =================
  onPlatformChange(event: any) {
    const value = event.target.value;
    if (event.target.checked) {
      this.enquiry.promotion_platforms.push(value);
    } else {
      this.enquiry.promotion_platforms =
        this.enquiry.promotion_platforms.filter(
          (x: string) => x !== value
        );
    }
  }

  // ================= CLEAR FORM =================
  clearForm() {
    this.enquiry = {
      application_type: '',
      full_name: '',
      email: '',
      mobile: '',
      state: '',
      district: '',
      taluka: '',
      village: '',
      pincode: '',
      working_area: '',
      profession: '',
      experience: '',
      promotion_platforms: [],
      team_size: '',
      profile_image: null
    };

    this.imagePreview = null;
    this.districts = [];
    this.talukas = [];
    this.villages = [];

    // Reset file input
    const fileInput = document.getElementById('profile-photo') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }

    // Uncheck all platform checkboxes
    const checkboxes = document.querySelectorAll('.platform-option input[type="checkbox"]');
    checkboxes.forEach((cb: any) => {
      cb.checked = false;
    });
  }

  // ================= SUBMIT FORM =================
  submitForm() {
    if (
      !this.enquiry.application_type ||
      !this.enquiry.full_name ||
      !this.enquiry.mobile
    ) {
      this.alertService.unialert('Please fill all required fields');
      return;
    }

    this.isSubmitting = true;

    // ================= FORM DATA =================
    const formData = new FormData();

    formData.append('application_type', this.enquiry.application_type);
    formData.append('full_name', this.enquiry.full_name);
    formData.append('email', this.enquiry.email || '');
    formData.append('mobile', this.enquiry.mobile);

    // LOCATION
    formData.append('state_id', this.enquiry.state);
    formData.append('state', this.getStateName(this.enquiry.state));
    formData.append('district_id', this.enquiry.district);
    formData.append('district', this.getDistrictName(this.enquiry.district));
    formData.append('taluka_id', this.enquiry.taluka);
    formData.append('taluka', this.getTalukaName(this.enquiry.taluka));
    formData.append('village_id', this.enquiry.village);
    formData.append('village', this.getVillageName(this.enquiry.village));

    // OTHER DETAILS
    formData.append('pincode', this.enquiry.pincode || '');
    formData.append('working_area', this.enquiry.working_area || '');
    formData.append('profession', this.enquiry.profession || '');
    formData.append('experience', this.enquiry.experience || '');

    // MULTIPLE PLATFORMS
    formData.append(
      'promotion_platforms',
      JSON.stringify(this.enquiry.promotion_platforms || [])
    );

    // TEAM SIZE ONLY FOR MARKETING HEAD
    if (this.enquiry.application_type === 'marketing_head') {
      formData.append('team_size', this.enquiry.team_size || '0');
    }

    // PROFILE IMAGE
    if (this.enquiry.profile_image) {
      formData.append('profile_image', this.enquiry.profile_image);
    }

    if (this.referralCode) {
      formData.append('referred_by_code', this.referralCode);
    }

    console.log('Submitting FormData');

    // ================= API =================
    this.enquiryService.createEnquiry(formData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;

        if (res.status) {
          this.alertService.unialert(res.message);
          console.log('Response:', res);
          localStorage.removeItem('referral_code');

          // Clear form after successful submission
          this.clearForm();
        }
      },
      error: (err: any) => {
          this.isSubmitting = false;
          console.error(err);
            
          let errorMessage = 'Something went wrong';
            
          // Try to extract structured validation errors
          if (err?.error?.errors) {
              const errorObj = err.error.errors;
              const messages: string[] = [];
              
              for (const field in errorObj) {
                  const fieldErrors = errorObj[field];
                  if (Array.isArray(fieldErrors)) {
                      // Add each error message with the field name for clarity
                      messages.push(...fieldErrors.map((msg: string) => `${field}: ${msg}`));
                  } else if (typeof fieldErrors === 'string') {
                      messages.push(`${field}: ${fieldErrors}`);
                  }
              }
              
              if (messages.length) {
                  errorMessage = messages.join('\n'); // or use bullet points
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
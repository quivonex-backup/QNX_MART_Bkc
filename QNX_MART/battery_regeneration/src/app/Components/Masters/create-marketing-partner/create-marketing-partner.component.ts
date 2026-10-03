import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { PartnerService } from '../../../../services/partner.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-create-marketing-partner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-marketing-partner.component.html',
  styleUrls: ['./create-marketing-partner.component.css']
})
export class CreateMarketingPartnerComponent {
  partnerForm: FormGroup;
  currentStep: number = 1;
  isSubmitting: boolean = false;
  showSuccess: boolean = false;
  showError: boolean = false;
  errorMessage: string = '';
  selectedFile: File | null = null;
  profilePicPreview: string | null = null;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
  private partnerService: PartnerService,
  private alertService: AlertService
  ) {
    this.partnerForm = this.fb.group({
      // Step 1: Personal Information
      fullName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      mobile: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
      aadharCard: ['', [Validators.required, Validators.pattern('^[0-9]{12}$')]],
      profilePic: [''],
      panCard: ['', [Validators.required, Validators.pattern('^[A-Z]{5}[0-9]{4}[A-Z]{1}$')]],
      
      // Step 2: Business Details
      businessName: ['', Validators.required],
      businessType: ['', Validators.required],
      gstNumber: ['', Validators.pattern('^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$')],
      businessAddress: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
      
      // Step 3: Bank Details
      accountHolderName: ['', Validators.required],
      bankName: ['', Validators.required],
      accountNumber: ['', Validators.required],
      ifscCode: ['', [Validators.required, Validators.pattern('^[A-Z]{4}0[A-Z0-9]{6}$')]],
      branchName: [''],
      
      // Step 4: Marketing Information
      channelSocialMedia: [false],
      channelReferral: [false],
      channelOnline: [false],
      channelEvents: [false],
      channelOther: [false],
      socialMediaHandles: [''],
      targetAudience: [''],
      estimatedReach: [''],
      experience: [''],
      whyPartner: [''],
      termsAccepted: [false, Validators.requiredTrue]
    });
  }

  isCurrentStepValid(): boolean {
    if (this.currentStep === 1) {
      const controls = ['fullName', 'email', 'mobile', 'aadharCard', 'panCard'];
      for (const control of controls) {
        const formControl = this.partnerForm.get(control);
        if (!formControl || !formControl.valid) {
          return false;
        }
      }
      return true;
    } else if (this.currentStep === 2) {
      const controls = ['businessName', 'businessType', 'businessAddress', 'city', 'state', 'pincode'];
      for (const control of controls) {
        const formControl = this.partnerForm.get(control);
        if (!formControl || !formControl.valid) {
          return false;
        }
      }
      return true;
    } else if (this.currentStep === 3) {
      const controls = ['accountHolderName', 'bankName', 'accountNumber', 'ifscCode'];
      for (const control of controls) {
        const formControl = this.partnerForm.get(control);
        if (!formControl || !formControl.valid) {
          return false;
        }
      }
      return true;
    } else if (this.currentStep === 4) {
      const termsControl = this.partnerForm.get('termsAccepted');
      return termsControl ? termsControl.valid === true : false;
    }
    return false;
  }

  nextStep() {
    if (this.isCurrentStepValid()) {
      this.currentStep++;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      // Mark all fields as touched to show validation errors
      if (this.currentStep === 1) {
        const controls = ['fullName', 'email', 'mobile', 'aadharCard', 'panCard'];
        controls.forEach(key => {
          const control = this.partnerForm.get(key);
          if (control) {
            control.markAsTouched();
          }
        });
      } else if (this.currentStep === 2) {
        const controls = ['businessName', 'businessType', 'businessAddress', 'city', 'state', 'pincode'];
        controls.forEach(key => {
          const control = this.partnerForm.get(key);
          if (control) {
            control.markAsTouched();
          }
        });
      } else if (this.currentStep === 3) {
        const controls = ['accountHolderName', 'bankName', 'accountNumber', 'ifscCode'];
        controls.forEach(key => {
          const control = this.partnerForm.get(key);
          if (control) {
            control.markAsTouched();
          }
        });
      } else if (this.currentStep === 4) {
        const termsControl = this.partnerForm.get('termsAccepted');
        if (termsControl) {
          termsControl.markAsTouched();
        }
      }
    }
  }

  previousStep() {
    this.currentStep--;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        this.alertService.unialert('File size should be less than 2MB');
        return;
      }
      
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        this.alertService.unialert('Please upload JPG, PNG or JPEG file only');
        return;
      }
      
      this.selectedFile = file;
      this.partnerForm.patchValue({
        profilePic: file.name
      });
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePicPreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  formatPanCard(event: any) {
    let value = event.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    if (value.length > 10) {
      value = value.slice(0, 10);
    }
    const panControl = this.partnerForm.get('panCard');
    if (panControl) {
      panControl.setValue(value, { emitEvent: false });
    }
  }

  formatAadhar(event: any) {
    let value = event.target.value.replace(/[^0-9]/g, '');
    if (value.length > 12) {
      value = value.slice(0, 12);
    }
    const aadharControl = this.partnerForm.get('aadharCard');
    if (aadharControl) {
      aadharControl.setValue(value, { emitEvent: false });
    }
  }

  formatGST(event: any) {
    let value = event.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    if (value.length > 15) {
      value = value.slice(0, 15);
    }
    const gstControl = this.partnerForm.get('gstNumber');
    if (gstControl) {
      gstControl.setValue(value, { emitEvent: false });
    }
  }

  formatIFSC(event: any) {
    let value = event.target.value.toUpperCase();
    value = value.replace(/[^A-Z0-9]/g, '');
    if (value.length > 11) {
      value = value.slice(0, 11);
    }
    const ifscControl = this.partnerForm.get('ifscCode');
    if (ifscControl) {
      ifscControl.setValue(value, { emitEvent: false });
    }
  }

onSubmit() {
  if (this.partnerForm.valid) {
    this.isSubmitting = true;
    this.showError = false;

    const formData = new FormData();
    const f = this.partnerForm.value;

    // ✅ Backend mapping (IMPORTANT)
    formData.append('full_name', f.fullName);
    formData.append('email', f.email);
    formData.append('mobile', f.mobile);
    formData.append('aadhar_card', f.aadharCard);
    formData.append('pan_card', f.panCard);

    formData.append('business_name', f.businessName);
    formData.append('business_type', f.businessType);
    formData.append('gst_number', f.gstNumber || '');
    formData.append('business_address', f.businessAddress);
    formData.append('city', f.city);
    formData.append('state', f.state);
    formData.append('pincode', f.pincode);

    formData.append('account_holder_name', f.accountHolderName);
    formData.append('bank_name', f.bankName);
    formData.append('account_number', f.accountNumber);
    formData.append('ifsc_code', f.ifscCode);
    formData.append('branch_name', f.branchName || '');

    // ✅ Boolean fields
    formData.append('channel_social_media', f.channelSocialMedia);
    formData.append('channel_referral', f.channelReferral);
    formData.append('channel_online', f.channelOnline);
    formData.append('channel_events', f.channelEvents);
    formData.append('channel_other', f.channelOther);

    formData.append('social_media_handles', f.socialMediaHandles || '');
    formData.append('target_audience', f.targetAudience || '');
    formData.append('estimated_reach', f.estimatedReach || '');
    formData.append('experience', f.experience || '');
    formData.append('why_partner', f.whyPartner || '');

    formData.append('terms_accepted', f.termsAccepted);

    // ✅ File
    if (this.selectedFile) {
      formData.append('profile_image', this.selectedFile);
    }

    // ✅ API Call
    this.partnerService.createPartner(formData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showSuccess = true;

        console.log('SUCCESS RESPONSE 🔥', res);

        if (res?.data?.referral_code) {
  sessionStorage.setItem('referral_code', res.data.referral_code);
  console.log('Stored Referral Code:', res.data.referral_code);
}

        this.partnerForm.reset();
        this.currentStep = 1;
        this.selectedFile = null;

        setTimeout(() => {
          this.showSuccess = false;
        }, 5000);
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showError = true;

        console.log('ERROR ❌', err);

        this.errorMessage = err.error?.message || 'Something went wrong';

        setTimeout(() => {
          this.showError = false;
        }, 5000);
      }
    });

  } else {
    Object.keys(this.partnerForm.controls).forEach(key => {
      this.partnerForm.get(key)?.markAsTouched();
    });
  }
}

  getSelectedChannels(): string[] {
    const channels = [];
    const socialMedia = this.partnerForm.get('channelSocialMedia');
    const referral = this.partnerForm.get('channelReferral');
    const online = this.partnerForm.get('channelOnline');
    const events = this.partnerForm.get('channelEvents');
    const other = this.partnerForm.get('channelOther');
    
    if (socialMedia?.value) channels.push('Social Media');
    if (referral?.value) channels.push('Referral');
    if (online?.value) channels.push('Online Ads');
    if (events?.value) channels.push('Events/Exhibitions');
    if (other?.value) channels.push('Other');
    return channels;
  }
}
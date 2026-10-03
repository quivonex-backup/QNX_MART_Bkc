// login.component.ts
import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoginService } from '../../../services/login.service';
import { SellerRegistrationService } from '../../../services/seller-registration.service';
import { IdleService } from '../../../services/idle.service';
import { ElementRef, ViewChild } from '@angular/core';

@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  view: 'login' | 'signup-email' | 'signup-otp' | 'signup-form' | 'forgot' | 'forgot-otp' | 'reset' = 'login';

  isSubmitting = false;
  showLoader = false;

  // Popup state
  showPopup = false;
  popupTitle = '';
  popupMessage = '';
  popupType: 'success' | 'error' | 'warning' | 'info' = 'info';
  popupCallback: (() => void) | null = null;
  showPopupButton = true;

  // Password visibility
  loginPasswordVisible = false;
  signupPasswordVisible = false;
  newPasswordVisible = false;
  confirmPasswordVisible = false;

  loginData = { username: '', password: '' };

  // signup flow
  signupEmail = '';
  signupOtp = '';
  signupData = { name: '', email: '', phone_number: '', address: '', username: '', password: '' };

  // forgot flow
  forgotEmail = '';
  forgotOtp = '';
  newPassword = '';
  confirmPassword = '';

  constructor(
    private loginService: LoginService,
    private router: Router,
    private sellerRegistrationService: SellerRegistrationService,
    private idleService: IdleService
  ) { }

  // Show popup with OK button
  showPopupMessage(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', callback?: () => void) {
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupType = type;
    this.showPopup = true;
    this.showPopupButton = true;
    this.popupCallback = callback || null;
  }

  // Show popup without button (auto-dismiss)
  showAutoPopup(title: string, message: string, type: 'success' | 'error' | 'warning' | 'info', duration: number = 2000, callback?: () => void) {
    this.popupTitle = title;
    this.popupMessage = message;
    this.popupType = type;
    this.showPopup = true;
    this.showPopupButton = false;
    this.popupCallback = callback || null;

    setTimeout(() => {
      this.closePopup();
    }, duration);
  }

  // Close popup
  closePopup() {
    this.showPopup = false;
    if (this.popupCallback) {
      this.popupCallback();
      this.popupCallback = null;
    }
  }

  // Toggle password visibility
  togglePasswordVisibility(field: string) {
    switch (field) {
      case 'login':
        this.loginPasswordVisible = !this.loginPasswordVisible;
        break;
      case 'signup':
        this.signupPasswordVisible = !this.signupPasswordVisible;
        break;
      case 'new':
        this.newPasswordVisible = !this.newPasswordVisible;
        break;
      case 'confirm':
        this.confirmPasswordVisible = !this.confirmPasswordVisible;
        break;
    }
  }

  // Navigate after login
  private navigateAfterLogin() {
    const redirectUrl = sessionStorage.getItem('redirect_after_login');
    const returnUrl = sessionStorage.getItem('returnUrl');

    if (redirectUrl) {
      sessionStorage.removeItem('redirect_after_login');
      this.router.navigateByUrl(redirectUrl);
    } else if (returnUrl) {
      sessionStorage.removeItem('returnUrl');
      this.router.navigateByUrl(returnUrl);
    } else {
      this.router.navigate(['/home']);
    }
  }

  // Check if user has seller record and store seller_id
  private checkSellerAndNavigate() {
    this.sellerRegistrationService.getSellerList().subscribe({
      next: (res: any) => {
        // Check if response has status and data structure
        if (res.status === 'success' && res.data?.length > 0) {
          // Sort by created_at descending to get latest seller
          const sorted = [...res.data].sort(
            (a: any, b: any) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
          );

          const seller = sorted[0];

          if (seller && seller.id) {
            sessionStorage.setItem('seller_id', seller.id.toString());
          }
        }
        
        // Continue with navigation regardless
        this.navigateAfterLogin();
      },
      error: (err) => {
        // Even if seller check fails, continue with navigation
        console.error('Failed to fetch seller info:', err);
        this.navigateAfterLogin();
      }
    });
  }

  // ===== LOGIN =====
  login() {
    if (!this.loginData.username || !this.loginData.password) {
      this.showPopupMessage('Missing Fields', 'Please enter both username and password', 'warning');
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.showLoader = true;

    this.loginService.loginUser(this.loginData).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showLoader = false;
        sessionStorage.setItem('access_token', res.access_token);
        sessionStorage.setItem('refresh_token', res.refresh_token);
        sessionStorage.setItem('user_id', res.user.id.toString());
        sessionStorage.setItem('username', res.user.username);
        sessionStorage.setItem('email', res.user.email);
        sessionStorage.setItem('address', res.user.address);
        localStorage.removeItem('add_product_draft');

        // Show login success popup without OK button, then check seller and navigate
        this.showAutoPopup('Login Successful', '', 'success', 1100, () => {
          this.idleService.startWatching();
          this.checkSellerAndNavigate();
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Login Failed', err?.error?.message || 'Invalid username or password', 'error');
      }
    });
  }

  // ===== SIGNUP STEP 1 — Send OTP to email =====
  sendSignupOtp() {
    if (!this.signupEmail) {
      this.showPopupMessage('Email Required', 'Please enter your email address', 'warning');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.signupEmail)) {
      this.showPopupMessage('Invalid Email', 'Please enter a valid email address', 'warning');
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.showLoader = true;

    this.loginService.sendRegOtp(this.signupEmail).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('OTP Sent', res?.message || 'OTP has been sent to your email', 'success', () => {
          this.view = 'signup-otp';
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Failed', err?.error?.message || err?.error?.error || 'Failed to send OTP', 'error');
      }
    });
  }

  // ===== SIGNUP STEP 2 — Verify OTP =====
  verifySignupOtp() {
    if (!this.signupOtp) {
      this.showPopupMessage('OTP Required', 'Please enter the OTP sent to your email', 'warning');
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.showLoader = true;

    this.loginService.verifyRegOtp(this.signupEmail, this.signupOtp).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Email Verified', res?.message || 'Email verified successfully', 'success', () => {
          this.signupData.email = this.signupEmail;
          this.view = 'signup-form';
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Invalid OTP', err?.error?.message || err?.error?.error || 'Invalid OTP. Please try again', 'error');
      }
    });
  }

  // ===== SIGNUP STEP 3 — Register =====
  isStrongPassword(p: string): boolean {
    return /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/.test(p);
  }

  signup() {
    const d = this.signupData;
    if (!d.name || !d.phone_number || !d.username || !d.password) {
      this.showPopupMessage('Missing Fields', 'Please fill in all required fields', 'warning');
      return;
    }
    if (!d.address) {
      this.showPopupMessage('Address Required', 'Please enter your address', 'warning');
      return;
    }
    if (!this.isStrongPassword(d.password)) {
      this.showPopupMessage('Weak Password', 'Password must be at least 8 characters with 1 uppercase, 1 number & 1 special character', 'warning');
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.showLoader = true;

    this.loginService.registerUser(d).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Registration Successful', res?.message || 'Your account has been created. Please sign in.', 'success', () => {
          this.view = 'login';
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Registration Failed', err?.error?.error || err?.error?.message || 'Registration failed', 'error');
      }
    });
  }

  // ===== FORGOT — Send OTP =====
  sendForgotOtp() {
    if (!this.forgotEmail) {
      this.showPopupMessage('Email Required', 'Please enter your registered email', 'warning');
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.showLoader = true;

    this.loginService.sendOtp(this.forgotEmail).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('OTP Sent', res?.message || 'OTP has been sent to your email', 'success', () => {
          this.view = 'forgot-otp';
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Failed', err?.error?.error || err?.error?.message || 'Failed to send OTP', 'error');
      }
    });
  }

  // ===== FORGOT — Verify OTP =====
  verifyForgotOtp() {
    if (!this.forgotOtp) {
      this.showPopupMessage('OTP Required', 'Please enter the OTP', 'warning');
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.showLoader = true;

    this.loginService.verifyOtp(this.forgotEmail, this.forgotOtp).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('OTP Verified', res?.message || 'OTP verified successfully', 'success', () => {
          this.view = 'reset';
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Invalid OTP', err?.error?.error || err?.error?.message || 'Invalid OTP', 'error');
      }
    });
  }

  // ===== RESET PASSWORD =====
  resetPassword() {
    if (!this.newPassword || !this.confirmPassword) {
      this.showPopupMessage('Missing Fields', 'Please fill in both password fields', 'warning');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.showPopupMessage('Password Mismatch', 'Passwords do not match', 'warning');
      return;
    }
    if (!this.isStrongPassword(this.newPassword)) {
      this.showPopupMessage('Weak Password', 'Password must be at least 8 characters with 1 uppercase, 1 number & 1 special character', 'warning');
      return;
    }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.showLoader = true;

    this.loginService.resetPassword(this.forgotEmail, this.newPassword, this.confirmPassword).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Password Reset', res?.message || 'Password reset successful! Please sign in.', 'success', () => {
          this.view = 'login';
        });
      },
      error: (err) => {
        this.isSubmitting = false;
        this.showLoader = false;
        this.showPopupMessage('Reset Failed', err?.error?.error || err?.error?.message || 'Failed to reset password', 'error');
      }
    });
  }

  @ViewChild('loginPassword') loginPassword!: ElementRef<HTMLInputElement>;
  focusPassword() {
  this.loginPassword.nativeElement.focus();
}
}
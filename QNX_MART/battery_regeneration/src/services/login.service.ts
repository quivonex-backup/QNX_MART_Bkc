import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
  providedIn: 'root'
})
export class LoginService {

  // ======================================== Registration =================================================

  private registerUrl = Const.constUrl + 'accounts/register/';
  private sendRegOtpUrl = Const.constUrl + 'accounts/send-otp/';
  private verifyRegOtpUrl = Const.constUrl + 'accounts/verify-otp/';

  constructor(private http: HttpClient) { }

  sendRegOtp(email: string): Observable<any> {
    return this.http.post(this.sendRegOtpUrl, { email });
  }

  verifyRegOtp(email: string, otp: string): Observable<any> {
    return this.http.post(this.verifyRegOtpUrl, { email, otp });
  }

  registerUser(data: any): Observable<any> {
    return this.http.post(this.registerUrl, data);
  }


  // ====================================== Login ==============================================

  private loginUrl = Const.constUrl + 'accounts/login/'

  loginUser(data: any) {
    return this.http.post(this.loginUrl, data);
  }


  // =================== forget Password ================================

  // Send OTP

  private sendotp = Const.constUrl + 'accounts/forgot-password/send-otp/';
  sendOtp(email: string) {
    return this.http.post(this.sendotp, { email });
  }


  // Verify OTP

  private verifyotp = Const.constUrl + 'accounts/forgot-password/verify-otp/';
  verifyOtp(email: string, otp: string) {
    return this.http.post(this.verifyotp, { email, otp });
  }

  // Reset Password

  private resetpassword = Const.constUrl + 'accounts/forgot-password/reset/';
  resetPassword(email: string, newPassword: string, confirmPassword: string) {
    return this.http.post(this.resetpassword, {
      email,
      password: newPassword,
      confirm_password: confirmPassword
    });
  }

}

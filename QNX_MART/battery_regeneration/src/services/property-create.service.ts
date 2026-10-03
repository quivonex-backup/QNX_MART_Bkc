import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
  providedIn: 'root'
})
export class PropertyCreateService {

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = sessionStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // Create property (FormData)
  createProperty(formData: FormData): Observable<any> {
    return this.http.post(
      Const.constUrl + 'real_estate/property/create/',
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  // Update property (FormData) — requires `property_id` field in formData
  updateProperty(formData: FormData): Observable<any> {
    return this.http.post(
      Const.constUrl + 'real_estate/property-update/',
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  // List my properties
  getMyProperties(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'real_estate/my/properties/',
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // Get amenities list
  getAmenitiesList(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'real_estate/amenities/list/',
      {}
    );
  }

  // Get approved properties (POST as per backend)
  getApprovedProperties(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'real_estate/properties/approved/',
      {}
    );
  }

  // Create property enquiry (JSON)
  createPropertyEnquiry(payload: any): Observable<any> {
    return this.http.post(
      Const.constUrl + 'real_estate/create/enquiry/',
      payload,
      {}
    );
  }

  // Get property details by slug
  getPropertyDetail(slug: string): Observable<any> {
    return this.http.post(
      Const.constUrl + 'real_estate/properties/detail/',
      { slug }
    );
  }

  // Create channel partner (JSON)
  createChannelPartner(payload: any): Observable<any> {
    return this.http.post(
      Const.constUrl + 'real_estate/real-estate/channel-partner/create/',
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  // ============================================================
  // ===== PROPERTY SUBSCRIPTION PLAN APIs ======================
  // ============================================================

  // 1) List all active subscription plans
  getPropertySubscriptionPlans(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'payment/property-subscription-plan/list/',
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // 2) Create a Razorpay order for a plan on a specific property
  createPropertySubscriptionOrder(payload: { property_id: number | string; plan_id: number | string }): Observable<any> {
    return this.http.post(
      Const.constUrl + 'payment/property-subscription/create-order/',
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  // 3) Verify the Razorpay payment
  verifyPropertySubscriptionPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Observable<any> {
    return this.http.post(
      Const.constUrl + 'payment/property-subscription/verify/',
      payload,
      { headers: this.getAuthHeaders() }
    );
  }
}
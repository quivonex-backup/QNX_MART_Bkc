import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
  providedIn: 'root'
})
export class OlxService {

  constructor(private http: HttpClient) { }

  private getAuthHeaders() {
    const token = sessionStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  // ============================================================
  // ===== PUBLIC (No auth required) ============================
  // ============================================================

  /** Categories list */
  getCategories(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/categories/',
      {}
    );
  }

  /** Subcategories list for a category */
  getSubcategories(category_id: number | string): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/subcategories/',
      { category_id }
    );
  }

  /** Attributes list for a category + subcategory */
  getAttributes(category_id: number | string, subcategory_id: number | string): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/attributes/',
      { category_id, subcategory_id }
    );
  }

  // ============================================================
  // ===== AUTH REQUIRED (Listings) =============================
  // ============================================================

  /** Create listing (FormData with images) */
  createListing(formData: FormData): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/listings/create/',
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Update listing (FormData with optional images). Requires `listing_id` */
  updateListing(formData: FormData): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/listings/update/',
      formData,
      { headers: this.getAuthHeaders() }
    );
  }

  /** My listings */
  getMyListings(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/my-listings/',
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  // ============================================================
  // ===== AUTH REQUIRED (Plans & Pricing) ======================
  // ============================================================

  /** All active plans */
  getPlans(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/plans/',
      {},
      { headers: this.getAuthHeaders() }
    );
  }

  /** Category-wise pricing for a given plan */
  getPlanPricing(plan_id: number | string): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/pricing/plans/',
      { plan_id },
      { headers: this.getAuthHeaders() }
    );
  }

  // ============================================================
  // ===== AUTH REQUIRED (Payment) ==============================
  // ============================================================

  /** Create Razorpay order for a listing + plan */
  createPaymentOrder(payload: { listing_id: number | string; plan_id: number | string }): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/payment/create/',
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  /** Verify Razorpay payment */
  verifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/payment/verify/',
      payload,
      { headers: this.getAuthHeaders() }
    );
  }

  // ============================================================
  // ===== PUBLIC LISTINGS (no auth) ============================
  // ============================================================

  /** All active listings */
  getListings(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/listings/',
      {}
    );
  }

  /** Listing detail by id */
  getListingDetail(id: number | string): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/listings/detail/',
      { id }
    );
  }

  /** Create enquiry for a listing (auth required) */
  createListingEnquiry(payload: any): Observable<any> {
    return this.http.post(
      Const.constUrl + 'olx/enquiries/create/',
      payload,
      { headers: this.getAuthHeaders() }
    );
  }


}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Const } from '../app/const'; // adjust path

@Injectable({
  providedIn: 'root'
})
export class AboutService {

  private companyApi = Const.constUrl + 'company/company/';
  private approvedProductCountApi = Const.constUrl + 'product/approved-product-count/';
  private marketingPartnersCountApi = Const.constUrl + 'enquiry/approved-marketing-partners/count/';
  private userCountApi = Const.constUrl + 'accounts/user-count/';

  constructor(private http: HttpClient) {}

  // POST: Get companies (returns total count)
  getCompanies(): Observable<any> {
    return this.http.post(this.companyApi, {});
  }

  // POST: Get approved product count
  getApprovedProductCount(): Observable<any> {
    return this.http.post(this.approvedProductCountApi, {});
  }

  // POST: Get approved marketing partners count
  getApprovedMarketingPartnersCount(): Observable<any> {
    return this.http.post(this.marketingPartnersCountApi, {});
  }

  // POST: Get total user count
  getUserCount(): Observable<any> {
    return this.http.post(this.userCountApi, {});
  }
}
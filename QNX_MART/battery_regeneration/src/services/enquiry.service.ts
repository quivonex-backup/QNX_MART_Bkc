import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
  providedIn: 'root'
})
export class EnquiryService {

  private apiUrl = Const.constUrl + "enquiry/product-enquiry/";

  constructor(private http: HttpClient) { }

  // ✅ Accept FormData for file upload
  createEnquiry(data: FormData): Observable<any> {
    const token = sessionStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
      // ❗ Do NOT set Content-Type – browser will set it to multipart/form-data
    });
    return this.http.post(this.apiUrl, data, { headers });
  }
  
  private myEnquiryUrl = Const.constUrl + "enquiry/my_product-enquiries/";
  
  getMyProductEnquiries(data: any = {}): Observable<any> {
    const token = sessionStorage.getItem('access_token');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    return this.http.post(this.myEnquiryUrl, data, { headers });
  }
}
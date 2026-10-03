import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
  providedIn: 'root'
})
export class PartnerService {


  private apiUrl = Const.constUrl+'enquiry/partner/create/';

  constructor(private http: HttpClient) {}

  createPartner(data: FormData): Observable<any> {
    return this.http.post(this.apiUrl, data);
  }





  // new form api sangam 
    private url = Const.constUrl+'enquiry/marketing-partner/create/';



  createEnquiry(data: any): Observable<any> {
    return this.http.post(this.url, data);
  }
}

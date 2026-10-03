import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
  providedIn: 'root'
})
export class BankService {

  private loanApi = Const.constUrl + 'loan/loan-enquiry/create/';

  constructor(private http: HttpClient) {}

  createLoanEnquiry(data: any): Observable<any> {
    return this.http.post(this.loanApi, data);
  }

}
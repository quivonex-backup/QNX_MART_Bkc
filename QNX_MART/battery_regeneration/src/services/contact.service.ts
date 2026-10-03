import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
  providedIn: 'root'
})
export class ContactService {

   private apiUrl = Const.constUrl+'contact/contact-us/';

  constructor(private http: HttpClient) { }

  sendMessage(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}

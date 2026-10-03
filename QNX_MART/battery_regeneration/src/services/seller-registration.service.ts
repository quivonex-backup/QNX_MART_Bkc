import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
    providedIn: 'root'
})
export class SellerRegistrationService {

    constructor(private http: HttpClient) { }

    private get headers() {
        return new HttpHeaders({
            Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        });
        }

    registerSeller(payload: any): Observable<any> {
        return this.http.post(Const.constUrl + 'seller/seller/create/', payload, { headers: this.headers });
    }

    getSellerList(): Observable<any> {
        return this.http.post(Const.constUrl + 'seller/seller/list/', {}, { headers: this.headers });
    }

    updateSeller(payload: any): Observable<any> {
        return this.http.post(Const.constUrl + 'seller/seller/update/', payload, { headers: this.headers });
    }
}

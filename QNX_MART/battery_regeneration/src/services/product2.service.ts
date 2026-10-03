import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of, tap } from 'rxjs';
import { Const } from '../app/const';
import { Material } from '../Models/models/material.model';

export interface MaterialResponse {
  status: boolean;
  message: string;
  count: number;
  data: Material[];
}

@Injectable({
  providedIn: 'root'
})
export class Product2Service {

  // private apiUrl = Const.constUrl + 'material/material/simple-list/';

  // constructor(private http: HttpClient) {}

  // getMaterialList(category_id?: number): Observable<Material[]> {
  //   const body: any = {};
  //   if (category_id) {
  //     body.category_id = category_id;
  //   }
  //   return this.http.post<Material[]>(this.apiUrl, body);
  // }

 private apiUrl = Const.constUrl + 'material/material/simple-list/';
  private materialCache: MaterialResponse | null = null;

  constructor(private http: HttpClient) {}

  getMaterialList(payload: any = {}): Observable<MaterialResponse> {

    // ✅ If cache exists → return cached data
    if (this.materialCache) {
      console.log('Data from CACHE');
      return of(this.materialCache);
    }

    // ✅ First time → hit API
    console.log('API HIT');
    return this.http.post<MaterialResponse>(this.apiUrl, payload).pipe(
      tap(response => {
        this.materialCache = response; // Store in cache
      })
    );
  }

  // 🔥 Optional: Manual refresh method
clearCache() {
  this.materialCache = null;
}

  private singleApiUrl = Const.constUrl + 'material/material/single/retrieve/';
  
  getMaterialById(id: number): Observable<any> {
    return this.http.post<any>(this.singleApiUrl, { id: id });
  }
}

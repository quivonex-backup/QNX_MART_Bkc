import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../../app/const';

export interface Brand {
  id?: number;
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class BrandMasterService {

 
  private apiUrl = Const.constUrl + 'product/api/brands/create/';

  constructor(private http: HttpClient) {}

  createBrand(data: any): Observable<any> {

    const token = sessionStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(this.apiUrl, data, { headers });

  }


  getSubCategoriesByCategory(categoryId: any) {
  return this.http.post(
    Const.constUrl + 'product/subcategory/by-category/',
    { category: categoryId },
    {
      headers: {
        Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
      }
    }
  );
}

// =================== BRAND LIST API=====================
getBrandList(): Observable<any> {

  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl + 'product/brand/list/',
    {},
    { headers }
  );
}
// =========================== Update =======================================


updateBrand(data: any): Observable<any> {

  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl + 'product/api/brands/update/',
    data,
    { headers }
  );
}

// ======================== Soft Delete ===========================================

softDeleteBrand(id: number): Observable<any> {

  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl + 'product/brand/soft-delete/',
    { id: id },
    { headers }
  );
}


// ====================== RESTORE ===========================
restoreBrand(id: number): Observable<any> {

  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl + 'product/brand/restore/',
    { id: id },
    { headers }
  );
}
}

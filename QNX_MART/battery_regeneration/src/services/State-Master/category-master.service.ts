import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../../app/const';

export interface Category {
  id?: number;
  user: any;
  company: any;
  branch: any;
  name: string;
  description: string;
  status: boolean;
}

export interface SubCategory {
  category: any;
  name: string;
  description: string;
}


@Injectable({
  providedIn: 'root'
})
export class CategoryMasterService {

  private apiUrl = Const.constUrl + 'product/category/create/';

  constructor(private http: HttpClient) { }

  createCategory(data: Category): Observable<any> {

    const headers = new HttpHeaders({
      Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
    });

    return this.http.post(this.apiUrl, data, { headers });
  }






  private subcat = Const.constUrl + 'product/subcategory/create/';

  createSubCategory(data: SubCategory): Observable<any> {

    const token = sessionStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(this.subcat, data, { headers });

  }



// LIST
getCategoryList(): Observable<any> {
  return this.http.post(
    Const.constUrl + 'product/category/list/',
    {},
    { headers: this.getHeaders() }
  );
}

// UPDATE
updateCategory(data: any): Observable<any> {
  return this.http.post(
    Const.constUrl + 'product/category/update/',
    data,
    { headers: this.getHeaders() }
  );
}

// SOFT DELETE
softDeleteCategory(id: number): Observable<any> {
  return this.http.post(
    Const.constUrl + 'product/category/soft-delete/',
    { id },
    { headers: this.getHeaders() }
  );
}

// RESTORE
restoreCategory(id: number): Observable<any> {
  return this.http.post(
    Const.constUrl + 'product/category/restore/',
    { id },
    { headers: this.getHeaders() }
  );
}

// COMMON HEADER
private getHeaders() {
  const token = sessionStorage.getItem('access_token');
  return {
    Authorization: `Bearer ${token}`
  };
}
}
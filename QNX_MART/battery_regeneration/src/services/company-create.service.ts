import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Const } from '../app/const';
import { CompanyResponse } from '../Models/models/company.model';


@Injectable({
  providedIn: 'root'
})
export class CompanyCreateService {

  //  private apiUrl = Const.constUrl+'company/company/create/';


  //   constructor(private http: HttpClient) {}

  //   createCompany(formData: FormData): Observable<CompanyResponse> {
  //     return this.http.post<CompanyResponse>(this.apiUrl, formData);
  //   }

  private apiUrl = Const.constUrl + 'company/company/create/';

  constructor(private http: HttpClient) { }

  createCompany(formData: FormData): Observable<CompanyResponse> {

    const token = sessionStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post<CompanyResponse>(this.apiUrl, formData, { headers });
  }

  getMyCompanyList(): Observable<any> {
    return this.http.post(
      Const.constUrl + 'company/company/list/',
      {},
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }

  private company_list = Const.constUrl + "company/company/list/";



  getCompanyList(): Observable<any> {

    const token = sessionStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(this.company_list, {}, { headers });
  }


  updateCompany(data: FormData) {

    return this.http.post(
      Const.constUrl + 'company/company/update/',
      data,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );

  }


  getCompanyNames() {
    return this.http.post(
      Const.constUrl + 'company/company/names/', {},
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }

  getBranchesByCompany(companyId: any) {
    return this.http.post(
      Const.constUrl + 'branch/company_branches/',
      { company_id: companyId },
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }



  // ====================== branch list aginst  company ============================

  getBranchesList() {
    return this.http.post(
      Const.constUrl + 'branch/company/branches-list/',
      {},
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }


  private SubCategoryUrl = Const.constUrl + 'product/subcategory/create/';

  createSubCategory(data: any): Observable<any> {

    const token = sessionStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(this.SubCategoryUrl, data, { headers });
  }



  // category name
  private categoryApi = Const.constUrl + 'product/category/all/';

  getCategoryNames(): Observable<any> {

    const token = sessionStorage.getItem('access_token');

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    return this.http.post(this.categoryApi, {}, { headers });
  }


  getCategoriesByCompany(companyId: any) {

    return this.http.post(
      Const.constUrl + 'product/category/all/',
      { company_id: companyId },
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );

  }

  getCategoriesByBranch(branchId: any) {
    return this.http.post(
      Const.constUrl + 'branch/branch-categories/',
      { branch_id: branchId },
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }

  // ======================== SUB CATEGORY LIST ============================================

  getSubCategoryList() {

    const token = sessionStorage.getItem('access_token');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    return this.http.post(
      Const.constUrl + 'product/subcategory/by-user/list/',
      {},
      { headers }
    );
  }


  // ================= UPDATE =================
  updateSubCategory(data: any) {
    return this.http.post(
      Const.constUrl + 'product/subcategory/update/',
      data,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }

  // ================= SOFT DELETE =================
  softDeleteSubCategory(id: number) {
    return this.http.post(
      Const.constUrl + 'product/subcategory/soft-delete/',
      { id },
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }

  // ================= RESTORE =================
  restoreSubCategory(id: number) {
    return this.http.post(
      Const.constUrl + 'product/subcategory/restore/',
      { id },
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }


  // sub category name 
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


  // brand name 
  getBrandsBySubCategory(subCategoryId: any) {

    return this.http.post(
      Const.constUrl + 'product/brand/by-subcategory/',
      { subcategory_id: subCategoryId },
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );

  }

  // razorpay 

createPaymentOrder(data: any): Observable<any> {

  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
   Const.constUrl + 'company/create-company-payment-order/',
    data,
    { headers }
  );
}


verifyPayment(data: any): Observable<any> {

  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    'Authorization': `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl +'company/verify-payment/',
    data,
    { headers }
  );
}
}
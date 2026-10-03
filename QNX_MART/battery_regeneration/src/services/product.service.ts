import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Const } from '../app/const';
import { Observable } from 'rxjs';

export interface ApiResponse<T> {
  status: boolean;
  message?: string;
  data: T;
  count?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private createProductApi = Const.constUrl + 'product/api/products/create/';

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('access_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  createProduct(data: FormData) {

    const token = sessionStorage.getItem('access_token');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`
    });

    return this.http.post(
      this.createProductApi,
      data,
      { headers }
    );
  }

  productlist = Const.constUrl + "product/product/approved-list/";


  getProducts(data: any): Observable<any> {
    return this.http.post(this.productlist, data);
  }


  getProductDetails(data: any): Observable<any> {
    return this.http.post(Const.constUrl + "product/api/products/detail/", data);
  }


  // search products
  searchApprovedProducts(query: string) {
    return this.http.post(
      Const.constUrl + 'product/product/search/',
      { search: query }
    );
  }



  // private baseUrl = Const.constUrl + 'product/product/recommended/';

  // getRecommendedProducts(): Observable<any> {
  //   return this.http.post(
  //     this.baseUrl,
  //     {},
  //     { headers: this.getAuthHeaders() }
  //   );
  // }


  private recentlyViewedUrl = Const.constUrl + 'product/product/recently-viewed/';

  getRecentlyViewedProducts(): Observable<any> {
    return this.http.post(
      this.recentlyViewedUrl,
      {},
      { headers: this.getAuthHeaders() }   // 🔥 auth added
    );
  }


  // track products recently viewed 
  trackProductView(productId: number) {
    return this.http.post(
      Const.constUrl + 'product/product/track-view/',
      { product_id: productId },
      { headers: this.getAuthHeaders() }
    );
  }



  // releted products 
  baseUrl = Const.constUrl

  // ✅ Related Products API (POST)
  getRelatedProducts(productId: number) {
    const body = {
      product_id: productId
    };

    return this.http.post(`${this.baseUrl}product/related_products/`, body);
  }




  // ===================== PRODUCTS BY ID  =============================

  productlistuser = Const.constUrl + "product/company/products-list/";

  // ✅ FIXED METHOD (Authorization add)
  getProductsbyuser(data: any) {

    const token = sessionStorage.getItem('access_token');

    const headers = {
      Authorization: `Bearer ${token}`
    };

    return this.http.post(
      this.productlistuser,   // 🔥 correct URL
      data,
      { headers }
    );
  }

  getProductsByCompany(payload: any): Observable<any> {
    return this.http.post(
      Const.constUrl + 'product/company/products-list/',
      payload,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }

  updateProduct(data: FormData): Observable<any> {
    return this.http.post(
      Const.constUrl + 'product/company/product/update-request/',
      data,
      {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
      }
    );
  }




private franchisePlanApi = Const.constUrl + 'franchicies/product-franchise-plans/';

// getCompanyFranchisePlans(companyId: number) {
//   return this.http.post(
//     this.franchisePlanApi,
//     { company_id: companyId },
//   );
// }

getProductFranchisePlans(productSlug: string) {
  return this.http.post(
    this.franchisePlanApi, 
    { slug: productSlug }
  );
}


private createFranchiseApi = Const.constUrl + 'franchicies/franchise/create/';

createFranchise(data: any) {
  return this.http.post(
    this.createFranchiseApi,
    data,
    {
        headers: {
          // Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        }
    }
  );
}


}

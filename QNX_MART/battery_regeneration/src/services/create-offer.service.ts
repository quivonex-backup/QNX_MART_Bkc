import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Const } from '../app/const';

@Injectable({
  providedIn: 'root'
})
export class CreateOfferService {

  constructor(private http: HttpClient) {}



  createOffer(data: any) {
  return this.http.post('API_URL/offer/apply', data);
}


// =================== create offer name =================

  private baseUrl = Const.constUrl;

  // ✅ COMMON HEADER FUNCTION
  private getHeaders() {
    const token = sessionStorage.getItem('access_token');

    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  // ✅ 1. CREATE OFFER NAME (NEW PAGE)
  createNewOffer(data: any) {
    return this.http.post(
      this.baseUrl + 'offer/company/offers/create/',
      data,
      { headers: this.getHeaders() }
    );
  }

// =================== offer name list =============================


getOffersList() {
  const token = sessionStorage.getItem('access_token');

  const headers = {
    Authorization: `Bearer ${token}`
  };

  return this.http.post(
    Const.constUrl+'offer/company/offers/list/',
    {},
    { headers }
  );
}

// ==================== Apply offer =======================

applyOfferToProducts(data: any) {
  const token = sessionStorage.getItem('access_token');

  const headers = {
    Authorization: `Bearer ${token}`
  };

  return this.http.post(
    Const.constUrl+'offer/offers/apply-to-product/',
    data,
    { headers }
  );
}
// ====================== offer update ===================================

updateOffer(data: any) {
  const token = sessionStorage.getItem('access_token');

  const headers = {
    Authorization: `Bearer ${token}`
  };

  return this.http.post(
    Const.constUrl + 'offer/company/offers/update/',
    data,
    { headers }
  );
}

// ====================== offer delete  =====================================
// ✅ SOFT DELETE
softDeleteOffer(id: number) {
  const token = sessionStorage.getItem('access_token');

  return this.http.post(
    Const.constUrl + 'offer/company/offers/soft-delete/',
    { id },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}

// ✅ RESTORE
restoreOffer(id: number) {
  const token = sessionStorage.getItem('access_token');

  return this.http.post(
    Const.constUrl + 'offer/company/offers/restore/',
    { id },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );
}
}

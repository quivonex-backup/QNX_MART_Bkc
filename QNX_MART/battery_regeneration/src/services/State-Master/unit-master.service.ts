import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../../app/const';

@Injectable({
  providedIn: 'root'
})
// export class UnitMasterService {

//   private apiUrl =Const.constUrl+ 'product/unit/create/';

//   constructor(private http: HttpClient) {}

//   createUnit(data: any): Observable<any> {
//     return this.http.post(this.apiUrl, data);
//   }


//   // =============================== Unit List ============================================
   
//   private listApi = Const.constUrl+  "product/unit/list/";

//   getUnitList(): Observable<any> {
//     return this.http.post(this.listApi, {});
//   }

// }

export class UnitMasterService {

  private apiUrl = Const.constUrl + 'product/unit/create/';

  constructor(private http: HttpClient) {}

  private getAuthHeaders() {
    const token = sessionStorage.getItem('access_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  createUnit(data: any): Observable<any> {
    return this.http.post(this.apiUrl, data, { headers: this.getAuthHeaders() });
  }


// ================================ Unit List =======================================================
  
  private listApi = Const.constUrl + "product/unit/list/";

  getUnitList(): Observable<any> {
    return this.http.post(this.listApi, {}, { headers: this.getAuthHeaders() });
  }

  // ============================ Unit Update ==========================================================
  private updateApi = Const.constUrl + 'product/unit/update/';

updateUnit(data: any): Observable<any> {
  return this.http.post(
    this.updateApi,
    data,
    { headers: this.getAuthHeaders() }
  );
}

// ================= SOFT DELETE =================
softDeleteUnit(id: number) {
  return this.http.post(
    Const.constUrl + 'product/unit/soft-delete/',
    { id: id }, // 🔥 IMPORTANT (object madhe pathav)
    { headers: this.getAuthHeaders() }
  );
}

// ================= RESTORE =================
restoreUnit(id: number) {
  return this.http.post(
    Const.constUrl + 'product/unit/restore/',
    { id: id },
    { headers: this.getAuthHeaders() }
  );
}
}

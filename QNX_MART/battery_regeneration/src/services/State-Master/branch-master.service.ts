import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { Const } from '../../app/const';

@Injectable({
    providedIn: 'root'
})
export class BranchMasterService {

    constructor(private http: HttpClient) { }

    createBranch(data: any): Observable<any> {
        const token = sessionStorage.getItem('access_token');
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        return this.http.post(Const.constUrl + 'branch/branch/create/', data, { headers });
    }

    getBranchList(): Observable<any> {
        const token = sessionStorage.getItem('access_token');
        const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });
        return this.http.post(Const.constUrl + 'company/branch/list/', {}, { headers });
    }

    // ======================== get branch list ===================================
    getCompanyBranches(): Observable<any> {
  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl + 'branch/company/branches-list/',
    {},
    { headers }
  );
}

// UPDATE
updateBranch(data: any): Observable<any> {
  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl + 'branch/branch/update/',
    data,
    { headers }
  );
}

// SOFT DELETE
softDeleteBranch(id: number): Observable<any> {
  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl + 'branch/branch/soft-delete/',
    { id },
    { headers }
  );
}

// RESTORE
restoreBranch(id: number): Observable<any> {
  const token = sessionStorage.getItem('access_token');

  const headers = new HttpHeaders({
    Authorization: `Bearer ${token}`
  });

  return this.http.post(
    Const.constUrl + 'branch/branch/restore/',
    { id },
    { headers }
  );
}
}

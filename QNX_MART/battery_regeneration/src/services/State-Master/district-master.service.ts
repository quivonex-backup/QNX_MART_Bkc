import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Const } from '../../app/const';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DistrictMasterService {


  constructor(private http: HttpClient) {}

  // Create District
  createDistrict(data: any): Observable<any> {
    return this.http.post(Const.constUrl + 'state/distict_create/', data);
  }

  // Get districts by state id
  // getDistrictsByState(stateId: number): Observable<any> {
  //   const body = { state_id: stateId };
  //   return this.http.post(Const.constUrl + 'state/get_districts/', body);
  // }

  // Optional: All districts
  getAllDistricts(): Observable<any> {
    return this.http.post(Const.constUrl + 'state/distict_retrieveAll/', {});
  }


    getDistrictsByState(stateId: number): Observable<any> {
    return this.http.post(Const.constUrl + 'state/get_districts/', { state_id: stateId });
  }

  // 🔥 New: Get Talukas by state & district
  getTalukas(stateId: number, districtId: number): Observable<any> {
    return this.http.post(Const.constUrl + 'state/get_talukas/', {
      state_id: stateId,
      district_id: districtId
    });
  }

    getVillages(stateId: number, districtId: number, talukaId: number): Observable<any> {
    return this.http.post(Const.constUrl + 'state/get_villages/', {
      state_id: stateId,
      district_id: districtId,
      taluka_id: talukaId
    });
  }
}

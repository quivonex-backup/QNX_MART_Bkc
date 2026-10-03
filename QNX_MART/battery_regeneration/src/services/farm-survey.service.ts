import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

export interface Farmer {
  farmerName: string;
  mobileNo: string;
  address: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  totalArea: number;
  waterResources: string;
  declaration: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FarmSurveyService {

  private apiUrl = Const.constUrl+'farm_survey/farmer/create/';

  constructor(private http: HttpClient) {}

  createFarmer(farmer: Farmer): Observable<any> {
    return this.http.post(this.apiUrl, farmer);
  }


   private apiURL = Const.constUrl+'state/state_retrieveAll/';



  getAllStates(): Observable<any> {
    // POST request (API sample madhe POST aahe)
    return this.http.post<any>(this.apiURL, {});
  }

  getDistricts(stateId: number) {
  return this.http.post<any>(Const.constUrl+'state/get_districts/', { state_id: stateId });
}


getTalukas(stateId: number, districtId: number) {
  const body = { state_id: stateId, district_id: districtId };
  return this.http.post<any>(Const.constUrl+'state/get_talukas/', body);
}

getVillages(stateId: number, districtId: number, talukaId: number) {
  const body = {
    state_id: Number(stateId),
    district_id: Number(districtId),
     taluka_id: Number(talukaId)
  };
  return this.http.post<any>(Const.constUrl + 'state/get_villages/', body);
}
}
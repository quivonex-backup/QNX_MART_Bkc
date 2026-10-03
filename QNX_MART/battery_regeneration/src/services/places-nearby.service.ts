import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Const } from '../app/const';

export interface PlacesNearbyRequest {
  lat: number;
  lng: number;
  radius?: number;
  keyword?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PlacesNearbyService {

  constructor(private http: HttpClient) { }

  private getAuthHeaders(): HttpHeaders {
    const token = sessionStorage.getItem('access_token');
    return new HttpHeaders({
      Authorization: `Bearer ${token || ''}`,
      'Content-Type': 'application/json'
    });
  }

  // POST /admin_profile/places/nearby/
  getNearbyPlaces(payload: PlacesNearbyRequest): Observable<any> {
    return this.http.post(
      Const.constUrl + 'admin_profile/places/nearby/',
      payload,
      { headers: this.getAuthHeaders() }
    );
  }
}
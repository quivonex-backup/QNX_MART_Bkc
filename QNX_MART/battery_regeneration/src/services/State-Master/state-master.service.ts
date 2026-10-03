import { Injectable } from '@angular/core';
import { Const } from '../../app/const';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StateResponse } from '../../Models/models/state_master.model';

@Injectable({
  providedIn: 'root'
})
export class StateMasterService {

  private apiUrl = Const.constUrl+'state/state_create/';

  constructor(private http: HttpClient) {}

  createState(data: any): Observable<StateResponse> {
    return this.http.post<StateResponse>(this.apiUrl, data);
  }


getAllStates(): Observable<any> {
  return this.http.post(Const.constUrl+'state/state_retrieveAll/', {});
}

updateState(id: number, data: any): Observable<any> {

  const body = {
    id: id,
    state_code: data.state_code,
    state_name: data.state_name
  };

  return this.http.post(
    Const.constUrl + 'state/state_update/',
    body
  );
}

deleteState(id: number): Observable<any> {

  return this.http.post(
    Const.constUrl + 'state/state_delete/',
    {
      id: id.toString()   // backend string accept karto mhanun
    }
  );
}

}

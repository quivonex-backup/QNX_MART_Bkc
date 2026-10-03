import { Injectable } from '@angular/core';
import { Const } from '../app/const';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CarouselService {

  constructor(private http: HttpClient) {}

  getCarouselImages() {
    return this.http.post(
      Const.constUrl + 'admin_profile/upload_image_list/',
      {}
    );
  }
}

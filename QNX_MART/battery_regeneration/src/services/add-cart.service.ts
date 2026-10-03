import { Injectable } from '@angular/core';
import { Const } from '../app/const';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AddCartService {
  private addCartApi = Const.constUrl + "cart/cart/add/";
  private cartListApi = Const.constUrl + "cart/cart/list/";
  private updateQtyApi = Const.constUrl + "cart/cart/update/";
  // private removeApi = Const.constUrl + "cart/cart/delete/";

  constructor(private http: HttpClient) {}





getHeaders(){
    const token = sessionStorage.getItem('access_token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  addToCart(data:any):Observable<any>{
    return this.http.post(this.addCartApi,data,{
      headers:this.getHeaders()
    });
  }


  // 🔹 GET CART LIST
  getCart(userId: number): Observable<any> {

    const body = {
      user_id: userId
    };

    return this.http.post(this.cartListApi, body, {
      headers: this.getHeaders()
    });
  }
  

  // 🔹 UPDATE QUANTITY
  updateQuantity(cartId: number, quantity: number): Observable<any> {

    const body = {
      cart_id: cartId,
      quantity: quantity
    };

    return this.http.post(this.updateQtyApi, body, {
      headers: this.getHeaders()
    });
  }

  // 🔹 REMOVE FROM CART
removeFromCart(cartItemId: number) {

  const token = sessionStorage.getItem('access_token');

  const headers = {
    Authorization: `Bearer ${token}`
  };

  const payload = {
    cart_item_id: cartItemId
  };

  return this.http.post(
    Const.constUrl+'cart/cart/delete/',
    payload,
    { headers }
  );

}

}

 
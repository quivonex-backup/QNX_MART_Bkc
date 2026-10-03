// import { Injectable } from '@angular/core';
// import { BehaviorSubject } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class CartStateService {

//   private cartCountSource = new BehaviorSubject<number>(0);
//   cartCount$ = this.cartCountSource.asObservable();

//   setCartCount(count: number) {
//     this.cartCountSource.next(count);
//   }
// }
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CartStateService {

  private cartCount = new BehaviorSubject<number>(0);
  cartCount$ = this.cartCount.asObservable();

  setCartCount(count:number){
    this.cartCount.next(count);
  }

  // 🔥 NEW: increment only for NEW product
  // incrementCartCount() {
  //   const current = this.cartCountSource.value;
  //   this.cartCountSource.next(current + 1);
  // }

  // decrementCartCount() {
  //   const current = this.cartCountSource.value;
  //   this.cartCountSource.next(Math.max(current - 1, 0));
  // }
}

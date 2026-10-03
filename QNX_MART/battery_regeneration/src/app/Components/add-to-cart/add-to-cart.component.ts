import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AddCartService } from '../../../services/add-cart.service';
import { CartStateService } from '../../../services/cart-state.service';
import { Router } from '@angular/router';
import { AlertService } from '../../../services/alert.service';
import { Location } from '@angular/common'; 

@Component({
  selector: 'app-add-to-cart',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './add-to-cart.component.html',
  styleUrl: './add-to-cart.component.css'
})
export class AddToCartComponent implements OnInit {

  cartList: any[] = [];
  cartCount: number = 0;
  loading = false;

  subtotal = 0;
  totalItems = 0;
  selectedCount = 0;
  allSelected = false;
  isLoggedIn = false;

  constructor(
    private cartService: AddCartService,
    private cartState: CartStateService,
    private router: Router,
    private alertService: AlertService,
    private location: Location
  ) { }

  ngOnInit(): void {
    const userId = sessionStorage.getItem('user_id');
    const username = sessionStorage.getItem('username');

    this.isLoggedIn = !!(userId && username);

    if (this.isLoggedIn) {
      this.fetchCart();
    }
  }

  redirectLogin() {
    this.router.navigate(['/login']);
  }

  // 🔹 FETCH CART
  fetchCart() {
    const userId = Number(sessionStorage.getItem('user_id'));
    this.loading = true;

    this.cartService.getCart(userId).subscribe({
      next: (res: any) => {
        // mark all selected by default, then auto-select the first item
        this.cartList = (res.cart_items || []).map((item: any) => ({ ...item, selected: true }));
        // Ensure only the first item is selected if multiple exist
        if (this.cartList.length > 0) {
          this.selectOnlyThis(this.cartList[0]);
        }
        this.calculateSummary();
        this.loading = false;
      },
      error: (err) => {
        console.error('Cart fetch error', err);
        this.loading = false;
      }
    });
  }

  // 🔹 INCREASE
  increaseQty(item: any) {
    this.updateQuantityDebounced(item, item.quantity + 1);
  }

  // 🔹 DECREASE
  decreaseQty(item: any) {
    if (item.quantity <= 1) return;
    this.updateQuantityDebounced(item, item.quantity - 1);
  }

  // 🔹 UPDATE QUANTITY WITH DEBOUNCE
  updateQuantityDebounced(item: any, newQty: number) {
    // UI update
    item.quantity = newQty;

    // 🔥 Summary instant update
    this.calculateSummary();

    // 🔥 Per-item debounce timer
    if (item.timer) {
      clearTimeout(item.timer);
    }

    item.timer = setTimeout(() => {
      this.cartService.updateQuantity(item.id, item.quantity).subscribe({
        next: () => console.log('Quantity synced'),
        error: err => console.error(err)
      });
    }, 500);
  }

  // 🔹 REMOVE ITEM
  async removeItem(item: any) {
    // if (!confirm('Remove this item from cart?')) return;
    const confirm = await this.alertService.uniConfirm(
        `Remove this item from cart?`
    );
    if (!confirm) return;

    this.cartService.removeFromCart(item.id).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.alertService.unialert(res.message);
          // Remove item from list
          this.cartList = this.cartList.filter(i => i.id !== item.id);
          // If no items left, summary updates automatically
          this.calculateSummary();
        } else {
          this.alertService.unialert(res.message);
        }
      },
      error: (err) => {
        console.error(err);
        this.alertService.unialert("Failed to remove item");
      }
    });
  }

  // 🔹 SUMMARY CALCULATION – only selected items
  calculateSummary() {
    this.subtotal = 0;
    this.totalItems = 0;
    this.selectedCount = 0;

    this.cartList.forEach(item => {
      this.totalItems += Number(item.quantity);
      if (item.selected) {
        const price = Number(item.unit_price);
        const qty = Number(item.quantity);
        this.subtotal += price * qty;
        this.selectedCount += qty;
      }
    });

    this.subtotal = Math.round(this.subtotal * 100) / 100;
    this.allSelected = this.cartList.length > 0 && this.cartList.every(i => i.selected);

    // Update navbar cart badge
    this.cartState.setCartCount(this.cartList.length);
  }

  // 🔹 SELECT ALL toggle (kept but hidden in UI)
  toggleSelectAll(event: any) {
    const checked = event.target.checked;
    this.cartList.forEach(item => item.selected = checked);
    this.calculateSummary();
  }

  // 🔹 Individual item select (not used directly with radio, but kept)
  onItemSelect() {
    this.calculateSummary();
  }

  // 🔹 PROCEED TO CHECKOUT – sends only selected item(s)
  proceedToCheckout() {
    if (this.selectedCount === 0) return;

    const selectedItems = this.cartList
      .filter(i => i.selected)
      .map(i => ({
        product_id: i.product_id || i.product, // fallback to i.product if needed
        product_name: i.product_name,
        thumbnail: i.thumbnail,
        unit_price: i.unit_price,
        quantity: i.quantity,
        cart_item_id: i.id,
        COD_available: i.COD_available
      }));

    sessionStorage.setItem('checkoutCartItems', JSON.stringify(selectedItems));
    this.router.navigate(['/checkout']);
  }

  // 🔹 SELECT ONLY THIS ITEM (radio click handler)
  selectOnlyThis(item: any) {
    this.cartList.forEach(i => i.selected = (i === item));
    this.calculateSummary();
  }

  // 🔹 GO BACK
  goBack() {
    this.location.back();
  }
}
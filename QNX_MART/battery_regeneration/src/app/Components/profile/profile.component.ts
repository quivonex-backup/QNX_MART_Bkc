import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartStateService } from '../../../services/cart-state.service';
import { EnquiryService } from '../../../services/enquiry.service';
import { ProductService } from '../../../services/product.service';
import { OrderService } from '../../../services/order.service'; 

@Component({
  selector: 'app-profile',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.css'
})
export class ProfileComponent implements OnInit {

  username = '';
  email = '';
  userId = '';
  cartCount = 0;
  enquiryCount = 0;
  orderCount = 0;
  recentProducts: any[] = [];

  constructor(
    private router: Router,
    private cartState: CartStateService,
    private enquiryService: EnquiryService,
    private orderService: OrderService,
    private productService: ProductService
  ) { }

  ngOnInit() {
    this.username = sessionStorage.getItem('username') || '';
    this.email = sessionStorage.getItem('email') || '';
    this.userId = sessionStorage.getItem('user_id') || '';

    if (!this.userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.cartState.cartCount$.subscribe(count => {
      this.cartCount = count;
    });

    this.loadEnquiryCount();
    this.loadOrderCount();
    this.loadRecentlyViewed();
  }

  loadEnquiryCount() {
    this.enquiryService.getMyProductEnquiries({}).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.enquiryCount = res.data?.length || 0;
        }
      },
      error: (err) => {
        console.error('Failed to load enquiries', err);
        this.enquiryCount = 0;
      }
    });
  }

  loadOrderCount() {
    this.orderService.getMyOrders({}).subscribe({
      next: (res: any) => {
        if (res.success) {
          this.orderCount = res.count || res.data?.length || 0;
        }
      },
      error: (err) => {
        console.error('Failed to load orders', err);
        this.orderCount = 0;
      }
    });
  }

  loadRecentlyViewed() {
    this.productService.getRecentlyViewedProducts().subscribe({
      next: (res: any) => {
        if (res.status) {
          // Take top 3 and format thumbnails
          this.recentProducts = res.data.slice(0, 3).map((item: any) => ({
            ...item,
            thumbnail: item.thumbnail_s3_key?.replace(/\"/g, '') || 'assets/placeholder.png',
            display_price: item.variants?.length ? item.variants[0].price : item.final_price
          }));
        }
      },
      error: (err) => {
        console.error('Failed to load recently viewed', err);
        this.recentProducts = [];
      }
    });
  }

  logout() {
    sessionStorage.clear();
    this.router.navigate(['/login']);
  }
}
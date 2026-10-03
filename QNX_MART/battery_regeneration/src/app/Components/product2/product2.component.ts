import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product2Service } from '../../../services/product2.service';
import { Const } from '../../const';
import { Material } from '../../../Models/models/material.model';
import { Router } from '@angular/router';
import { AddCartService } from '../../../services/add-cart.service';
import { CartStateService } from '../../../services/cart-state.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-product2',
  imports: [FormsModule,CommonModule],
  templateUrl: './product2.component.html',
  styleUrl: './product2.component.css'
})
export class Product2Component implements OnInit {
    materials: Material[] = [];
    filteredList: Material[] = [];
    categories: string[] = [];
    searchText: string = '';
    sortOrder: string = 'default';
    selectedCategory: string = 'All';
    loading = false;
    baseUrl = Const.constUrl;

  constructor(private productService: Product2Service,private router:Router,
  private cartService: AddCartService,private cartState: CartStateService,
  private alertService: AlertService ) { }

    ngOnInit() {
        this.loading = true;
        this.productService.getMaterialList().subscribe({
            next: (res) => {
                this.materials = res.data;
                this.filteredList = res.data;
                this.categories = [
                    ...new Set(res.data.map(item => item.category_name))
                ].sort();
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading products:', err);
                this.loading = false;
            }
        });

        
    }

viewDetails(item: Material) {
  this.router.navigate(['/material-details', item.id]);
}
handleAddToCartClick(item: Material) {
  const userId = sessionStorage.getItem('userId');
  const username = sessionStorage.getItem('username');

  if (!userId || !username) {
    // 🔹 Show popup alert
    if (confirm('⚠️ Please login first to add products to cart. Do you want to login now?')) {
      this.router.navigate(['/login']);
    }
    return; // stop further add to cart
  }

  // 🔹 User logged in → normal add to cart
  const payload = {
    user_id: Number(userId),
    material_id: item.id,
    quantity: 1,
    size: item.size?.[0] || '16mm'
  };

  this.cartService.addToCart(payload).subscribe({
    next: (res) => {
      this.alertService.unialert('✅ Product added to cart');

      // 🔹 Update navbar badge
      this.cartService.getCart(Number(userId)).subscribe((res: any) => {
        const uniqueProducts = res.data.length;
        this.cartState.setCartCount(uniqueProducts);
      });
    },
    error: (err) => console.error(err)
  });
}


    // Get category count
    getCategoryCount(category: string): number {
        return this.materials.filter(item => item.category_name === category).length;
    }
    hideImage(event: any) {
  event.target.style.display = 'none';
}

    // Apply all filters
    applyFilters() {
        let list = [...this.materials];

        // Search filter
        if (this.searchText.trim()) {
            const search = this.searchText.toLowerCase();
            list = list.filter(item =>
                item.name.toLowerCase().includes(search) ||
                item.brand.toLowerCase().includes(search) ||
                (item.material_description && item.material_description.toLowerCase().includes(search))
            );
        }

        // Category filter
        if (this.selectedCategory !== 'All') {
            list = list.filter(item => item.category_name === this.selectedCategory);
        }

        // Sort filter
        if (this.sortOrder === 'low-high') {
            list.sort((a, b) => Number(a.rate) - Number(b.rate));
        } else if (this.sortOrder === 'high-low') {
            list.sort((a, b) => Number(b.rate) - Number(a.rate));
        }

        this.filteredList = list;
    }
    refreshProducts() {
  this.loading = true;

  // 🔥 Clear cache first
  this.productService.clearCache();

  // 🔥 Call API again
  this.productService.getMaterialList().subscribe({
    next: (res) => {
      this.materials = res.data;
      this.filteredList = res.data;
      this.categories = [
        ...new Set(res.data.map(item => item.category_name))
      ].sort();
      this.loading = false;
    },
    error: (err) => {
      console.error('Error refreshing products:', err);
      this.loading = false;
    }
  });
}


    // Filter by category
    filterByCategory(category: string) {
        this.selectedCategory = category;
        this.applyFilters();
    }

    // Search change
    onSearchChange() {
        this.applyFilters();
    }

    // Sort change
    onSortChange(value: string) {
        this.sortOrder = value;
        this.applyFilters();
    }

    // Clear all filters
    clearFilters() {
        this.searchText = '';
        this.sortOrder = 'default';
        this.selectedCategory = 'All';
        this.applyFilters();
    }

    // Add to cart/enquiry
addToCart(item: Material) {

  const payload = {
    user_id: Number(sessionStorage.getItem('userId')),
    material_id: item.id,
    quantity: 1,
    size: item.size?.[0] || '16mm'
  };

  console.log('📦 Payload:', payload);

  this.cartService.addToCart(payload).subscribe({
    next: (res) => {
      console.log('✅ Success:', res);
      this.alertService.unialert('Product added to cart');
        this.cartState.incrementCartCount();
    },
    error: (err) => {
      console.error('❌ Error:', err);
    }
  });
}
}
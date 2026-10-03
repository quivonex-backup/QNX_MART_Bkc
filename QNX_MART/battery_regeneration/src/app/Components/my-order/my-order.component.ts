// my-order.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { OrderService } from '../../../services/order.service';
import { AlertService } from '../../../services/alert.service';

@Component({
    selector: 'app-my-order',
    imports: [CommonModule, FormsModule],
    templateUrl: './my-order.component.html',
    styleUrls: ['./my-order.component.css']
})
export class MyOrderComponent implements OnInit {

    orders: any[] = [];
    filteredOrders: any[] = [];
    loading = true;
    selectedFilter: string = 'all';
    searchQuery: string = '';

    constructor(
        private orderService: OrderService,
        private alertService: AlertService,
        private router: Router,
        private location: Location
    ) { }

    ngOnInit(): void {
        this.loadOrders();
    }

    loadOrders() {
        this.loading = true;
        this.orderService.getMyOrders({}).subscribe({
            next: (res: any) => {
                this.loading = false;
                if (res.success) {
                    this.orders = res.data;
                    this.applyFilters();
                } else {
                    this.alertService.unialert(res.message || 'Failed to load orders.');
                }
            },
            error: (err) => {
                this.loading = false;
                const msg = err.error?.message || err.message || 'Something went wrong.';
                this.alertService.unialert(msg);
            }
        });
    }

    // ---- Filtering ----
    filterOrders(status: string) {
        this.selectedFilter = status;
        this.applyFilters();
    }

    onSearch() {
        this.applyFilters();
    }

    clearSearch() {
        this.searchQuery = '';
        this.applyFilters();
    }

    applyFilters() {
        let result = this.orders;

        if (this.selectedFilter !== 'all') {
            result = result.filter(
                (item: any) => item.status?.toLowerCase() === this.selectedFilter.toLowerCase()
            );
        }

        if (this.searchQuery.trim()) {
            const q = this.searchQuery.trim().toLowerCase();
            result = result.filter((item: any) =>
                item.order_number?.toLowerCase().includes(q) ||
                item.product?.name?.toLowerCase().includes(q) ||
                item.company?.name?.toLowerCase().includes(q)
            );
        }

        this.filteredOrders = result;
    }

    getCount(status: string): number {
        if (status === 'all') return this.orders.length;
        return this.orders.filter(
            (item: any) => item.status?.toLowerCase() === status.toLowerCase()
        ).length;
    }

    // ---- Navigate to detail (store order in service) ----
    viewOrder(order: any) {
        this.orderService.setSelectedOrder(order);
        this.router.navigate(['/my-orders/detail']);
    }

    goBack() {
        this.location.back();
    }

    getStatusBadgeClass(status: string): string {
        const map: Record<string, string> = {
            'PENDING': 'pending',
            'CONFIRMED': 'confirmed',
            'SHIPPED': 'shipped',
            'DELIVERED': 'delivered',
            'CANCELLED': 'cancelled'
        };
        return map[status] || '';
    }
}
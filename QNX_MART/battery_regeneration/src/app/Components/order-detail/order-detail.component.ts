// order-detail.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';   // needed for ngModel
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { Subscription } from 'rxjs';
import { OrderService } from '../../../services/order.service';
import { AlertService } from '../../../services/alert.service';

@Component({
    selector: 'app-order-detail',
    imports: [CommonModule, FormsModule],   // added FormsModule
    templateUrl: './order-detail.component.html',
    styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit, OnDestroy {

    order: any = null;
    loading = true;
    orderId: number = 0;

    // Tracking
    trackingData: any = null;
    showTracking: boolean = false;

    // Return
    showReturnModal: boolean = false;
    returnReason: string = 'DAMAGED';
    returnNote: string = '';
    returnQuantity: number = 1;
    isSubmittingReturn: boolean = false;
    showReturnPolicies = false;

    private subscription: Subscription = new Subscription();

    // Mapping for display labels and order
    private readonly statusOrder = ['PENDING', 'CONFIRMED', 'PACKED', 'SHIPPED', 'OUT FOR DELIVERY', 'DELIVERED'];
    private readonly statusLabels: Record<string, string> = {
        'PENDING': 'Order Placed',
        'CONFIRMED': 'Confirmed',
        'PACKED': 'Packed',
        'SHIPPED': 'Shipped',
        'OUT FOR DELIVERY': 'Out for Delivery',
        'DELIVERED': 'Delivered',
        'CANCELLED': 'Cancelled'
    };

    constructor(
        private orderService: OrderService,
        private alertService: AlertService,
        private location: Location,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.subscription.add(
            this.orderService.selectedOrder$.subscribe(order => {
                if (order) {
                    this.orderId = order.order_id;
                    this.loadOrderDetail();
                } else {
                    this.alertService.unialert('No order selected.');
                    this.router.navigate(['/my-orders']);
                }
            })
        );
    }

    ngOnDestroy(): void {
        this.subscription.unsubscribe();
        this.orderService.clearSelectedOrder();
    }

    closeReturnPolicies() {
        this.showReturnPolicies = false;
    }

    loadOrderDetail() {
        this.loading = true;
        this.orderService.getOrderDetail(this.orderId).subscribe({
            next: (res: any) => {
                this.loading = false;
                if (res.success) {
                    this.order = res.data;
                    // Build timeline from status_history if present
                    this.order.timeline = this.buildTimeline(this.order);
                } else {
                    this.alertService.unialert(res.message || 'Failed to load order details.');
                    this.router.navigate(['/my-orders']);
                }
            },
            error: (err) => {
                this.loading = false;
                const msg = err.error?.message || err.message || 'Something went wrong.';
                this.alertService.unialert(msg);
                this.router.navigate(['/my-orders']);
            }
        });
    }

    buildTimeline(order: any) {
        // If cancelled, return a single step
        if (order.status === 'CANCELLED') {
            return [{
                label: 'Cancelled',
                completed: true,
                current: true,
                date: new Date(order.updated_at || order.created_at),
                time: this.formatTime(order.updated_at || order.created_at)
            }];
        }

        // If we have status_history from API
        if (order.status_history && Array.isArray(order.status_history) && order.status_history.length) {
            // Sort by timestamp (ascending)
            const history = [...order.status_history].sort((a, b) =>
                new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
            );
            // Map to timeline steps
            return history.map((item, index) => {
                const date = new Date(item.timestamp);
                return {
                    label: this.statusLabels[item.status] || item.status,
                    completed: true,  // all past steps are completed
                    current: index === history.length - 1,
                    date: date,
                    time: this.formatTime(item.timestamp)
                };
            });
        }

        // Fallback: use only current status and created_at/updated_at
        const steps = [];
        const currentStatus = order.status;
        const currentIndex = this.statusOrder.indexOf(currentStatus);
        if (currentIndex === -1) {
            // Unknown status – show just one step
            steps.push({
                label: currentStatus,
                completed: true,
                current: true,
                date: new Date(order.created_at),
                time: this.formatTime(order.created_at)
            });
            return steps;
        }

        // Build steps up to current status
        for (let i = 0; i <= currentIndex; i++) {
            const status = this.statusOrder[i];
            let date: Date | null = null;
            if (i === 0) {
                date = new Date(order.created_at);
            } else if (i === currentIndex && order.updated_at) {
                date = new Date(order.updated_at);
            } else {
                // For intermediate steps we don't have dates – set to null
                date = null;
            }
            steps.push({
                label: this.statusLabels[status] || status,
                completed: true,
                current: i === currentIndex,
                date: date,
                time: date ? this.formatTime(date.toISOString()) : null
            });
        }
        return steps;
    }

    // Helper to format time from ISO string
    formatTime(isoString: string): string {
        if (!isoString) return '';
        const d = new Date(isoString);
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }

    // ---- Actions ----
    async cancelOrder() {
        if (!this.order) return;
        const confirmed = await this.alertService.uniConfirm(
            `Are you sure you want to cancel order ${this.order.order_number}?`
        );
        if (!confirmed) return;

        this.orderService.cancelOrder(this.order.order_id).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.alertService.unialert(res.message || 'Order cancelled successfully.');
                    this.loadOrderDetail(); // refresh
                } else {
                    this.alertService.unialert(res.message || 'Failed to cancel order.');
                }
            },
            error: (err) => {
                const errorMsg = err.error?.message || err.message || 'Error cancelling order.';
                this.alertService.unialert(errorMsg);
            }
        });
    }

    trackOrder() {
        if (!this.order) return;

        const shipmentId = this.order.shipment_id || this.order.shipment?.shipment_id;
        if (!shipmentId) {
            this.alertService.unialert('No tracking information available for this order.');
            return;
        }

        if (this.showTracking) {
            this.closeTracking();
            return;
        }

        this.orderService.trackShipment(shipmentId).subscribe({
            next: (res: any) => {
                if (res.success) {
                    this.trackingData = res.data.tracking_data;
                    this.showTracking = true;
                } else {
                    this.alertService.unialert(res.message || 'Failed to fetch tracking details.');
                }
            },
            error: (err) => {
                const msg = err.error?.message || err.message || 'Error fetching tracking details.';
                this.alertService.unialert(msg);
            }
        });
    }

    closeTracking() {
        this.showTracking = false;
        this.trackingData = null;
    }

    reorder() {
        if (!this.order) return;
        this.alertService.unialert(`Reorder initiated for ${this.order.order_number}. Items added to cart.`);
    }

    downloadInvoice() {
        if (!this.order) return;
        this.alertService.unialert(`Invoice for ${this.order.order_number} is being downloaded.`);
    }

    rateProduct() {
        if (!this.order) return;
        this.alertService.unialert(`Rating feature for order ${this.order.order_number} will open a review modal.`);
    }

    goBack() {
        this.location.back();
    }

    // ---- Return Methods ----
    openReturnModal() {
        if (!this.order) return;
        // Set max quantity from product
        this.returnQuantity = this.order.product?.quantity || 1;
        this.returnReason = 'DAMAGED';
        this.returnNote = '';
        this.showReturnModal = true;
    }

    closeReturnModal() {
        this.showReturnModal = false;
        this.isSubmittingReturn = false;
    }

    submitReturn() {
        if (!this.order) return;

        const availableQuantity = Number(this.order?.product?.quantity || 0);
        const quantity = Number(this.returnQuantity || 0);

        // if (this.returnQuantity < 1) {
        //     this.alertService.unialert('Quantity must be at least 1.');
        //     return;
        // }

        // Quantity validation
        if (quantity < 1) {
            this.alertService.unialert('Quantity must be at least 1.');
            return;
        }

        if (quantity > availableQuantity) {
            this.alertService.unialert(
                `Return quantity cannot be greater than available quantity (${availableQuantity}).`
            );
            return;
        }

        if (!this.returnReason) {
            this.alertService.unialert('Please select a reason.');
            return;
        }
        this.isSubmittingReturn = true;

        const payload = {
            order_id: this.order.order_id,
            quantity: this.returnQuantity,
            reason: this.returnReason,
            reason_note: this.returnNote || undefined
        };

        this.orderService.returnOrder(payload).subscribe({
            next: (res: any) => {
                this.isSubmittingReturn = false;
                if (res.success) {
                    this.alertService.unialert(res.message || 'Return request submitted successfully.');
                    this.closeReturnModal();
                    this.loadOrderDetail(); // refresh order details
                } else {
                    this.alertService.unialert(res.message || 'Failed to submit return request.');
                }
            },
            error: (err) => {
                this.isSubmittingReturn = false;
                const msg = err.error?.message || err.message || 'Error submitting return request.';
                this.alertService.unialert(msg);
            }
        });
    }

    // ---- Helpers ----
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

    getPaymentStatusClass(paymentStatus: boolean): string {
        return paymentStatus ? 'Paid' : 'Pending';
    }

    isReturnQuantityInvalid(): boolean {
        const availableQuantity = Number(this.order?.product?.quantity || 0);
        const quantity = Number(this.returnQuantity || 0);

        return quantity < 1 || quantity > availableQuantity;
    }
}
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Const } from '../app/const';

@Injectable({
    providedIn: 'root'
})
export class OrderService {

    constructor(private http: HttpClient) { }

    private getHeaders(): HttpHeaders {
        return new HttpHeaders({
            Authorization: `Bearer ${sessionStorage.getItem('access_token')}`
        });
    }

    // ===== ADDRESS APIS =====
    addAddress(payload: any) {
        return this.http.post(Const.constUrl + 'order/address/create/', payload, { headers: this.getHeaders() });
    }

    getAddresses(): Observable<any> {
        return this.http.post(Const.constUrl + 'order/address/list/', {}, { headers: this.getHeaders() });
    }

    updateAddress(payload: any) {
        return this.http.post(Const.constUrl + 'order/address/update/', payload, { headers: this.getHeaders() });
    }

    // ===== SHIPPING RATES =====
    getShippingRates(payload: {
        product_ids: number[];
        address_id: number;
        payment_method: 'COD' | 'Online';
    }): Observable<any> {
        return this.http.post(
            Const.constUrl + 'shiprocket/shipping-rates/',
            payload,
            { headers: this.getHeaders() }
        );
    }

    // ===== CREATE ORDER =====
    createOrder(payload: {
        product_id: number;
        address_id: number;
        quantity: number;
        payment_method: 'COD' | 'PREPAID';
    }): Observable<any> {
        return this.http.post(
            Const.constUrl + 'shiprocket/create-order/',
            payload,
            { headers: this.getHeaders() }
        );
    }

    // ===== RAZORPAY – CREATE ORDER =====
    createRazorpayOrder(shipOrderId: number): Observable<any> {
        return this.http.post(
            Const.constUrl + 'payment/razorpay/create-order/',
            { ship_order_id: shipOrderId },
            { headers: this.getHeaders() }
        );
    }

    // ===== RAZORPAY – VERIFY PAYMENT =====
    verifyRazorpayPayment(payload: {
        ship_order_id: number;
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
    }): Observable<any> {
        return this.http.post(
            Const.constUrl + 'payment/razorpay/verify-payment/',
            payload,
            { headers: this.getHeaders() }
        );
    }

    // ===== MY ORDERS LIST =====
    getMyOrders(payload: any = {}): Observable<any> {
        return this.http.post(
            Const.constUrl + 'shiprocket/my-orders/',
            payload,
            { headers: this.getHeaders() }
        );
    }

    private selectedOrderSubject = new BehaviorSubject<any>(null);
    selectedOrder$ = this.selectedOrderSubject.asObservable();

    setSelectedOrder(order: any) {
        this.selectedOrderSubject.next(order);
    }

    clearSelectedOrder() {
        this.selectedOrderSubject.next(null);
    }

    // ===== ORDER DETAIL =====
    getOrderDetail(orderId: number): Observable<any> {
        return this.http.post(
            Const.constUrl + 'shiprocket/my-order-detail/',
            { order_id: orderId },
            { headers: this.getHeaders() }
        );
    }

    // ===== CANCEL ORDER =====
    cancelOrder(orderId: number): Observable<any> {
        return this.http.post(
            Const.constUrl + 'shiprocket/cancel-order/',
            { order_id: orderId },
            { headers: this.getHeaders() }
        );
    }

    // ===== TRACK SHIPMENT =====
    trackShipment(shipmentId: number): Observable<any> {
        return this.http.post(
            Const.constUrl + 'shiprocket/track-shipment/',
            { shipment_id: shipmentId },
            { headers: this.getHeaders() }
        );
    }

    // ===== RETURN ORDER =====
    returnOrder(payload: { order_id: number; quantity: number; reason: string; reason_note?: string }): Observable<any> {
        return this.http.post(
            Const.constUrl + 'shiprocket/return-order/',
            payload,
            { headers: this.getHeaders() }
        );
    }
}
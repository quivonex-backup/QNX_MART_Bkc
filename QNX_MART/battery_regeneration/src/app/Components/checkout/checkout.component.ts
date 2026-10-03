import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { OrderService } from '../../../services/order.service';
import { StateMasterService } from '../../../services/State-Master/state-master.service';
import { DistrictMasterService } from '../../../services/State-Master/district-master.service';
import { AlertService } from '../../../services/alert.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, CommonModule],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit {

  source: 'buynow' | 'cart' = 'buynow';

  // Location dropdowns
  states: any[] = [];
  districts: any[] = [];
  talukas: any[] = [];
  villages: any[] = [];
  selectedStateId!: number;
  selectedDistrictId!: number;
  selectedTalukaId!: number;

  // Buy Now
  product_id!: number;
  price!: number;
  quantity = 1;
  variant: any = null;
  product: any = null;

  // Cart
  cartItems: any[] = [];

  loading = true;
  currentStep = 1;

  // Address state
  selectedAddressId: number | null = null;
  savedAddresses: any[] = [];
  selectedAddressIndex = -1;
  addressesLoading = false;
  showAddressForm = false;
  isEditMode = false;

  address = {
    full_name: '', phone: '', pincode: '',
    addressLine1: '', addressLine2: '',
    city: '', state: '', district: '', taluka: '', village: '', landmark: ''
  };

  confirmedAddress: any = null;

  paymentMethod: 'COD' | 'Online' = 'Online';
  orderPlaced = false;
  orderId = '';
  isPlacingOrder = false;

  // Shipping
  shippingCompanies: any[] = [];
  grandTotalShippingCharge = 0;
  shippingLoading = false;
  shippingError = '';

  // COD availability
  codAvailable = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private orderService: OrderService,
    private stateService: StateMasterService,
    private districtService: DistrictMasterService,
    private alertService: AlertService,
    private location: Location
  ) { }

  ngOnInit() {
    const userId = sessionStorage.getItem('user_id');
    if (!userId) {
      this.router.navigate(['/login']);
      return;
    }

    this.loadStates();
    this.loadAddresses();

    const storedCart = sessionStorage.getItem('checkoutCartItems');
    if (storedCart) {
      this.source = 'cart';
      this.cartItems = JSON.parse(storedCart);
      this.checkCodAvailability();
      this.loading = false;
      return;
    }

    // Buy now
    this.source = 'buynow';
    this.route.queryParams.subscribe(params => {
      this.product_id = Number(params['product_id']);
      this.price = Number(params['price']);
      this.quantity = Number(params['quantity']) || 1;
      if (this.product_id) {
        this.productService.getProductDetails({ id: this.product_id }).subscribe({
          next: (res: any) => {
            this.product = res.product;
            this.checkCodAvailability();
            this.loading = false;
          },
          error: () => {
            this.loading = false;
          }
        });
      } else {
        this.loading = false;
      }
    });
  }

  // ---- Location dropdowns ----
  loadStates() {
    this.stateService.getAllStates().subscribe({
      next: (res: any) => { this.states = res.data || []; }
    });
  }

  onStateChange(event: any) {
    const stateId = Number(event.target.value);
    const s = this.states.find(x => x.id === stateId);
    this.address.state = s?.state_name || '';
    this.selectedStateId = stateId;
    this.districts = []; this.talukas = []; this.villages = [];
    this.address.district = ''; this.address.taluka = ''; this.address.village = '';
    if (stateId) {
      this.districtService.getDistrictsByState(stateId).subscribe({
        next: (res: any) => { this.districts = res.data || []; }
      });
    }
  }

  onDistrictChange(event: any) {
    const districtId = Number(event.target.value);
    const d = this.districts.find(x => x.id === districtId);
    this.address.district = d?.district_name || '';
    this.selectedDistrictId = districtId;
    this.talukas = []; this.villages = [];
    this.address.taluka = ''; this.address.village = '';
    if (districtId) {
      this.districtService.getTalukas(this.selectedStateId, districtId).subscribe({
        next: (res: any) => { this.talukas = res.data || []; }
      });
    }
  }

  onTalukaChange(event: any) {
    const talukaId = Number(event.target.value);
    const t = this.talukas.find(x => x.id === talukaId);
    this.address.taluka = t?.taluka_name || '';
    this.selectedTalukaId = talukaId;
    this.villages = [];
    this.address.village = '';
    if (talukaId) {
      this.districtService.getVillages(this.selectedStateId, this.selectedDistrictId, talukaId).subscribe({
        next: (res: any) => { this.villages = res.data || []; }
      });
    }
  }

  onVillageChange(event: any) {
    const villageId = Number(event.target.value);
    const v = this.villages.find(x => x.id === villageId);
    this.address.village = v?.village_name || '';
    this.address.pincode = v?.pincode || '';
  }

  // ---- Address methods ----
  loadAddresses(selectLastAfterLoad = false) {
    this.addressesLoading = true;
    this.orderService.getAddresses().subscribe({
      next: (res: any) => {
        this.addressesLoading = false;
        if (res?.status === 'success' && res.data?.length) {
          this.savedAddresses = res.data;
          if (selectLastAfterLoad) {
            this.confirmAddress(this.savedAddresses.length - 1);
          } else {
            this.selectedAddressIndex = this.savedAddresses.length - 1;
            this.showAddressForm = false;
          }
        } else {
          this.savedAddresses = [];
          this.selectedAddressIndex = -1;
          this.showAddressForm = true;
          this.prefillFromSession();
        }
      },
      error: () => {
        this.addressesLoading = false;
        this.showAddressForm = true;
        this.prefillFromSession();
      }
    });
  }

  prefillFromSession() {
    this.address.full_name = sessionStorage.getItem('username') || '';
    this.address.phone = sessionStorage.getItem('phone_number') || '';
    this.address.addressLine1 = sessionStorage.getItem('address') || '';
  }

  selectAddress(index: number) {
    this.selectedAddressIndex = index;
    this.showAddressForm = false;
    this.isEditMode = false;
  }

  confirmAddress(index: number) {
    this.selectedAddressIndex = index;
    const a = this.savedAddresses[index];
    this.confirmedAddress = a;
    this.selectedAddressId = a.id;
    this.showAddressForm = false;
    this.isEditMode = false;
    this.currentStep = 2;
    this.fetchShippingRates();
  }

  addNewAddress() {
    this.selectedAddressIndex = -1;
    this.isEditMode = false;
    this.address = {
      full_name: '', phone: '', pincode: '',
      addressLine1: '', addressLine2: '',
      city: '', state: '', district: '', taluka: '', village: '', landmark: ''
    };
    this.districts = []; this.talukas = []; this.villages = [];
    this.showAddressForm = true;
  }

  editExistingAddress(index: number) {
    this.selectedAddressIndex = index;
    this.isEditMode = true;
    const a = this.savedAddresses[index];
    this.address = {
      full_name: a.full_name || '',
      phone: a.mobile_no || '',
      pincode: a.pincode || '',
      addressLine1: a.address_line1 || '',
      addressLine2: a.address_line2 || '',
      city: a.city || '',
      state: a.state || '',
      district: '',
      taluka: '',
      village: '',
      landmark: a.landmark || ''
    };
    this.districts = [];
    this.talukas = [];
    this.villages = [];
    this.showAddressForm = true;

    const matchedState = this.states.find(
      s => s.state_name?.toLowerCase() === a.state?.toLowerCase()
    );
    if (!matchedState) return;

    this.selectedStateId = matchedState.id;

    this.districtService.getDistrictsByState(matchedState.id).subscribe({
      next: (res: any) => {
        this.districts = res.data || [];
        const matchedDistrict = this.districts.find(
          d => d.district_name?.toLowerCase() === a.district?.toLowerCase()
        );
        if (!matchedDistrict) return;
        this.address.district = matchedDistrict.district_name;
        this.selectedDistrictId = matchedDistrict.id;
        this.districtService.getTalukas(matchedState.id, matchedDistrict.id).subscribe({
          next: (res2: any) => {
            this.talukas = res2.data || [];
            const matchedTaluka = this.talukas.find(
              t => t.taluka_name?.toLowerCase() === a.taluka?.toLowerCase()
            );
            if (!matchedTaluka) return;
            this.address.taluka = matchedTaluka.taluka_name;
            this.selectedTalukaId = matchedTaluka.id;
            this.districtService.getVillages(matchedState.id, matchedDistrict.id, matchedTaluka.id).subscribe({
              next: (res3: any) => {
                this.villages = res3.data || [];
                const matchedVillage = this.villages.find(
                  v => v.village_name?.toLowerCase() === a.village?.toLowerCase()
                );
                if (matchedVillage) {
                  this.address.village = matchedVillage.village_name;
                }
              },
              error: () => { this.villages = []; }
            });
          },
          error: () => { this.talukas = []; }
        });
      },
      error: () => { this.districts = []; }
    });
  }

  changeAddress() {
    this.currentStep = 1;
    this.showAddressForm = false;
    this.isEditMode = false;
  }

  saveAddress() {

    const a = this.address;

    // Validate all required fields
    if (!a.full_name?.trim()) {
      this.alertService.unialert('Full name is required');
      return;
    }
    if (!a.phone?.trim() || !/^\d{10}$/.test(a.phone.trim())) {
      this.alertService.unialert('Enter a valid 10-digit mobile number');
      return;
    }
    if (!a.addressLine1?.trim()) {
      this.alertService.unialert('Address Line 1 is required');
      return;
    }
    if (!a.city?.trim()) {
      this.alertService.unialert('City is required');
      return;
    }
    if (!a.state?.trim()) {
      this.alertService.unialert('State is required');
      return;
    }
    if (!a.district?.trim()) {
      this.alertService.unialert('District is required');
      return;
    }
    if (!a.taluka?.trim()) {
      this.alertService.unialert('Taluka is required');
      return;
    }
    if (!a.village?.trim()) {
      this.alertService.unialert('Village is required');
      return;
    }
    if (!a.pincode?.trim() || !/^\d{6}$/.test(a.pincode.trim())) {
      this.alertService.unialert('Enter a valid 6-digit pincode');
      return;
    }

    const userId = sessionStorage.getItem('user_id');

    if (this.isEditMode && this.selectedAddressIndex >= 0) {
      const addr = this.savedAddresses[this.selectedAddressIndex];
      const payload = {
        id: addr.id,
        full_name: this.address.full_name,
        mobile_no: this.address.phone,
        address_line1: this.address.addressLine1,
        address_line2: this.address.addressLine2 || '',
        city: this.address.city || '',
        state: this.address.state,
        district: this.address.district,
        taluka: this.address.taluka,
        village: this.address.village,
        pincode: this.address.pincode || '',
        country: 'India'
      };

      this.addressesLoading = true;
      this.orderService.updateAddress(payload).subscribe({
        next: (res: any) => {
          this.addressesLoading = false;
          if (res.status === 'success') {
            this.showAddressForm = false;
            this.isEditMode = false;
            const idx = this.selectedAddressIndex;
            this.orderService.getAddresses().subscribe({
              next: (r: any) => {
                if (r?.status === 'success' && r.data?.length) {
                  this.savedAddresses = r.data;
                  this.confirmAddress(Math.min(idx, this.savedAddresses.length - 1));
                }
              }
            });
          } else {
            this.alertService.unialert('Failed to update address');
          }
        },
        error: () => { this.addressesLoading = false; this.alertService.unialert('Error updating address'); }
      });

    } else {
      const payload = {
        user: userId,
        full_name: this.address.full_name,
        mobile_no: this.address.phone,
        address_line1: this.address.addressLine1,
        address_line2: this.address.addressLine2 || '',
        city: this.address.city || '',
        state: this.address.state,
        district: this.address.district,
        taluka: this.address.taluka,
        village: this.address.village,
        pincode: this.address.pincode || '',
        country: 'India'
      };

      this.addressesLoading = true;
      this.orderService.addAddress(payload).subscribe({
        next: (res: any) => {
          this.addressesLoading = false;
          if (res.status === 'success') {
            this.showAddressForm = false;
            this.loadAddresses(true);
          } else {
            this.alertService.unialert('Failed to save address');
          }
        },
        error: () => { this.addressesLoading = false; this.alertService.unialert('Error saving address'); }
      });
    }
  }

  // ===== FETCH SHIPPING RATES =====
  fetchShippingRates() {
    if (!this.selectedAddressId) {
      console.warn('No address selected');
      return;
    }

    let productIds: number[] = [];
    if (this.source === 'buynow') {
      if (!this.product_id) return;
      productIds = [this.product_id];
    } else {
      const first = this.cartItems[0];
      if (first) {
        productIds = [first.product_id || first.product || first.cart_item_id];
      }
      if (!productIds.length) {
        console.warn('No product IDs found in cart items');
        return;
      }
    }

    const payload = {
      product_ids: productIds,
      address_id: this.selectedAddressId,
      payment_method: this.paymentMethod
    };

    this.shippingLoading = true;
    this.shippingError = '';
    this.shippingCompanies = [];
    this.grandTotalShippingCharge = 0;

    this.orderService.getShippingRates(payload).subscribe({
      next: (res: any) => {
        this.shippingLoading = false;
        if (res.status === true) {
          this.shippingCompanies = res.companies || [];
          this.grandTotalShippingCharge = res.total_shipping_charge || 0;
        } else {
          this.shippingError = res.message || 'Failed to fetch shipping rates.';
        }
      },
      error: (err) => {
        this.shippingLoading = false;
        const msg = err.error?.message || err.message || 'Unable to fetch shipping rates.';
        this.shippingError = msg;
        console.error('Shipping rates error:', err);
      }
    });
  }

  onPaymentMethodChange() {
    this.fetchShippingRates();
  }

  // ===== PRICING GETTERS =====
  get subtotal(): number {
    if (this.source === 'cart') {
      const first = this.cartItems[0];
      if (first) {
        return Math.round(Number(first.unit_price) * Number(first.quantity) * 100) / 100;
      }
      return 0;
    }
    return Math.round(this.price * this.quantity * 100) / 100;
  }

  get itemCount(): number {
    if (this.source === 'cart') {
      const first = this.cartItems[0];
      return first ? Number(first.quantity) : 0;
    }
    return this.quantity;
  }

  get deliveryCharge(): number {
    return this.grandTotalShippingCharge;
  }

  get total(): number {
    return this.subtotal + this.deliveryCharge;
  }

  get variantKeys(): string[] {
    return this.variant ? Object.keys(this.variant) : [];
  }

  get addressComplete(): boolean {
    return this.confirmedAddress != null;
  }

  get hasShippingData(): boolean {
    return this.shippingCompanies.length > 0 && !this.shippingLoading && !this.shippingError;
  }

  // ===== COD AVAILABILITY =====
  private checkCodAvailability() {
    if (this.source === 'buynow') {
      this.codAvailable = this.product?.COD_available === true;
    } else {
      this.codAvailable = this.cartItems.every(item => item.COD_available === true);
    }
    // Auto‑switch to Online if COD not allowed
    if (!this.codAvailable && this.paymentMethod === 'COD') {
      this.paymentMethod = 'Online';
      if (this.confirmedAddress) {
        this.fetchShippingRates();
      }
    }
  }

  // ============================================================
  // PLACE ORDER – Creates backend order → then Razorpay (if Online)
  // ============================================================
  placeOrder() {
    if (this.isPlacingOrder) return;

    const userId = sessionStorage.getItem('user_id');
    if (!userId) { this.router.navigate(['/login']); return; }

    if (!this.addressComplete) {
      this.alertService.unialert('Please select a delivery address');
      this.currentStep = 1;
      return;
    }
    if (!this.hasShippingData) {
      this.alertService.unialert('Shipping charges are not available. Please try again later.');
      return;
    }
    if (this.paymentMethod === 'COD' && !this.codAvailable) {
      this.alertService.unialert('COD is not available for this order. Please choose Online payment.');
      return;
    }

    this.isPlacingOrder = true;

    // Resolve product id + qty
    let productId: number;
    let qty: number;

    if (this.source === 'cart') {
      const first = this.cartItems[0];
      if (!first) {
        this.alertService.unialert('No product in cart.');
        this.isPlacingOrder = false;
        return;
      }
      productId = first.product_id || first.product || first.cart_item_id;
      qty = first.quantity;
    } else {
      productId = this.product_id;
      qty = this.quantity;
    }

    const backendPaymentMethod: 'COD' | 'PREPAID' =
      this.paymentMethod === 'Online' ? 'PREPAID' : 'COD';

    const payload = {
      product_id: productId,
      address_id: this.selectedAddressId as number,
      quantity: qty,
      payment_method: backendPaymentMethod
    };

    // Step 1: Create order in backend (ship_order)
    this.orderService.createOrder(payload).subscribe({
      next: (res: any) => {
        if (res.success === true) {
          const shipOrderId =
            res.data?.order_id ??
            res.data?.ship_order_id ??
            res.data?.id;

          const orderNumber =
            res.data?.order_number ??
            res.data?.order_id ??
            'Order placed';

          if (!shipOrderId) {
            this.isPlacingOrder = false;
            this.alertService.unialert('Order created but missing ship_order_id.');
            return;
          }

          if (this.paymentMethod === 'COD') {
            // COD → done
            this.finalizeSuccess(orderNumber);
          } else {
            // Online → start Razorpay flow
            this.initiateRazorpayPayment(shipOrderId, orderNumber);
          }
        } else {
          this.isPlacingOrder = false;
          this.alertService.unialert(res.message || 'Order could not be placed.');
        }
      },
      error: (err) => {
        this.isPlacingOrder = false;
        const msg = err.error?.message || err.message || 'Failed to place order.';
        this.alertService.unialert(msg);
        console.error('Order creation error:', err);
      }
    });
  }

  // ============================================================
  // STEP 2 – Create Razorpay order via backend & open checkout
  // ============================================================
  private initiateRazorpayPayment(shipOrderId: number, orderNumber: string) {
    this.orderService.createRazorpayOrder(shipOrderId).subscribe({
      next: (res: any) => {
        if (res.success === true && res.data) {
          const rzpData = res.data;

          const options: any = {
            key: rzpData.key_id,
            amount: rzpData.amount,                 // paise
            currency: rzpData.currency || 'INR',
            name: 'QNX Mart',
            description: this.source === 'cart'
              ? `${this.itemCount} item(s)`
              : (this.product?.name || 'Order'),
            image: this.product?.thumbnail_s3_key || '',
            order_id: rzpData.razorpay_order_id,
            handler: (response: any) => {
              // Step 3 – Verify payment on backend
              this.verifyPayment(shipOrderId, orderNumber, response);
            },
            modal: {
              ondismiss: () => {
                this.isPlacingOrder = false;
              }
            },
            prefill: {
              name: this.confirmedAddress?.full_name,
              contact: this.confirmedAddress?.mobile_no
            },
            theme: { color: '#c7511f' }
          };

          try {
            const rzp = new (window as any).Razorpay(options);

            rzp.on('payment.failed', (resp: any) => {
              this.isPlacingOrder = false;
              const msg = resp?.error?.description || 'Payment failed. Please try again.';
              this.alertService.unialert(msg);
            });

            rzp.open();
          } catch {
            this.isPlacingOrder = false;
            this.alertService.unialert('Payment gateway not available. Please try again.');
          }
        } else {
          this.isPlacingOrder = false;
          this.alertService.unialert(res.message || 'Failed to initiate payment.');
        }
      },
      error: (err) => {
        this.isPlacingOrder = false;
        const msg = err.error?.message || err.message || 'Failed to initiate payment.';
        this.alertService.unialert(msg);
        console.error('Razorpay create-order error:', err);
      }
    });
  }

  // ============================================================
  // STEP 3 – Verify payment on backend
  // ============================================================
  private verifyPayment(shipOrderId: number, orderNumber: string, razorpayResponse: any) {
    const payload = {
      ship_order_id: shipOrderId,
      razorpay_order_id: razorpayResponse.razorpay_order_id,
      razorpay_payment_id: razorpayResponse.razorpay_payment_id,
      razorpay_signature: razorpayResponse.razorpay_signature
    };

    this.orderService.verifyRazorpayPayment(payload).subscribe({
      next: (res: any) => {
        if (res.success === true) {
          this.finalizeSuccess(orderNumber);
        } else {
          this.isPlacingOrder = false;
          this.alertService.unialert(res.message || 'Payment verification failed.');
        }
      },
      error: (err) => {
        this.isPlacingOrder = false;
        const msg = err.error?.message || err.message || 'Payment verification failed.';
        this.alertService.unialert(msg);
        console.error('Razorpay verify error:', err);
      }
    });
  }

  // ============================================================
  // FINALIZE – Show success screen
  // ============================================================
  private finalizeSuccess(orderNumber: string) {
    this.isPlacingOrder = false;
    this.orderId = orderNumber;
    this.orderPlaced = true;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    sessionStorage.removeItem('checkoutCartItems');
  }

  goHome() { this.router.navigate(['/home']); }
  goToOrders() { this.router.navigate(['/my-orders']); }

  // Back button
  goBack() {
    this.location.back();
  }
}
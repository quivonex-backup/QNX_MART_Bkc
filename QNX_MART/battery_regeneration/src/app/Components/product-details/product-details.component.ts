import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../services/product.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AddCartService } from '../../../services/add-cart.service';
import { CartStateService } from '../../../services/cart-state.service';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-product-details',
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css'
})
export class ProductDetailsComponent implements OnInit {

  product: any = null;
  selectedImage: string = '';
  selectedVideo: string = '';
  isVideo = false;
  quantity = 1;
  addedToCart = false;
  productId!: number;
  relatedProducts: any[] = [];

  // Variant selection
  selectedAttributes: { [key: string]: string } = {};
  activeVariant: any = null;
  variantAttributeKeys: string[] = [];

  // Zoom
  isZoomed = false;
  zoomStyle: any = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private productService: ProductService,
    private cartService: AddCartService,
    private cartState: CartStateService,
    private alertService: AlertService
  ) { }

  ngOnInit() {

    this.route.params.subscribe(params => {
      // const id = Number(params['id']);
      // if (!id) return;

      // console.log("New Product ID:", id);

      // this.productId = id;

      const slug = params['slug'];
      if (!slug) return;

      this.resetState();

      // ✅ Product Details API
      // this.productService.getProductDetails({ id }).subscribe((res: any) => {
      this.productService.getProductDetails({ slug }).subscribe((res: any) => {
        // this.product = res.product;
        // this.initGallery();
        // this.initVariants();
        this.product = res.data;
        this.productId = this.product.id;
        this.initGallery();
        this.initVariants();
        this.getRelatedProducts();
      });

      // ✅ Related Products API (IMPORTANT)
      // this.getRelatedProducts();
    });
  }

  private resetState() {
    this.product = null;
    this.selectedImage = '';
    this.selectedVideo = '';
    this.isVideo = false;
    this.quantity = 1;
    this.addedToCart = false;
    this.selectedAttributes = {};
    this.activeVariant = null;
    this.variantAttributeKeys = [];
  }

  private initGallery() {
    if (this.product.thumbnail_s3_key) {
      this.selectedImage = this.product.thumbnail_s3_key;
    } else if (this.product.images?.length) {
      this.selectedImage = this.product.images[0].image_s3_key;
    }
  }

  private initVariants() {
    if (!this.product.variants?.length) return;
    // Collect all unique attribute keys
    const keys = new Set<string>();
    this.product.variants.forEach((v: any) => {
      Object.keys(v.attributes).forEach(k => keys.add(k));
    });
    this.variantAttributeKeys = Array.from(keys);

  }
  getRelatedProducts() {
    this.productService.getRelatedProducts(this.productId)
      .subscribe({
        next: (res: any) => {
          console.log("Related Products:", res);
          this.relatedProducts = res.products || [];
        },
        error: (err) => {
          console.error("Error:", err);
        }
      });
  }
  // goToProduct(id: number) {
  //   this.router.navigate(['/product-details', id]);
  goToProduct(product: any) {
    this.router.navigate(['/product-details', product.slug]);

    // Optional smooth scroll
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  getOptionsForAttribute(key: string): string[] {
    if (!this.product?.variants) return [];
    const vals = new Set<string>();
    this.product.variants.forEach((v: any) => {
      if (v.attributes[key]) vals.add(v.attributes[key]);
    });
    return Array.from(vals);
  }

  isOptionAvailable(key: string, val: string): boolean {
    if (!this.product?.variants) return false;
    const testAttrs = { ...this.selectedAttributes, [key]: val };
    return this.product.variants.some((v: any) =>
      Object.keys(testAttrs).every(k => !testAttrs[k] || v.attributes[k] === testAttrs[k])
    );
  }

  selectVariantRow(v: any) {
    this.variantAttributeKeys.forEach(k => this.selectAttribute(k, v.attributes[k]));
  }

  selectAttribute(key: string, val: string) {
    this.selectedAttributes[key] = val;
    this.updateActiveVariant();
  }

  private updateActiveVariant() {
    if (!this.product?.variants?.length) return;

    // ✅ check all attributes selected
    const allSelected = this.variantAttributeKeys.every(
      key => this.selectedAttributes[key]
    );

    if (!allSelected) {
      this.activeVariant = null;
      return;
    }

    this.activeVariant = this.product.variants.find((v: any) =>
      this.variantAttributeKeys.every(k => v.attributes[k] === this.selectedAttributes[k])
    ) || null;

    if (this.activeVariant?.image) {
      this.selectedImage = this.activeVariant.image;
      this.isVideo = false;
    }
  }

  // get displayPrice(): string {
  //   if (this.activeVariant) {
  //     // variant final_price is already calculated by backend (offer or product discount applied)
  //     return this.activeVariant.final_price ?? this.activeVariant.price;
  //   }
  //   return this.product?.final_price ?? this.product?.price ?? '0';
  // }

  get displayPrice(): number {
    const item = this.activeVariant || this.product;

    return this.getCalculatedFinalPrice(item);
  }

  getCalculatedFinalPrice(item: any): number {
    if (!item) return 0;

    const price = Number(item.price) || 0;

    // Backend calculated offer price
    if (item.applied_offer && item.final_price != null) {
      return Math.round(
        Math.max(0, Number(item.final_price) || 0)
      );
    }

    const discount = Number(item.discount_value) || 0;

    if (item.discount_type === 'percent') {
      return Math.round(
        Math.max(0, price - (price * discount / 100))
      );
    }

    if (item.discount_type === 'flat') {
      return Math.round(
        Math.max(0, price - discount)
      );
    }

    return Math.round(price);
  }

  // true when there's an actual saving to show strikethrough
  get hasDiscount(): boolean {
    if (this.activeVariant) {
      return Number(this.activeVariant.final_price) < Number(this.activeVariant.price);
    }
    return Number(this.product?.final_price) < Number(this.product?.price);
  }

  // original price (MRP) to show as strikethrough
  get originalPrice(): string {
    if (this.activeVariant) return this.activeVariant.price;
    return this.product?.price ?? '0';
  }

  get displayStock(): number {
    if (this.activeVariant) return this.activeVariant.stock_quantity;
    return this.product?.stock_quantity || 0;
  }

  get inStock(): boolean {
    return this.displayStock > 0;
  }

  get discountPercent(): number {
    if (!this.product) return 0;
    if (this.product.discount_type === 'percent') return Number(this.product.discount_value);
    if (this.product.discount_type === 'flat') {
      const orig = Number(this.product.price);
      const disc = Number(this.product.discount_value);
      return orig > 0 ? Math.round((disc / orig) * 100) : 0;
    }
    return 0;
  }

  // Returns a display string for the discount badge on the image
  get discountBadgeText(): string {
    if (!this.product) return '';

    // offer applied by admin
    if (this.product.applied_offer) {
      const o = this.product.applied_offer;
      const type = o.type || o.offer_type || '';
      return type === 'flat' ? `₹${o.value} off` : `${o.value}% off`;
    }

    // product-level discount (no offer)
    const val = Number(this.product.discount_value);
    if (!val) return '';
    return this.product.discount_type === 'flat' ? `₹${val} off` : `${this.discountPercent}% off`;
  }

  // Returns the save badge label shown next to the price
  get saveBadgeText(): string {
    if (!this.product) return '';

    if (this.product.applied_offer) {
      const o = this.product.applied_offer;
      const type = o.type || o.offer_type || '';
      return type === 'flat'
        ? `${o.title} — ₹${o.value} flat off`
        : `${o.title} — ${o.value}% off`;
    }

    // use variant original price if variant selected, else product price
    const origPrice = this.activeVariant
      ? Number(this.activeVariant.price)
      : Number(this.product.price);
    const finalPriceNum = Number(this.displayPrice);
    if (origPrice <= finalPriceNum) return '';

    const saved = origPrice - finalPriceNum;
    const pct = Math.round((saved / origPrice) * 100);

    if (this.product.discount_type === 'flat') {
      return `Save ₹${Number(this.product.discount_value)}`;
    }
    return `Save ${pct}%`;
  }

  // Gallery
  changeImage(url: string) {
    this.selectedImage = url;
    this.isVideo = false;
  }

  playVideo(url: string) {
    this.selectedVideo = url;
    this.isVideo = true;
  }

  onMouseMove(event: MouseEvent) {
    const el = event.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    this.zoomStyle = { 'transform-origin': `${x}% ${y}%`, transform: 'scale(2.2)' };
  }

  onMouseLeave() {
    this.zoomStyle = {};
  }

  // Quantity
  increaseQty() { if (this.quantity < this.displayStock) this.quantity++; }
  decreaseQty() { if (this.quantity > 1) this.quantity--; }

  // Cart
  addToCart() {
    const userId = sessionStorage.getItem('user_id');
    if (!userId) { this.router.navigate(['/login']); return; }
    const payload = { user_id: userId, product_id: this.product.id, quantity: this.quantity };
    this.cartService.addToCart(payload).subscribe({
      next: (res: any) => {
        if (res.status) {
          this.addedToCart = true;
          setTimeout(() => this.addedToCart = false, 3000);
          this.cartService.getCart(Number(userId)).subscribe((cartRes: any) => {
            const items = cartRes.cart_items || [];
            let total = 0;
            items.forEach((i: any) => total += i.quantity);
            this.cartState.setCartCount(total);
          });
        }
      },
      error: () => this.alertService.unialert('Failed to add to cart')
    });
  }


  buyNow() {

    const priceToSend = this.activeVariant
      ? (this.activeVariant.final_price ?? this.activeVariant.price)
      : (this.product?.final_price ?? this.product?.price);

    const variantData = this.activeVariant
      ? this.activeVariant.attributes
      : null;

    this.router.navigate(['/checkout'], {
      queryParams: {
        product_id: this.product.id,
        // product: this.product.slug,
        quantity: this.quantity,
        price: priceToSend,
        variant: JSON.stringify(variantData)
      }
    });
  }

  getEnquiry() {
    const priceToSend = this.activeVariant
      ? (this.activeVariant.final_price ?? this.activeVariant.price)
      : (this.product?.final_price ?? this.product?.price);
    const variantData = this.activeVariant
      ? this.activeVariant.attributes   // ✅ { Size: 'S', Color: 'Black' }
      : null;

    this.router.navigate(['/product-enquiry'], {
      queryParams: {
        // product_id: this.product.id,
        product: this.product.slug,
        price: priceToSend,
        variant: JSON.stringify(variantData)
      }
    });
  }

  // All gallery images including thumbnail
  get allImages(): string[] {
    const imgs: string[] = [];
    if (this.product?.thumbnail_s3_key) imgs.push(this.product.thumbnail_s3_key);
    (this.product?.images || []).forEach((i: any) => {
      if (i.image_s3_key && !imgs.includes(i.image_s3_key)) imgs.push(i.image_s3_key);
    });
    return imgs;
  }


  async shareProduct(): Promise<void> {
    const shareUrl = window.location.href;

    const shareData = {
      title: this.product?.name || 'Product',
      text: `Check out this product: ${this.product?.name || ''}`,
      url: shareUrl
    };

    // Mobile / supported browsers
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (error) {
        // User closed share popup
        console.log('Share cancelled');
      }
      return;
    }

    // Desktop / unsupported browsers
    try {
      await navigator.clipboard.writeText(shareUrl);

      alert('Product link copied successfully!');
    } catch (error) {
      console.error('Failed to copy link:', error);
      alert('Unable to copy product link.');
    }
  }

}

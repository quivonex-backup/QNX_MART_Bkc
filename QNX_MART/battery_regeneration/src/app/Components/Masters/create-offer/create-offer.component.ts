import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../../../services/product.service';
import { CreateOfferService } from '../../../../services/create-offer.service';
import { Router } from '@angular/router';
import { CompanyCreateService } from '../../../../services/company-create.service';
import { AlertService } from '../../../../services/alert.service';


@Component({
  selector: 'app-create-offer',
  imports: [FormsModule,CommonModule],
  templateUrl: './create-offer.component.html',
  styleUrl: './create-offer.component.css'
})
export class CreateOfferComponent implements OnInit {

  products: any[] = [];
  loading = false;
  offers: any[] = [];
  selectedOfferId: number | null = null;
  branches: any[] = [];
  selectedBranchId: number | null = null;
  

  offer = {
    name: '',
    // type: 'percentage',
    // value: 0,
    // startDate: '',
    // endDate: '',
    productIds: [] as number[],
    applyToAll: false
  };

  constructor(
    private productService: ProductService,
    private offerService: CreateOfferService,
    private companyService: CompanyCreateService,
    private router: Router,
    private alertService: AlertService
  ) {}

  ngOnInit() {
    this.loadProducts();
    this.loadOffers();
     this.loadBranches();
  }

  // ✅ LOAD PRODUCTS
loadProducts() {
  this.loading = true;

  let payload: any = {};

  // ✅ branch selected
  if (this.selectedBranchId) {
    payload.branch_id = this.selectedBranchId;
  }

  this.productService.getProductsbyuser(payload).subscribe({
    next: (res: any) => {
      console.log('Products API:', res);

      this.products = res.data || res.products || [];
      this.loading = false;
    },
    error: (err) => {
      console.error('Product API Error', err);
      this.loading = false;
    }
  });
}

  // ✅ LOAD OFFERS NAME 
//   loadOffers() {
//   this.offerService.getOffersList().subscribe({
//     next: (res: any) => {
//       console.log('Offers API:', res);

//       // 🔥 adjust based on response
//       this.offers = res.data || res.offers || [];
      
//     },
//     error: (err) => {
//       console.error('Offer API Error', err);
//     }
//   });
// }
loadOffers() {
  this.offerService.getOffersList().subscribe({
    next: (res: any) => {
      console.log('Offers API:', res);

      const allOffers = res.data || res.offers || [];

      // ✅ FILTER ONLY ACTIVE OFFERS
      this.offers = allOffers.filter((o: any) => o.is_active === true);
    },
    error: (err) => {
      console.error('Offer API Error', err);
    }
  });
}

loadBranches() {
  this.companyService.getBranchesList().subscribe({
    next: (res: any) => {
      console.log('Branches API:', res);
      this.branches = res.data || [];
    },
    error: (err) => {
      console.error('Branch API Error', err);
    }
  });
}


onBranchChange() {
  console.log('Selected Branch:', this.selectedBranchId);

  // 🔁 reload products based on branch
  this.loadProducts();

  // 🔄 reset selected products
  this.offer.productIds = [];
}
  // ✅ SELECT PRODUCT
  toggleProduct(id: number) {
    if (this.offer.applyToAll) return;

    const index = this.offer.productIds.indexOf(id);

    if (index > -1) {
      this.offer.productIds.splice(index, 1);
    } else {
      this.offer.productIds.push(id);
    }
  }

  // ✅ CHECK SELECTED
  isSelected(id: number): boolean {
    return this.offer.productIds.includes(id);
  }

  // ✅ SELECT ALL
  toggleAllProducts() {
    if (this.offer.applyToAll) {
      this.offer.productIds = this.products.map(p => p.id);
    } else {
      this.offer.productIds = [];
    }
  }

  goToCreateOfferPage() {
  this.router.navigate(['/create-offer-name']);
}

  // ✅ SAVE OFFER
saveOffer() {

  // 🔥 VALIDATION
  if (!this.selectedOfferId) {
    this.alertService.unialert('Please select offer');
    return;
  }

  if (!this.offer.applyToAll && this.offer.productIds.length === 0) {
    this.alertService.unialert('Select at least one product');
    return;
  }

  const payload = {
    offer_id: this.selectedOfferId,
    product_ids: this.offer.applyToAll
      ? this.products.map(p => p.id)
      : this.offer.productIds
  };

  console.log('FINAL PAYLOAD:', payload);

  this.offerService.applyOfferToProducts(payload).subscribe({
    next: (res: any) => {
      console.log(res);
      this.alertService.unialert('Offer applied successfully 🔥');
      this.resetForm();
    },
    error: (err) => {
      console.error(err);
      this.alertService.unialert('Error while applying offer');
    }
  });
}

  // ✅ RESET FORM
resetForm() {
  this.offer = {
    name: '',
    productIds: [],
    applyToAll: false
  };

  this.selectedOfferId = null;
}
}
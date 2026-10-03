import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CreateOfferService } from '../../../../services/create-offer.service';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-create-offer-name',
  imports: [FormsModule,CommonModule],
  templateUrl: './create-offer-name.component.html',
  styleUrl: './create-offer-name.component.css'
})
export class CreateOfferNameComponent {

  offer = {
    title: '',
    description: '',
    offer_type: '',
    discount_value: 0,
    start_date: '',
    end_date: '',
    // productIds: [] as number[],
  };
  offersList: any[] = [];
  isEditMode = false;
  editOfferId: number | null = null;



  constructor(private offerService: CreateOfferService,private alertService: AlertService) {}


ngOnInit() {
  this.loadOffers();
}

  loadOffers() {
  this.offerService.getOffersList().subscribe({
    next: (res: any) => {
      console.log('Offer List API:', res);

      this.offersList = res.data || [];
    },
    error: (err) => {
      console.error('Offer List Error', err);
    }
  });
}

editOffer(offer: any) {
  console.log('Edit Offer:', offer);

  this.isEditMode = true;
  this.editOfferId = offer.id;

  this.offer = {
    title: offer.title,
    description: offer.description,
    offer_type: offer.offer_type,
    discount_value: Number(offer.discount_value),
    start_date: offer.start_date,
    end_date: offer.end_date
  };

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

createOffer() {

  if (!this.offer.title || !this.offer.description) {
    this.alertService.unialert('All fields required');
    return;
  }

  const payload: any = {
    title: this.offer.title,
    description: this.offer.description,
    offer_type: this.offer.offer_type,
    discount_value: this.offer.discount_value,
    start_date: this.offer.start_date,
    end_date: this.offer.end_date,
  };

  // 🔥 UPDATE MODE
  if (this.isEditMode && this.editOfferId) {

    payload.id = this.editOfferId;
    payload.is_active = true;

    this.offerService.updateOffer(payload).subscribe({
      next: (res) => {
        console.log(res);
        this.alertService.unialert('Offer Updated Successfully 🔥');

        this.resetForm();
        this.loadOffers();
      },
      error: (err) => {
        console.error(err);
        this.alertService.unialert('Error updating offer');
      }
    });

  } 
  // 🔥 CREATE MODE
  else {

    this.offerService.createNewOffer(payload).subscribe({
      next: (res) => {
        console.log(res);
        this.alertService.unialert('Offer Created Successfully ✅');

        this.resetForm();
        this.loadOffers();
      },
      error: (err) => {
        console.error(err);
        this.alertService.unialert('Error creating offer');
      }
    });

  }
}




toggleOfferStatus(offer: any) {

  const id = offer.id;

  // 🔴 IF ACTIVE → SOFT DELETE
  if (offer.is_active) {

    if (!confirm('Deactivate this offer?')) return;

    this.offerService.softDeleteOffer(id).subscribe({
      next: (res: any) => {
        console.log(res);
        this.alertService.unialert('Offer deactivated 🚫');

        this.loadOffers(); // refresh
      },
      error: (err) => {
        console.error(err);
        this.alertService.unialert('Error while deactivating');
      }
    });

  } 
  // 🟢 IF INACTIVE → RESTORE
  else {

    if (!confirm('Activate this offer?')) return;

    this.offerService.restoreOffer(id).subscribe({
      next: (res: any) => {
        console.log(res);
        this.alertService.unialert('Offer activated ✅');

        this.loadOffers(); // refresh
      },
      error: (err) => {
        console.error(err);
        this.alertService.unialert('Error while restoring');
      }
    });

  }
}
resetForm() {
  this.offer = {
    title: '',
    description: '',
    offer_type: '',
    discount_value: 0,
    start_date: '',
    end_date: ''
  };

  this.isEditMode = false;
  this.editOfferId = null;
}
}
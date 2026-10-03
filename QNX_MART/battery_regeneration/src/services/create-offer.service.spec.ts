import { TestBed } from '@angular/core/testing';

import { CreateOfferService } from './create-offer.service';

describe('CreateOfferService', () => {
  let service: CreateOfferService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CreateOfferService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

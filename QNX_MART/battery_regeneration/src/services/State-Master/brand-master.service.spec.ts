import { TestBed } from '@angular/core/testing';

import { BrandMasterService } from './brand-master.service';

describe('BrandMasterService', () => {
  let service: BrandMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BrandMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

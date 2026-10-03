import { TestBed } from '@angular/core/testing';

import { DistrictMasterService } from './district-master.service';

describe('DistrictMasterService', () => {
  let service: DistrictMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DistrictMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { UnitMasterService } from './unit-master.service';

describe('UnitMasterService', () => {
  let service: UnitMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UnitMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

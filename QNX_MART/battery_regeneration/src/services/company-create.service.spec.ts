import { TestBed } from '@angular/core/testing';

import { CompanyCreateService } from './company-create.service';

describe('CompanyCreateService', () => {
  let service: CompanyCreateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompanyCreateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

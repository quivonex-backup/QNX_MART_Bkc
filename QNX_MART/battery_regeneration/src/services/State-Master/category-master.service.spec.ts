import { TestBed } from '@angular/core/testing';

import { CategoryMasterService } from './category-master.service';

describe('CategoryMasterService', () => {
  let service: CategoryMasterService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CategoryMasterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

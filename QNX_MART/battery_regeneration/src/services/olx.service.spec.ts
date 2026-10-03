import { TestBed } from '@angular/core/testing';

import { OlxService } from './olx.service';

describe('OlxService', () => {
  let service: OlxService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OlxService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';

import { PlacesNearbyService } from './places-nearby.service';

describe('PlacesNearbyService', () => {
  let service: PlacesNearbyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PlacesNearbyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

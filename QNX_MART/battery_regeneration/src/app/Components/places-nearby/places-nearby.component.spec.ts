import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PlacesNearbyComponent } from './places-nearby.component';

describe('PlacesNearbyComponent', () => {
  let component: PlacesNearbyComponent;
  let fixture: ComponentFixture<PlacesNearbyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PlacesNearbyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PlacesNearbyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

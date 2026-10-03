import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PropertyEnquiryComponent } from './property-enquiry.component';

describe('PropertyEnquiryComponent', () => {
  let component: PropertyEnquiryComponent;
  let fixture: ComponentFixture<PropertyEnquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PropertyEnquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PropertyEnquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

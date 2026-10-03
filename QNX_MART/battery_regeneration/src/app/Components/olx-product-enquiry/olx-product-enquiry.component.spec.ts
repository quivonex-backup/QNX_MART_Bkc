import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OlxProductEnquiryComponent } from './olx-product-enquiry.component';

describe('OlxProductEnquiryComponent', () => {
  let component: OlxProductEnquiryComponent;
  let fixture: ComponentFixture<OlxProductEnquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlxProductEnquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OlxProductEnquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

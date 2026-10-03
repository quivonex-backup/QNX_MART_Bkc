import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketingPartnerEnquiryComponent } from './marketing-partner-enquiry.component';

describe('MarketingPartnerEnquiryComponent', () => {
  let component: MarketingPartnerEnquiryComponent;
  let fixture: ComponentFixture<MarketingPartnerEnquiryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketingPartnerEnquiryComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketingPartnerEnquiryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

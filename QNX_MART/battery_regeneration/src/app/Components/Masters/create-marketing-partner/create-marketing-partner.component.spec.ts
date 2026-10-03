import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMarketingPartnerComponent } from './create-marketing-partner.component';

describe('CreateMarketingPartnerComponent', () => {
  let component: CreateMarketingPartnerComponent;
  let fixture: ComponentFixture<CreateMarketingPartnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMarketingPartnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateMarketingPartnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

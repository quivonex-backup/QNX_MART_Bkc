import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InfoPartnerComponent } from './info-partner.component';

describe('InfoPartnerComponent', () => {
  let component: InfoPartnerComponent;
  let fixture: ComponentFixture<InfoPartnerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InfoPartnerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(InfoPartnerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

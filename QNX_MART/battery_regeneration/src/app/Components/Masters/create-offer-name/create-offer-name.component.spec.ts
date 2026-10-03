import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateOfferNameComponent } from './create-offer-name.component';

describe('CreateOfferNameComponent', () => {
  let component: CreateOfferNameComponent;
  let fixture: ComponentFixture<CreateOfferNameComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateOfferNameComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateOfferNameComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

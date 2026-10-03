import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpBuyingComponent } from './help-buying.component';

describe('HelpBuyingComponent', () => {
  let component: HelpBuyingComponent;
  let fixture: ComponentFixture<HelpBuyingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpBuyingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpBuyingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

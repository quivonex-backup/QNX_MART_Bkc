import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HelpSellingComponent } from './help-selling.component';

describe('HelpSellingComponent', () => {
  let component: HelpSellingComponent;
  let fixture: ComponentFixture<HelpSellingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HelpSellingComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HelpSellingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

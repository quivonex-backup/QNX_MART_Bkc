import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OlxProductDetailComponent } from './olx-product-detail.component';

describe('OlxProductDetailComponent', () => {
  let component: OlxProductDetailComponent;
  let fixture: ComponentFixture<OlxProductDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlxProductDetailComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OlxProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

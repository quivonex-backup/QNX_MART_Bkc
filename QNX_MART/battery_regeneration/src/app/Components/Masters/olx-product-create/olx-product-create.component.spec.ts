import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OlxProductCreateComponent } from './olx-product-create.component';

describe('OlxProductCreateComponent', () => {
  let component: OlxProductCreateComponent;
  let fixture: ComponentFixture<OlxProductCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlxProductCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OlxProductCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

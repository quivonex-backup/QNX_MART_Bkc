import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OlxProductListComponent } from './olx-product-list.component';

describe('OlxProductListComponent', () => {
  let component: OlxProductListComponent;
  let fixture: ComponentFixture<OlxProductListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OlxProductListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OlxProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

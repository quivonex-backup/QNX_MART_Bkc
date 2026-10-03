import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubCategoryCreateComponent } from './sub-category-create.component';

describe('SubCategoryCreateComponent', () => {
  let component: SubCategoryCreateComponent;
  let fixture: ComponentFixture<SubCategoryCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubCategoryCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubCategoryCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

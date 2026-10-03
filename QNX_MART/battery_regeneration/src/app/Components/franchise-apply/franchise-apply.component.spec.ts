import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FranchiseApplyComponent } from './franchise-apply.component';

describe('FranchiseApplyComponent', () => {
  let component: FranchiseApplyComponent;
  let fixture: ComponentFixture<FranchiseApplyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FranchiseApplyComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FranchiseApplyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

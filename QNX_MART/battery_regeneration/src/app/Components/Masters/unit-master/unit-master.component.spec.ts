import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnitMasterComponent } from './unit-master.component';

describe('UnitMasterComponent', () => {
  let component: UnitMasterComponent;
  let fixture: ComponentFixture<UnitMasterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnitMasterComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(UnitMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

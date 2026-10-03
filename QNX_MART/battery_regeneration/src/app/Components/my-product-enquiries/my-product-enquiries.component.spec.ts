import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyProductEnquiriesComponent } from './my-product-enquiries.component';

describe('MyProductEnquiriesComponent', () => {
  let component: MyProductEnquiriesComponent;
  let fixture: ComponentFixture<MyProductEnquiriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyProductEnquiriesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyProductEnquiriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelPartnerCreateComponent } from './channel-partner-create.component';

describe('ChannelPartnerCreateComponent', () => {
  let component: ChannelPartnerCreateComponent;
  let fixture: ComponentFixture<ChannelPartnerCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelPartnerCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelPartnerCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

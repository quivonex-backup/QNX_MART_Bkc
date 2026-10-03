import { TestBed } from '@angular/core/testing';

import { FarmSurveyService } from './farm-survey.service';

describe('FarmSurveyService', () => {
  let service: FarmSurveyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FarmSurveyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

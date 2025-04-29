import { TestBed } from '@angular/core/testing';

import { MedicalReportService } from './medical-report.service';

describe('MedicalReportService', () => {
  let service: MedicalReportService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MedicalReportService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

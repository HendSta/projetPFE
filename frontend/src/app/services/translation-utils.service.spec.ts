import { TestBed } from '@angular/core/testing';

import { TranslationUtilsService } from './translation-utils.service';

describe('TranslationUtilsService', () => {
  let service: TranslationUtilsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranslationUtilsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

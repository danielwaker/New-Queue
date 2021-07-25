import { TestBed } from '@angular/core/testing';

import { AuthenicateService } from './authenicate.service';

describe('AuthenicateService', () => {
  let service: AuthenicateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthenicateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

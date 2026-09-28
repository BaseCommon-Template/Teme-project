import { TestBed } from '@angular/core/testing';
import { LandingPage } from './landing-page';

describe('LandingPage', () => {
  let service: LandingPage;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LandingPage);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

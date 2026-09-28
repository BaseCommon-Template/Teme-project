import { TestBed } from '@angular/core/testing';
import { Agniveerpostmaster } from './agniveerpostmaster';

describe('Agniveerpostmaster', () => {
  let service: Agniveerpostmaster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Agniveerpostmaster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

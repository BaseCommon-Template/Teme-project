import { TestBed } from '@angular/core/testing';
import { Postmaster } from './postmaster';

describe('Postmaster', () => {
  let service: Postmaster;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Postmaster);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

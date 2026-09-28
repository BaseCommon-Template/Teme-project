import { TestBed } from '@angular/core/testing';
import { Postmapping } from './postmapping';

describe('Postmapping', () => {
  let service: Postmapping;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Postmapping);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

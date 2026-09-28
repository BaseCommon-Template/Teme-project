import { TestBed } from '@angular/core/testing';
import { Religion } from './religion';

describe('Religion', () => {
  let service: Religion;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Religion);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

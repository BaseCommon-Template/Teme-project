import { TestBed } from '@angular/core/testing';
import { Nationality } from './nationality';

describe('Nationality', () => {
  let service: Nationality;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Nationality);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

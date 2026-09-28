import { TestBed } from '@angular/core/testing';
import { Usersmanagement } from './usersmanagement';

describe('Usersmanagement', () => {
  let service: Usersmanagement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Usersmanagement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

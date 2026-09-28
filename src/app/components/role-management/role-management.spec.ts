import { TestBed } from '@angular/core/testing';
import { RoleManagement } from './role-management';

describe('RoleManagement', () => {
  let service: RoleManagement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleManagement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

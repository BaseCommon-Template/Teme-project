import { TestBed } from '@angular/core/testing';
import { MenuManagement } from './menu-management';

describe('MenuManagement', () => {
  let service: MenuManagement;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MenuManagement);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { TestBed } from '@angular/core/testing';
import { OrganizationType } from './organization-type';

describe('OrganizationType', () => {
  let service: OrganizationType;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OrganizationType);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { OrganizationTypeTable } from './organization-type-table';

describe('OrganizationTypeTable', () => {
  let component: OrganizationTypeTable;
  let fixture: ComponentFixture<OrganizationTypeTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrganizationTypeTable],
    }).compileComponents();

    fixture = TestBed.createComponent(OrganizationTypeTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AgniveerTable } from './agniveer-table';

describe('AgniveerTable', () => {
  let component: AgniveerTable;
  let fixture: ComponentFixture<AgniveerTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgniveerTable],
    }).compileComponents();

    fixture = TestBed.createComponent(AgniveerTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

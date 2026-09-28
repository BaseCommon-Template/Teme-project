import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ArchiveTab } from './archive-tab';

describe('ArchiveTab', () => {
  let component: ArchiveTab;
  let fixture: ComponentFixture<ArchiveTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ArchiveTab],
    }).compileComponents();

    fixture = TestBed.createComponent(ArchiveTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

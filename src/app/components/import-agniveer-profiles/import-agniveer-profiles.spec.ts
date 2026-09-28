import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ImportAgniveerProfiles } from './import-agniveer-profiles';

describe('ImportAgniveerProfiles', () => {
  let component: ImportAgniveerProfiles;
  let fixture: ComponentFixture<ImportAgniveerProfiles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ImportAgniveerProfiles],
    }).compileComponents();

    fixture = TestBed.createComponent(ImportAgniveerProfiles);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

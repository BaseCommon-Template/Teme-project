import { ComponentFixture, TestBed } from '@angular/core/testing';
import { GazetteTab } from './gazette-tab';

describe('GazetteTab', () => {
  let component: GazetteTab;
  let fixture: ComponentFixture<GazetteTab>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GazetteTab],
    }).compileComponents();

    fixture = TestBed.createComponent(GazetteTab);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

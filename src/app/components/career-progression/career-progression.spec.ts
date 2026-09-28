import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CareerProgression } from './career-progression';

describe('CareerProgression', () => {
  let component: CareerProgression;
  let fixture: ComponentFixture<CareerProgression>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CareerProgression],
    }).compileComponents();

    fixture = TestBed.createComponent(CareerProgression);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

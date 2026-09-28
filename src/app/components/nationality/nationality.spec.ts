import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Nationality } from './nationality';

describe('Nationality', () => {
  let component: Nationality;
  let fixture: ComponentFixture<Nationality>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nationality],
    }).compileComponents();

    fixture = TestBed.createComponent(Nationality);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Vacancyes } from './vacancyes';

describe('Vacancyes', () => {
  let component: Vacancyes;
  let fixture: ComponentFixture<Vacancyes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Vacancyes],
    }).compileComponents();

    fixture = TestBed.createComponent(Vacancyes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

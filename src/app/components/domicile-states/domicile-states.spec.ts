import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomicileStates } from './domicile-states';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';

describe('DomicileStates', () => {
  let component: DomicileStates;
  let fixture: ComponentFixture<DomicileStates>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DomicileStates],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DomicileStates);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

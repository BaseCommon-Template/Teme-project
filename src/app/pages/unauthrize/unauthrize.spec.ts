import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { UnauthrizeComponent } from './unauthrize';

describe('UnauthrizeComponent', () => {
  let component: UnauthrizeComponent;
  let fixture: ComponentFixture<UnauthrizeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnauthrizeComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(UnauthrizeComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ScheduleEdit } from './schedule-edit';

describe('ScheduleEdit', () => {
  let component: ScheduleEdit;
  let fixture: ComponentFixture<ScheduleEdit>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScheduleEdit],
    }).compileComponents();

    fixture = TestBed.createComponent(ScheduleEdit);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

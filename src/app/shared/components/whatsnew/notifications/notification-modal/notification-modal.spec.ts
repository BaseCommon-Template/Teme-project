import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NotificationModal } from './notification-modal';

describe('NotificationModal', () => {
  let component: NotificationModal;
  let fixture: ComponentFixture<NotificationModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NotificationModal],
    }).compileComponents();

    fixture = TestBed.createComponent(NotificationModal);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { ScheduleItem, ScheduleService } from '../../../services/schedule/schedule';
import { CryptoHelper } from '../../../helpers/crypto-helper';

export interface ScheduleData {
  roundName: string;
  openingDate: string;
  closingDate: string;
  profileEditOpeningDate?: string;
  profileEditClosingDate?: string;
  openPartB?: boolean;
  openPartC?: boolean;
  forces: {
    army: boolean;
    navy: boolean;
    airForce: boolean;
  };
  isActive: boolean;
  notificationOpenForAllState: boolean;
  rawSchedule?: any;
}

@Component({
  selector: 'app-schedule-edit',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-edit.html',
  styleUrl: './schedule-edit.css',
})
export class ScheduleEdit implements OnChanges {
  private readonly scheduleService = inject(ScheduleService);

  @Input() isOpen = false;
  @Input() scheduleData: ScheduleItem | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() update = new EventEmitter<ScheduleData>();

  readonly isEditMode = signal(false);
  readonly isSubmitting = signal(false);

  readonly roundName = signal('');
  readonly openingDate = signal('');
  readonly closingDate = signal('');
  readonly profileEditOpeningDate = signal('');
  readonly profileEditClosingDate = signal('');
  readonly openPartB = signal(false);
  readonly openPartC = signal(false);
  readonly forces = signal<{ army: boolean; navy: boolean; airForce: boolean }>({
    army: false,
    navy: false,
    airForce: false,
  });
  readonly isActiveSchedule = signal(false);
  readonly notificationOpenForAllState = signal(false);

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['scheduleData'] || changes['isOpen']) {
      if (this.isOpen) {
        this.patchScheduleData(this.scheduleData);
      }
    }
  }

  patchScheduleData(data: ScheduleItem | null): void {
    const d = data as any;
    if (
      d &&
      (d.Id ||
        d.ScheduleAutoId !== undefined ||
        d.schedule_autoid !== undefined ||
        d.Round !== undefined ||
        d.OpeningDate ||
        d.opening_date ||
        d.ClosingDate ||
        d.closing_date)
    ) {
      this.isEditMode.set(true);
      const roundVal = d.Round ?? d.round;
      this.roundName.set(
        roundVal !== null && roundVal !== undefined && roundVal !== '' ? `Round ${roundVal}` : '',
      );
      this.openingDate.set(
        this.formatDateForInput(d.OpeningDate ?? d.openingDate ?? d.opening_date),
      );
      this.closingDate.set(
        this.formatDateForInput(d.ClosingDate ?? d.closingDate ?? d.closing_date),
      );
      this.profileEditOpeningDate.set(
        this.formatDateForInput(
          d.ProfileEditOpeningDate ??
            d.profileEditOpeningDate ??
            d.profileedit_opening_date ??
            d.ProfileeditOpeningDate,
        ),
      );
      this.profileEditClosingDate.set(
        this.formatDateForInput(
          d.ProfileEditClosingDate ??
            d.profileEditClosingDate ??
            d.profileedit_closing_date ??
            d.ProfileeditClosingDate,
        ),
      );
      this.forces.set({
        army: Boolean(d.IsArmy ?? d.isArmy ?? d.is_army ?? false),
        navy: Boolean(d.IsNavy ?? d.isNavy ?? d.is_navy ?? false),
        airForce: Boolean(d.IsAirForce ?? d.isAirForce ?? d.is_air_force ?? false),
      });
      const isTrueVal = (v: any) =>
        v === true || v === 'true' || v === 'True' || v === 1 || v === '1';

      const partBVal = d.OpenPartB ?? d.openPartB;

      this.openPartB.set(partBVal !== undefined && partBVal !== null ? isTrueVal(partBVal) : false);

      const partCVal = d.OpenPartC ?? d.openPartC;
      this.openPartC.set(partCVal !== undefined && partCVal !== null ? isTrueVal(partCVal) : false);

      this.isActiveSchedule.set(Boolean(d.Active ?? d.active ?? d.IsActive ?? d.isActive ?? false));
      const notificationOpenForAllStateVal =
        d.NotificationOpenForAllState ??
        d.notificationOpenForAllState ??
        d.notification_open_for_all_state ??
        false;

      this.notificationOpenForAllState.set(isTrueVal(notificationOpenForAllStateVal));
    } else {
      // Create mode: reset all fields to empty
      this.isEditMode.set(false);
      this.roundName.set('');
      this.openingDate.set('');
      this.closingDate.set('');
      this.profileEditOpeningDate.set('');
      this.profileEditClosingDate.set('');
      this.openPartB.set(false);
      this.openPartC.set(false);
      this.forces.set({
        army: false,
        navy: false,
        airForce: false,
      });
      this.isActiveSchedule.set(false);
      this.notificationOpenForAllState.set(false);
    }
  }

  private formatDateForInput(dateVal: any): string {
    if (!dateVal) return '';
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) {
        if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
          return dateVal.slice(0, 10);
        }
        return '';
      }
      return d.toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }

  @HostListener('document:keydown.escape')
  handleEscape(): void {
    if (this.isOpen) {
      this.onCancel();
    }
  }

  toggleForce(forceKey: 'army' | 'navy' | 'airForce'): void {
    this.forces.update((prev) => ({
      ...prev,
      [forceKey]: !prev[forceKey],
    }));
  }

  toggleOpenPartB(): void {
    this.openPartB.update((v) => !v);
  }

  toggleOpenPartC(): void {
    this.openPartC.update((v) => !v);
  }

  toggleActiveSchedule(): void {
    this.isActiveSchedule.update((v) => !v);
  }

  toggleNotificationOpenForAllState(): void {
    this.notificationOpenForAllState.update((v) => !v);
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement)?.classList?.contains('modal-backdrop-overlay')) {
      this.onCancel();
    }
  }

  onCancel(): void {
    this.close.emit();
  }

  onSaveSchedule(): void {
    if (!this.openingDate()) {
      Swal.fire({
        icon: 'warning',
        title: 'Opening Date Required',
        text: 'Please select an Opening Date.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    if (!this.closingDate()) {
      Swal.fire({
        icon: 'warning',
        title: 'Closing Date Required',
        text: 'Please select a Closing Date.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    if (this.closingDate() < this.openingDate()) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Date Range',
        text: 'Closing date cannot be earlier than opening date.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    if (!this.profileEditOpeningDate()) {
      Swal.fire({
        icon: 'warning',
        title: 'Profile Edit Opening Date Required',
        text: 'Please select a Profile Edit Opening Date.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    if (!this.profileEditClosingDate()) {
      Swal.fire({
        icon: 'warning',
        title: 'Profile Edit Closing Date Required',
        text: 'Please select a Profile Edit Closing Date.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    if (this.profileEditClosingDate() < this.profileEditOpeningDate()) {
      Swal.fire({
        icon: 'warning',
        title: 'Invalid Profile Edit Date Range',
        text: 'Profile edit closing date cannot be earlier than profile edit opening date.',
        confirmButtonColor: '#355f2d',
      });
      return;
    }

    let createdBy = 1;
    try {
      const userStr = sessionStorage.getItem('user');
      if (userStr) {
        const u = JSON.parse(userStr);
        createdBy = Number(u.user_id || u.userId || u.id || u.CreatedBy || 1) || 1;
      }
    } catch {
      createdBy = 1;
    }

    const s = this.scheduleData as any;
    const scheduleAutoId =
      this.isEditMode() && s
        ? Number(s.schedule_autoid ?? s.ScheduleAutoId ?? s.Schedule_AutoId ?? s.Id ?? 0) || 0
        : 0;

    const payload = {
      schedule_autoid: scheduleAutoId,
      opening_date: this.openingDate(),
      closing_date: this.closingDate(),
      created_by: createdBy,
      is_army: Boolean(this.forces().army),
      is_navy: Boolean(this.forces().navy),
      is_air_force: Boolean(this.forces().airForce),
      active: Boolean(this.isActiveSchedule()),
      notification_open_for_all_state: Boolean(this.notificationOpenForAllState()),
      profileedit_opening_date: this.profileEditOpeningDate(),
      profileedit_closing_date: this.profileEditClosingDate(),
      open_part_b: Boolean(this.openPartB()),
      open_part_c: Boolean(this.openPartC()),
    };

    const encrypted = CryptoHelper.encrypt(JSON.stringify(payload));
    const encryptedPayload = JSON.stringify(encrypted);

    this.isSubmitting.set(true);

    this.scheduleService.updateAndCreateSchedule(encryptedPayload).subscribe({
      next: (res: any) => {
        if (!res.code) {
          this.isSubmitting.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Failed to Save Schedule',
            text: res?.message || 'Something went wrong while saving the schedule.',
            confirmButtonColor: '#355f2d',
          });
        } else {
          this.isSubmitting.set(false);
          Swal.fire({
            icon: 'success',
            title: this.isEditMode() ? 'Schedule Updated' : 'Schedule Created',
            text:
              res?.message ||
              (this.isEditMode()
                ? 'Schedule updated successfully.'
                : 'Schedule created successfully.'),
            confirmButtonColor: '#355f2d',
            timer: 2200,
          });

          this.update.emit({
            roundName: this.roundName(),
            openingDate: this.openingDate(),
            closingDate: this.closingDate(),
            profileEditOpeningDate: this.profileEditOpeningDate(),
            profileEditClosingDate: this.profileEditClosingDate(),
            openPartB: this.openPartB(),
            openPartC: this.openPartC(),
            forces: this.forces(),
            isActive: this.isActiveSchedule(),
            notificationOpenForAllState: this.notificationOpenForAllState(),
            rawSchedule: payload,
          });
          this.close.emit();
        }
      },
      error: (err: any) => {
        console.error('Error saving schedule:', err);
        this.isSubmitting.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Failed to Save Schedule',
          text:
            err?.error?.message ||
            err?.message ||
            'Something went wrong while saving the schedule.',
            confirmButtonColor: '#355f2d',
        });
      },
    });
  }
}

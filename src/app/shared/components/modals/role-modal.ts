import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Role, CreateRolePayload } from '../../../core/models/role.model';

@Component({
  selector: 'app-role-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './role-modal.html',
  styleUrl: './role-modal.css',
})
export class RoleModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() editingRole: Role | null = null;
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ payload: CreateRolePayload; id?: string }>();

  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  formData: CreateRolePayload = {
    role_id: 0,
    role_name: '',
    is_active: true,
    priority: 1,
    otp_based: 'N',
    ip_based: 'N',
    ip_address: '',
  };

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingRole'] || changes['isOpen']) {
      if (this.editingRole) {
        this.formData = {
          role_id: this.editingRole.role_id,
          role_name: this.editingRole.role_name,
          is_active: this.editingRole.is_active,
          priority: this.editingRole.priority || 1,
          otp_based: this.editingRole.otp_based || 'N',
          ip_based: this.editingRole.ip_based || 'N',
          ip_address: this.editingRole.ip_address || '',
        };
      } else {
        this.formData = {
          role_id: 0,
          role_name: '',
          is_active: true,
          priority: 1,
          otp_based: 'N',
          ip_based: 'N',
          ip_address: '',
        };
      }
      this.error.set(null);
      this.submitting.set(false);
    }
  }

  onSubmit(): void {
    if (!this.formData.role_name || this.formData.role_id === undefined) {
      this.error.set('Role ID and Role Name are required.');
      return;
    }

    this.submitting.set(true);
    this.save.emit({
      payload: this.formData,
      id: this.editingRole?._id,
    });
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onClose();
    }
  }

  onClose(): void {
    this.close.emit();
  }
}

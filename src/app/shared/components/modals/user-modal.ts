import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserFromAPI, CreateUserPayload, UserRoleItem } from '../../../core/models/user.model';
import { Entity } from '../../../core/models/entity.model';
import { SubEntityFromAPI } from '../../../core/models/sub-entity.model';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-modal.html',
  styleUrl: './user-modal.css',
})
export class UserModalComponent implements OnChanges {
  @Input() isOpen = false;
  @Input() editingUser: UserFromAPI | null = null;
  @Input() entities: Entity[] = [];
  @Input() subEntities: SubEntityFromAPI[] = [];
  @Input() roles: Role[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ payload: CreateUserPayload; id?: string }>();

  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  password = '';

  formData: {
    entity_id: string;
    sub_entity_id: string | null;
    officer_name: string;
    rank: string;
    designation: string;
    phone: string;
    email: string;
    role_id: string;
    roles: UserRoleItem[];
  } = {
    entity_id: '',
    sub_entity_id: null,
    officer_name: '',
    rank: '',
    designation: '',
    phone: '',
    email: '',
    role_id: '',
    roles: [],
  };

  filteredSubEntities(): SubEntityFromAPI[] {
    if (!this.formData.entity_id) return this.subEntities;
    return this.subEntities.filter((s) => s.parent_entity_id === this.formData.entity_id);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingUser'] || changes['isOpen']) {
      if (this.editingUser) {
        this.formData = {
          entity_id: this.editingUser.entity_id || '',
          sub_entity_id: this.editingUser.sub_entity_id || null,
          officer_name: this.editingUser.officer_name || (this.editingUser as any).name || '',
          rank: this.editingUser.rank || '',
          designation: this.editingUser.designation || '',
          phone: this.editingUser.phone || '',
          email: this.editingUser.email || '',
          role_id: String(this.editingUser.role_id || ''),
          roles: this.editingUser.roles ? [...this.editingUser.roles] : [],
        };
      } else {
        this.formData = {
          entity_id: this.entities[0]?._id || '',
          sub_entity_id: null,
          officer_name: '',
          rank: '',
          designation: '',
          phone: '',
          email: '',
          role_id: '',
          roles: [],
        };
      }
      this.password = '';
      this.error.set(null);
      this.submitting.set(false);
    }
  }

  isRoleSelected(roleId: number): boolean {
    return (this.formData.roles || []).some((r) => r.role_id === roleId);
  }

  toggleRole(role: Role): void {
    if (!this.formData.roles) {
      this.formData.roles = [];
    }
    const idx = this.formData.roles.findIndex((r) => r.role_id === role.role_id);
    if (idx >= 0) {
      this.formData.roles.splice(idx, 1);
    } else {
      this.formData.roles.push({
        role_id: role.role_id,
        role_name: role.role_name,
        priority: role.priority || 1,
        otp_based: role.otp_based || 'N',
        ip_based: role.ip_based || 'N',
      });
    }
    if (this.formData.roles.length > 0) {
      this.formData.role_id = String(this.formData.roles[0].role_id);
    }
  }

  onSubmit(): void {
    if (!this.formData.officer_name || !this.formData.email || !this.formData.phone || !this.formData.entity_id) {
      this.error.set('Please fill all required fields.');
      return;
    }

    if (!this.formData.roles || this.formData.roles.length === 0) {
      this.error.set('Please select at least one role for this user.');
      return;
    }

    this.submitting.set(true);
    const payload = { ...this.formData };
    if (!this.editingUser && this.password) {
      (payload as any).password = this.password;
    }

    this.save.emit({
      payload,
      id: this.editingUser?._id,
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

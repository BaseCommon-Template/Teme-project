import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../core/services/role';
import { MenuService } from '../../../core/services/menu';
import { Role, CreateRolePayload } from '../../../core/models/role.model';
import { RoleModalComponent } from '../../../shared/components/modals/role-modal';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [CommonModule, FormsModule, RoleModalComponent],
  templateUrl: './roles.html',
  styleUrl: './roles.css',
})
export class RolesComponent implements OnInit {
  private readonly roleService = inject(RoleService);
  private readonly menuService = inject(MenuService);

  readonly roles = signal<Role[]>([]);
  readonly loading = signal<boolean>(true);
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedRole = signal<Role | null>(null);
  searchQuery = '';

  ngOnInit(): void {
    this.loadRoles();
  }

  loadRoles(): void {
    this.loading.set(true);
    this.roleService.getAllRoles().subscribe({
      next: (data) => {
        this.roles.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredRoles(): Role[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.roles();
    return this.roles().filter(
      (r) =>
        r.role_name.toLowerCase().includes(q) ||
        String(r.role_id).includes(q)
    );
  }

  canAdd(): boolean {
    return this.menuService.canAdd('/dashboard/roles');
  }

  canEdit(): boolean {
    return this.menuService.canEdit('/dashboard/roles');
  }

  canDelete(): boolean {
    return this.menuService.canDelete('/dashboard/roles');
  }

  openCreateModal(): void {
    this.selectedRole.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(role: Role): void {
    this.selectedRole.set(role);
    this.isModalOpen.set(true);
  }

  onSaveRole(event: { payload: CreateRolePayload; id?: string }): void {
    if (this.selectedRole()) {
      this.roleService.updateRole(event.payload.role_id, event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadRoles();
        },
      });
    } else {
      this.roleService.createRole(event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadRoles();
        },
      });
    }
  }

  onDelete(roleId: number): void {
    if (confirm('Are you sure you want to delete this security role?')) {
      this.roleService.deleteRole(roleId).subscribe({
        next: () => this.loadRoles(),
      });
    }
  }
}

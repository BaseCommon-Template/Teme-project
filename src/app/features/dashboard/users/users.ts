import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user';
import { EntityService } from '../../../core/services/entity';
import { SubEntityService } from '../../../core/services/sub-entity';
import { RoleService } from '../../../core/services/role';
import { MenuService } from '../../../core/services/menu';
import { UserFromAPI, CreateUserPayload } from '../../../core/models/user.model';
import { Entity } from '../../../core/models/entity.model';
import { SubEntityFromAPI } from '../../../core/models/sub-entity.model';
import { Role } from '../../../core/models/role.model';
import { UserModalComponent } from '../../../shared/components/modals/user-modal';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule, UserModalComponent],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class UsersComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly entityService = inject(EntityService);
  private readonly subEntityService = inject(SubEntityService);
  private readonly roleService = inject(RoleService);
  private readonly menuService = inject(MenuService);

  readonly users = signal<UserFromAPI[]>([]);
  readonly entities = signal<Entity[]>([]);
  readonly subEntities = signal<SubEntityFromAPI[]>([]);
  readonly roles = signal<Role[]>([]);
  readonly loading = signal<boolean>(true);
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedUser = signal<UserFromAPI | null>(null);

  searchQuery = '';
  selectedEntityFilter = '';

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading.set(true);

    this.entityService.getAllEntities().subscribe({
      next: (ents) => this.entities.set(ents),
    });

    this.subEntityService.getAllSubEntities().subscribe({
      next: (subs) => this.subEntities.set(subs),
    });

    this.roleService.getAllRoles().subscribe({
      next: (r) => this.roles.set(r),
    });

    this.userService.getAllUsers().subscribe({
      next: (u) => {
        this.users.set(u);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredUsers(): UserFromAPI[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.users().filter((u) => {
      const name = (u.officer_name || u.name || u.username || '').toLowerCase();
      const email = (u.email || '').toLowerCase();
      const designation = (u.designation || u.rank || '').toLowerCase();
      const matchSearch = !q || name.includes(q) || email.includes(q) || designation.includes(q);
      const matchEntity = !this.selectedEntityFilter || u.entity_id === this.selectedEntityFilter;
      return matchSearch && matchEntity;
    });
  }

  getEntityName(entityId: any): string {
    if (!entityId) return 'Ministry of Home Affairs';
    const id = typeof entityId === 'string' ? entityId : entityId?._id;
    return this.entities().find((e) => e._id === id)?.entity_name || 'Ministry of Home Affairs';
  }

  getSubEntityName(subId: any): string {
    if (!subId) return '—';
    const id = typeof subId === 'string' ? subId : subId?._id;
    return this.subEntities().find((s) => s._id === id)?.sub_entity_name || '—';
  }

  canAdd(): boolean {
    return this.menuService.canAdd('/dashboard/officers') || this.menuService.canAdd('/dashboard/users');
  }

  canEdit(): boolean {
    return this.menuService.canEdit('/dashboard/officers') || this.menuService.canEdit('/dashboard/users');
  }

  canDelete(): boolean {
    return this.menuService.canDelete('/dashboard/officers') || this.menuService.canDelete('/dashboard/users');
  }

  openCreateModal(): void {
    this.selectedUser.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(user: UserFromAPI): void {
    this.selectedUser.set(user);
    this.isModalOpen.set(true);
  }

  onSaveUser(event: { payload: CreateUserPayload; id?: string }): void {
    if (event.id) {
      this.userService.updateUser(event.id, event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadData();
        },
      });
    } else {
      this.userService.createUser(event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadData();
        },
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Are you sure you want to delete this user?')) {
      this.userService.deleteUser(id).subscribe({
        next: () => this.loadData(),
      });
    }
  }
}

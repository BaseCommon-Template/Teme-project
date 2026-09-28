import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Menu, CreateMenuPayload, RolePermission } from '../../../core/models/menu.model';
import { RoleService } from '../../../core/services/role';
import { Role } from '../../../core/models/role.model';

@Component({
  selector: 'app-menu-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-modal.html',
  styleUrl: './menu-modal.css',
})
export class MenuModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() editingMenu: Menu | null = null;
  @Input() allMenus: Menu[] = [];
  @Output() close = new EventEmitter<void>();
  @Output() save = new EventEmitter<{ payload: CreateMenuPayload; id?: string }>();

  private readonly roleService = inject(RoleService);

  readonly allRoles = signal<Role[]>([]);
  readonly submitting = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  formData: CreateMenuPayload = {
    menu_id: 0,
    menu_name: '',
    description: null,
    parent_menu_id: null,
    app_router_path: '',
    menu_type: 1,
    menu_category: 'parent',
    is_active: true,
    is_visible_in_navbar: true,
    position: 1,
    roles: [],
  };

  ngOnInit(): void {
    this.roleService.getAllRoles().subscribe({
      next: (roles) => {
        this.allRoles.set(roles);
        this.syncRolePermissions();
      },
    });
  }

  parentMenus(): Menu[] {
    return this.allMenus.filter((m) => m.menu_category === 'parent' || !m.parent_menu_id);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['editingMenu'] || changes['isOpen']) {
      if (this.editingMenu) {
        this.formData = {
          menu_id: this.editingMenu.menu_id,
          menu_name: this.editingMenu.menu_name,
          description: this.editingMenu.description || null,
          parent_menu_id: this.editingMenu.parent_menu_id || null,
          app_router_path: this.editingMenu.app_router_path || '',
          menu_type: this.editingMenu.menu_type || 1,
          menu_category: this.editingMenu.menu_category || 'parent',
          is_active: this.editingMenu.is_active !== false,
          is_visible_in_navbar: this.editingMenu.is_visible_in_navbar !== false,
          position: this.editingMenu.position || 1,
          roles: [],
        };
      } else {
        this.formData = {
          menu_id: 0,
          menu_name: '',
          description: null,
          parent_menu_id: null,
          app_router_path: '',
          menu_type: 1,
          menu_category: 'parent',
          is_active: true,
          is_visible_in_navbar: true,
          position: 1,
          roles: [],
        };
      }
      this.syncRolePermissions();
      this.error.set(null);
      this.submitting.set(false);
    }
  }

  syncRolePermissions(): void {
    const roles = this.allRoles();
    if (roles.length === 0) return;

    this.formData.roles = roles.map((r) => {
      const existing = this.editingMenu?.roles?.find((er) => er.role_id === r.role_id);
      return {
        role_id: r.role_id,
        role_name: r.role_name,
        PView: existing ? existing.PView : '1',
        PAdd: existing ? existing.PAdd : '0',
        PEdit: existing ? existing.PEdit : '0',
        PDelete: existing ? existing.PDelete : '0',
      };
    });
  }

  togglePerm(idx: number, key: 'PView' | 'PAdd' | 'PEdit' | 'PDelete'): void {
    const cur = this.formData.roles[idx][key];
    this.formData.roles[idx][key] = cur === '1' ? '0' : '1';
  }

  onSubmit(): void {
    if (!this.formData.menu_name || !this.formData.app_router_path) {
      this.error.set('Menu name and router path are required.');
      return;
    }

    this.submitting.set(true);
    this.save.emit({
      payload: this.formData,
      id: this.editingMenu?._id,
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

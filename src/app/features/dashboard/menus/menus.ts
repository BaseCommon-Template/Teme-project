import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuService } from '../../../core/services/menu';
import { Menu, CreateMenuPayload } from '../../../core/models/menu.model';
import { MenuModalComponent } from '../../../shared/components/modals/menu-modal';

@Component({
  selector: 'app-menus',
  standalone: true,
  imports: [CommonModule, FormsModule, MenuModalComponent],
  templateUrl: './menus.html',
  styleUrl: './menus.css',
})
export class MenusComponent implements OnInit {
  private readonly menuService = inject(MenuService);

  readonly menus = signal<Menu[]>([]);
  readonly loading = signal<boolean>(true);
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedMenu = signal<Menu | null>(null);
  searchQuery = '';

  ngOnInit(): void {
    this.loadMenus();
  }

  loadMenus(): void {
    this.loading.set(true);
    this.menuService.getAllMenus().subscribe({
      next: (res) => {
        this.menus.set(res?.menus || (Array.isArray(res) ? res : []));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredMenus(): Menu[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.menus();
    return this.menus().filter(
      (m) =>
        m.menu_name.toLowerCase().includes(q) ||
        (m.app_router_path && m.app_router_path.toLowerCase().includes(q)),
    );
  }

  canAdd(): boolean {
    return this.menuService.canAdd('/dashboard/menus');
  }

  canEdit(): boolean {
    return this.menuService.canEdit('/dashboard/menus');
  }

  canDelete(): boolean {
    return this.menuService.canDelete('/dashboard/menus');
  }

  openCreateModal(): void {
    this.selectedMenu.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(menu: Menu): void {
    this.selectedMenu.set(menu);
    this.isModalOpen.set(true);
  }

  onSaveMenu(event: { payload: CreateMenuPayload; id?: string }): void {
    if (this.selectedMenu()) {
      this.menuService.updateMenu(event.payload.menu_id, event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadMenus();
          this.menuService.refresh();
        },
      });
    } else {
      this.menuService.createMenu(event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadMenus();
          this.menuService.refresh();
        },
      });
    }
  }

  onDelete(menuId: number): void {
    if (confirm('Are you sure you want to delete this menu?')) {
      this.menuService.deleteMenu(menuId).subscribe({
        next: () => {
          this.loadMenus();
          this.menuService.refresh();
        },
      });
    }
  }
}

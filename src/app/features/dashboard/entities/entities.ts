import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EntityService } from '../../../core/services/entity';
import { MenuService } from '../../../core/services/menu';
import { Entity, CreateEntityPayload } from '../../../core/models/entity.model';
import { EntityModalComponent } from '../../../shared/components/modals/entity-modal';

@Component({
  selector: 'app-entities',
  standalone: true,
  imports: [CommonModule, FormsModule, EntityModalComponent],
  templateUrl: './entities.html',
  styleUrl: './entities.css',
})
export class EntitiesComponent implements OnInit {
  private readonly entityService = inject(EntityService);
  private readonly menuService = inject(MenuService);

  readonly entities = signal<Entity[]>([]);
  readonly loading = signal<boolean>(true);
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedEntity = signal<Entity | null>(null);
  searchQuery = '';

  ngOnInit(): void {
    this.loadEntities();
  }

  loadEntities(): void {
    this.loading.set(true);
    this.entityService.getAllEntities().subscribe({
      next: (data) => {
        this.entities.set(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredEntities(): Entity[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.entities();
    return this.entities().filter(
      (e) =>
        e.entity_name.toLowerCase().includes(q) ||
        e.short_name.toLowerCase().includes(q) ||
        (e.description && e.description.toLowerCase().includes(q))
    );
  }

  canAdd(): boolean {
    return this.menuService.canAdd('/dashboard/entities');
  }

  canEdit(): boolean {
    return this.menuService.canEdit('/dashboard/entities');
  }

  canDelete(): boolean {
    return this.menuService.canDelete('/dashboard/entities');
  }

  openCreateModal(): void {
    this.selectedEntity.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(entity: Entity): void {
    this.selectedEntity.set(entity);
    this.isModalOpen.set(true);
  }

  onSaveEntity(event: { payload: CreateEntityPayload; id?: string }): void {
    if (event.id) {
      this.entityService.updateEntity(event.id, event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadEntities();
        },
      });
    } else {
      this.entityService.createEntity(event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadEntities();
        },
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Are you sure you want to delete this organization type?')) {
      this.entityService.deleteEntity(id).subscribe({
        next: () => this.loadEntities(),
      });
    }
  }
}

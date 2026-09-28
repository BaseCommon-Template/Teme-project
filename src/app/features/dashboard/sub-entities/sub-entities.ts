import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SubEntityService } from '../../../core/services/sub-entity';
import { EntityService } from '../../../core/services/entity';
import { MenuService } from '../../../core/services/menu';
import { SubEntityFromAPI, CreateSubEntityPayload } from '../../../core/models/sub-entity.model';
import { Entity } from '../../../core/models/entity.model';
import { SubEntityModalComponent } from '../../../shared/components/modals/sub-entity-modal';

@Component({
  selector: 'app-sub-entities',
  standalone: true,
  imports: [CommonModule, FormsModule, SubEntityModalComponent],
  templateUrl: './sub-entities.html',
  styleUrl: './sub-entities.css',
})
export class SubEntitiesComponent implements OnInit {
  private readonly subEntityService = inject(SubEntityService);
  private readonly entityService = inject(EntityService);
  private readonly menuService = inject(MenuService);

  readonly subEntities = signal<SubEntityFromAPI[]>([]);
  readonly entities = signal<Entity[]>([]);
  readonly loading = signal<boolean>(true);
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedSubEntity = signal<SubEntityFromAPI | null>(null);

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
      next: (subs) => {
        this.subEntities.set(subs);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  filteredSubEntities(): SubEntityFromAPI[] {
    const q = this.searchQuery.toLowerCase().trim();
    return this.subEntities().filter((s) => {
      const matchSearch =
        !q ||
        s.sub_entity_name.toLowerCase().includes(q) ||
        s.short_name.toLowerCase().includes(q);
      const matchParent =
        !this.selectedEntityFilter || s.parent_entity_id === this.selectedEntityFilter;
      return matchSearch && matchParent;
    });
  }

  getParentEntityName(parentId: string): string {
    const found = this.entities().find((e) => e._id === parentId);
    return found?.entity_name || 'Ministry of Home Affairs';
  }

  canAdd(): boolean {
    return this.menuService.canAdd('/dashboard/sub-entities');
  }

  canEdit(): boolean {
    return this.menuService.canEdit('/dashboard/sub-entities');
  }

  canDelete(): boolean {
    return this.menuService.canDelete('/dashboard/sub-entities');
  }

  openCreateModal(): void {
    this.selectedSubEntity.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(sub: SubEntityFromAPI): void {
    this.selectedSubEntity.set(sub);
    this.isModalOpen.set(true);
  }

  onSaveSubEntity(event: { payload: CreateSubEntityPayload; id?: string }): void {
    if (event.id) {
      this.subEntityService.updateSubEntity(event.id, event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadData();
        },
      });
    } else {
      this.subEntityService.createSubEntity(event.payload).subscribe({
        next: () => {
          this.isModalOpen.set(false);
          this.loadData();
        },
      });
    }
  }

  onDelete(id: string): void {
    if (confirm('Are you sure you want to delete this organization unit?')) {
      this.subEntityService.deleteSubEntity(id).subscribe({
        next: () => this.loadData(),
      });
    }
  }
}

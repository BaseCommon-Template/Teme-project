import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MasterService } from '../../../core/services/master';
import { MenuService } from '../../../core/services/menu';
import { MasterModalComponent } from '../../../shared/components/modals/master-modal';

export type MasterType =
  | 'nationality'
  | 'religion'
  | 'category'
  | 'post'
  | 'state'
  | 'district'
  | 'police-station'
  | 'defence-post';

@Component({
  selector: 'app-master-table',
  standalone: true,
  imports: [CommonModule, FormsModule, MasterModalComponent],
  templateUrl: './master-table.html',
  styleUrl: './master-table.css',
})
export class MasterTableComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly masterService = inject(MasterService);
  private readonly menuService = inject(MenuService);

  readonly masterType = signal<MasterType>('nationality');
  readonly title = signal<string>('Nationality');
  readonly items = signal<any[]>([]);
  readonly parentOptions = signal<{ id: string; label: string }[]>([]);
  readonly loading = signal<boolean>(true);
  readonly isModalOpen = signal<boolean>(false);
  readonly selectedItem = signal<any | null>(null);
  searchQuery = '';

  ngOnInit(): void {}

  resolveTitle(type: MasterType): string {
    switch (type) {
      case 'nationality':
        return 'Nationality';
      case 'religion':
        return 'Religion';
      case 'category':
        return 'Category';
      case 'post':
        return 'Post / Trade';
      case 'state':
        return 'Domicile State / UT';
      case 'district':
        return 'Domicile District';
      case 'police-station':
        return 'Police Station';
      case 'defence-post':
        return 'Defence Post';
      default:
        return 'Master';
    }
  }

  showCodeColumn(): boolean {
    return ['category', 'nationality', 'religion', 'post'].includes(this.masterType());
  }

  showParentColumn(): boolean {
    return ['district', 'police-station'].includes(this.masterType());
  }

  getItemName(item: any): string {
    return (
      item.nationality ||
      item.religion ||
      item.category_name ||
      item.post_name ||
      item.state_name ||
      item.district_name ||
      item.station_name ||
      item.defence_post_name ||
      item.name ||
      '—'
    );
  }

  getItemCode(item: any): string {
    return item.short_name || item.code || item.category_code || '—';
  }

  getItemParent(item: any): string {
    return item.state_name || item.district_name || item.state_id || '—';
  }

  filteredItems(): any[] {
    const q = this.searchQuery.toLowerCase().trim();
    if (!q) return this.items();
    return this.items().filter((i) => this.getItemName(i).toLowerCase().includes(q));
  }

  canAdd(): boolean {
    return this.menuService.canAdd('/dashboard/masters/' + this.masterType());
  }

  canEdit(): boolean {
    return this.menuService.canEdit('/dashboard/masters/' + this.masterType());
  }

  canDelete(): boolean {
    return this.menuService.canDelete('/dashboard/masters/' + this.masterType());
  }

  openCreateModal(): void {
    this.selectedItem.set(null);
    this.isModalOpen.set(true);
  }

  openEditModal(item: any): void {
    this.selectedItem.set(item);
    this.isModalOpen.set(true);
  }
}

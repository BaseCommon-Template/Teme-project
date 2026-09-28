import { Component, EventEmitter, OnInit, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FilterService, QueryFilters } from '../../../core/services/filter';
import { EntityService } from '../../../core/services/entity';
import { Entity } from '../../../core/models/entity.model';

@Component({
  selector: 'app-query-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './query-sidebar.html',
  styleUrl: './query-sidebar.css',
})
export class QuerySidebarComponent implements OnInit {
  @Output() filterChanged = new EventEmitter<QueryFilters>();

  readonly filterService = inject(FilterService);
  private readonly entityService = inject(EntityService);

  readonly entities = signal<Entity[]>([]);

  readonly states = [
    'Andhra Pradesh',
    'Arunachal Pradesh',
    'Assam',
    'Bihar',
    'Chhattisgarh',
    'Goa',
    'Gujarat',
    'Haryana',
    'Himachal Pradesh',
    'Jharkhand',
    'Karnataka',
    'Kerala',
    'Madhya Pradesh',
    'Maharashtra',
    'Manipur',
    'Meghalaya',
    'Mizoram',
    'Nagaland',
    'Odisha',
    'Punjab',
    'Rajasthan',
    'Sikkim',
    'Tamil Nadu',
    'Telangana',
    'Tripura',
    'Uttar Pradesh',
    'Uttarakhand',
    'West Bengal',
    'Delhi',
    'Jammu and Kashmir',
    'Ladakh',
    'Puducherry',
    'Chandigarh',
  ];

  ngOnInit(): void {
    this.entityService.getAllEntities().subscribe({
      next: (ents) => this.entities.set(ents),
    });
  }

  onFilterChange(key: keyof QueryFilters, value: any): void {
    this.filterService.setFilter(key, value);
    this.filterChanged.emit(this.filterService.filters());
  }

  onReset(): void {
    this.filterService.resetFilters();
    this.filterChanged.emit(this.filterService.filters());
  }
}

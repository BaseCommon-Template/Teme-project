import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EntityService } from '../../../core/services/entity';
import { SubEntityService } from '../../../core/services/sub-entity';
import { UserService } from '../../../core/services/user';
import { DashboardService, DashboardStats } from '../../../core/services/dashboard';
import { Entity } from '../../../core/models/entity.model';
import { SubEntityFromAPI } from '../../../core/models/sub-entity.model';
import { UserFromAPI } from '../../../core/models/user.model';

@Component({
  selector: 'app-mis',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis.html',
  styleUrl: './mis.css',
})
export class MisComponent implements OnInit {
  private readonly entityService = inject(EntityService);
  private readonly subEntityService = inject(SubEntityService);
  private readonly userService = inject(UserService);
  private readonly dashboardService = inject(DashboardService);

  readonly stats = signal<DashboardStats | null>(null);
  readonly entities = signal<Entity[]>([]);
  readonly subEntities = signal<SubEntityFromAPI[]>([]);
  readonly users = signal<UserFromAPI[]>([]);

  ngOnInit(): void {
    this.dashboardService.getDashboardStats().subscribe({
      next: (s) => this.stats.set(s),
      error: () => {},
    });

    this.entityService.getAllEntities().subscribe({
      next: (ents) => this.entities.set(ents),
    });

    this.subEntityService.getAllSubEntities().subscribe({
      next: (subs) => this.subEntities.set(subs),
    });

    this.userService.getAllUsers().subscribe({
      next: (u) => this.users.set(u),
    });
  }

  countSubEntities(entityId: string): number {
    return this.subEntities().filter((s) => s.parent_entity_id === entityId).length;
  }

  countUsers(entityId: string): number {
    return this.users().filter((u) => u.entity_id === entityId).length;
  }
}

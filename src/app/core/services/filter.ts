import { Injectable, signal } from '@angular/core';

export interface QueryFilters {
  state: string;
  batch: string;
  branch: string;
  defence_force?: string;
  service_number?: string;
  age_group: string;
  rehab_status: string;
  hiredEntity: string;
  search: string | undefined;
  page: number | undefined;
  limit: number | undefined;
  is_export?: boolean;
  gender: string;
}

export const DEFAULT_FILTERS: QueryFilters = {
  state: '',
  batch: '',
  branch: '',
  defence_force: '',
  service_number: '',
  age_group: '',
  rehab_status: '',
  hiredEntity: '',
  search: '',
  page: 1,
  limit: 1000,
  is_export: false,
  gender: '',
};

@Injectable({
  providedIn: 'root',
})
export class FilterService {
  private readonly filtersSignal = signal<QueryFilters>({ ...DEFAULT_FILTERS });
  readonly filters = this.filtersSignal.asReadonly();

  setFilters(partial: Partial<QueryFilters>): void {
    this.filtersSignal.update((prev) => ({ ...prev, ...partial }));
  }

  setFilter(key: keyof QueryFilters, value: any): void {
    this.filtersSignal.update((prev) => ({ ...prev, [key]: value }));
  }

  resetFilters(): void {
    this.filtersSignal.set({ ...DEFAULT_FILTERS });
  }
}

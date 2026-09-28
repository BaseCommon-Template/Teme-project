import {
  Component,
  OnInit,
  inject,
  signal,
  computed,
  HostListener,
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { AgGridAngular } from 'ag-grid-angular';

import {
  ColDef,
  GridApi,
  GridReadyEvent,
  ModuleRegistry,
  AllCommunityModule,
  ICellRendererParams,
} from 'ag-grid-community';

import { OrganisationService } from '../../../services/organisation.service';
import { JobNotificationService } from '../../../services/notification/notification';
import { ScheduleService } from '../../../services/schedule/schedule';
import { CryptoHelper } from '../../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

// =====================================================
// FILTER TYPE
// =====================================================

type OrganizationFilter =
  | 'types'
  | 'organisations'
  | 'openings';

// =====================================================
// ORGANISATION TYPE
// =====================================================

export interface OrganizationTypeItem {
  organization_type_id: number;
  organization_type: string;
  short_code?: string;
  description?: string;
  type?: string;
  is_postmapping?: boolean;
  is_active: boolean;
  raw?: any;
}

// =====================================================
// ORGANISATION
// =====================================================

export interface OrganizationItem {
  organisation_id: number;
  organisation_name: string;
  short_name?: string;
  organisation_type_id?: number;
  organisation_type?: string;
  hq?: string;
  hq_city?: string;
  hq_state?: string;
  official_website_url?: string;
  is_active: boolean;
  raw?: any;
}

// =====================================================
// CURRENT OPENING
// =====================================================

export interface OpeningItem {
  srNo: number;
  advtNo: string;
  organisationName: string;
  title: string;
  round?: string | number | null;
  id?: string | number;
  raw?: any;
}

// =====================================================
// COMPONENT
// =====================================================

@Component({
  selector: 'app-organization-type-table',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AgGridAngular,
  ],
  templateUrl: './organization-type-table.html',
  styleUrl: './organization-type-table.css',
})
export class OrganizationTypeTable implements OnInit {

  private readonly route = inject(ActivatedRoute);

  private readonly organisationService =
    inject(OrganisationService);

  private readonly jobNotificationService =
    inject(JobNotificationService);

  private readonly scheduleService = inject(ScheduleService);

  // =====================================================
  // CURRENT FILTER
  // =====================================================

  readonly currentFilter =
    signal<OrganizationFilter>('types');

  // =====================================================
  // PAGE TITLE
  // =====================================================

  readonly pageTitle = computed(() => {

    switch (this.currentFilter()) {

      case 'organisations':
        return 'Organizations';

      case 'openings':
        return 'Current Openings';

      default:
        return 'Organisation Types';
    }

  });

  // =====================================================
  // SEARCH PLACEHOLDER
  // =====================================================

  readonly searchPlaceholder = computed(() => {

    switch (this.currentFilter()) {

      case 'organisations':
        return 'Search organizations...';

      case 'openings':
        return 'Search current openings...';

      default:
        return 'Search organisation types...';
    }

  });

  // =====================================================
  // DATA
  // =====================================================

  readonly rawRecords =
    signal<any[]>([]);

  readonly isLoading =
    signal<boolean>(false);

  readonly searchQuery =
    signal<string>('');

  // =====================================================
  // PAGINATION
  // =====================================================

  readonly pageNumber =
    signal<number>(1);

  readonly recordPerPage =
    signal<number>(20);

  readonly totalRecords =
    signal<number>(0);

  readonly totalPages =
    signal<number>(1);

  readonly Math = Math;

  // =====================================================
  // GRID
  // =====================================================

  gridApi?: GridApi<any>;

  rowHeight = 38;

  headerHeight = 30;

  defaultColDef: ColDef = {
    sortable: true,
    filter: true,
    resizable: true,
    minWidth: 100,
  };

  colDefs: ColDef<any>[] = [];

  // =====================================================
  // SEARCHED RECORDS
  // =====================================================

  readonly filteredRecords = computed(() => {

    const list = this.rawRecords();

    const q = this.searchQuery()
      .trim()
      .toLowerCase();

    if (!q) {
      return list;
    }

    return list.filter((item: any) => {

      const searchableText = [
        item.organization_type,
        item.organisation_type,
        item.organisation_name,
        item.organisationName,
        item.short_name,
        item.advtNo,
        item.title,
        item.hq_city,
        item.hq_state,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(q);
    });

  });

  // =====================================================
  // INIT
  // =====================================================

  ngOnInit(): void {

    this.route.queryParamMap.subscribe((params) => {

      const filter =
        params.get('filter');

      if (
        filter === 'types' ||
        filter === 'organisations' ||
        filter === 'openings'
      ) {

        this.currentFilter.set(filter);

      } else {

        this.currentFilter.set('types');
      }

      // Reset pagination/search
      this.pageNumber.set(1);
      this.searchQuery.set('');

      // Change columns
      this.setColumnDefinitions();

      // Load selected data
      this.loadData();

    });

  }

  // =====================================================
  // LOAD DATA BASED ON FILTER
  // =====================================================

  loadData(): void {

    switch (this.currentFilter()) {

      case 'organisations':
        this.fetchOrganisations();
        break;

      case 'openings':
        this.fetchCurrentOpenings();
        break;

      default:
        this.fetchOrganizationTypes();
        break;
    }

  }

  // =====================================================
  // REFRESH
  // =====================================================

  refresh(): void {

    this.pageNumber.set(1);

    this.loadData();

  }

  // =====================================================
  // COLUMN DEFINITIONS
  // =====================================================

  setColumnDefinitions(): void {

    // =====================================================
    // 1. ORGANISATION TYPES
    // =====================================================

    if (this.currentFilter() === 'types') {

      this.colDefs = [

        {
          headerName: 'SR. NO.',
          width: 100,
          minWidth: 90,
          maxWidth: 110,
          sortable: false,
          filter: false,
          resizable: false,

          valueGetter: (params) =>
            (params.node?.rowIndex ?? 0) + 1 +
            (this.pageNumber() - 1) *
            this.recordPerPage(),
        },

        {
          headerName: 'ORGANIZATION TYPE',
          field: 'organization_type',
          flex: 1.5,
          minWidth: 260,
        },

        {
          headerName: 'SHORT CODE',
          field: 'short_code',
          flex: 0.7,
          minWidth: 130,
        },

        {
          headerName: 'DESCRIPTION',
          field: 'description',
          flex: 1.5,
          minWidth: 260,
        },

        {
          headerName: 'TYPE',
          field: 'type',
          flex: 0.8,
          minWidth: 130,
        },

        {
          headerName: 'POST MAPPING',
          field: 'is_postmapping',
          flex: 0.9,
          minWidth: 150,

          cellRenderer: (params: ICellRendererParams) => {

            const value =
              this.toBoolean(params.value);

            return `
            <span class="post-mapping-pill ${value ? 'yes' : 'no'
              }">
              ${value ? 'Yes' : 'No'}
            </span>
          `;
          },
        },

      ];

      return;
    }


    // =====================================================
    // 2. ORGANISATIONS
    // =====================================================

    if (this.currentFilter() === 'organisations') {

      this.colDefs = [

        {
          headerName: 'SR. NO.',
          width: 100,
          minWidth: 90,
          maxWidth: 110,
          sortable: false,
          filter: false,
          resizable: false,

          valueGetter: (params) =>
            (params.node?.rowIndex ?? 0) + 1 +
            (this.pageNumber() - 1) *
            this.recordPerPage(),
        },

        {
          headerName: 'ORGANIZATION',
          field: 'organisation_name',
          flex: 1.5,
          minWidth: 250,
        },

        {
          headerName: 'ORGANIZATION TYPE',
          field: 'organisation_type',
          flex: 1.2,
          minWidth: 220,

          cellRenderer: (params: ICellRendererParams) => {

            return `
            <span class="organization-type-pill">
              ${this.escapeHtml(params.value ?? '-')}
            </span>
          `;
          },
        },

        {
          headerName: 'SHORT NAME',
          field: 'short_name',
          flex: 0.7,
          minWidth: 130,

          cellRenderer: (params: ICellRendererParams) => {

            return `
            <span class="short-name-pill">
              ${this.escapeHtml(params.value ?? '-')}
            </span>
          `;
          },
        },

        {
          headerName: 'HQ',
          field: 'hq',
          flex: 1.8,
          minWidth: 300,
        },

      ];

      return;
    }


    // =====================================================
    // 3. CURRENT OPENINGS
    // =====================================================

    this.colDefs = [

      {
        headerName: 'SR. NO.',
        width: 100,
        minWidth: 90,
        maxWidth: 110,
        sortable: false,
        filter: false,
        resizable: false,

        valueGetter: (params) =>
          (params.node?.rowIndex ?? 0) + 1 +
          (this.pageNumber() - 1) *
          this.recordPerPage(),
      },

      {
        headerName: 'TITLE',
        field: 'title',
        flex: 1.5,
        minWidth: 280,
      },

      {
        headerName: 'ADVT. NO',
        field: 'advtNo',
        flex: 1,
        minWidth: 200,
      },

      {
        headerName: 'ORGANIZATION NAME',
        field: 'organisationName',
        flex: 1.5,
        minWidth: 280,
      },

    ];

  }

  // =====================================================
  // FETCH ORGANISATION TYPES
  // =====================================================

  fetchOrganizationTypes(): void {

    this.isLoading.set(true);

    this.organisationService
      .getAll(undefined, 1, 1000)
      .subscribe({

        next: (res: any) => {

          try {

            const records =
              this.extractRecords(res);

            // ONLY ACTIVE TYPES
            const activeTypes =
              records
                .filter((item: any) => {

                  const isActive =
                    item.IsActive ??
                    item.isActive ??
                    item.isactive ??
                    item.is_active ??
                    item.Active ??
                    item.active;

                  return (
                    item.organisation_type_id != null &&
                    item.organisation_type &&
                    this.toBoolean(isActive)
                  );

                })
                .map((item: any) => ({

                  organization_type_id:
                    Number(item.organisation_type_id),

                  organization_type:
                    String(item.organisation_type ?? ''),

                  short_code:
                    String(
                      item.short_name ??
                      item.short_code ??
                      ''
                    ),

                  description:
                    String(
                      item.description ?? ''
                    ),

                  type:
                    String(
                      item.type ?? ''
                    ),

                  is_postmapping:
                    this.toBoolean(
                      item.is_postmapping ??
                      item.isPostMapping ??
                      item.is_post_mapping
                    ),

                  is_active: true,

                  raw: item,

                }));

            // REMOVE DUPLICATES
            const uniqueTypes =
              Array.from(
                new Map(
                  activeTypes.map((item: any) => [
                    item.organization_type_id,
                    item,
                  ])
                ).values()
              );

            this.setPaginatedData(
              uniqueTypes
            );

          } catch (error) {

            console.error(
              'Failed to parse organisation types:',
              error
            );

            this.clearData();
          }

        },

        error: (error: any) => {

          console.error(
            'OrganisationMaster GetAll API Error:',
            error
          );

          this.clearData();

        },

      });

  }

  // =====================================================
  // FETCH ORGANISATIONS
  // =====================================================
  // =====================================================
  // FETCH ORGANISATIONS
  // =====================================================

  fetchOrganisations(): void {

    this.isLoading.set(true);

    // -----------------------------------------
    // 1. GET ALL ORGANISATION TYPES
    // -----------------------------------------

    this.organisationService
      .getAll(undefined, 1, 1000)
      .subscribe({

        next: (res: any) => {

          try {

            const records =
              this.extractRecords(res);

            // -----------------------------------------
            // ACTIVE TYPES
            // -----------------------------------------

            const activeTypes =
              records.filter((type: any) => {

                const isActive =
                  type.IsActive ??
                  type.isActive ??
                  type.isactive ??
                  type.is_active ??
                  type.Active ??
                  type.active;

                // If API does not send active flag,
                // don't reject the type.
                if (isActive === undefined) {
                  return (
                    type.organisation_type_id != null &&
                    !!type.organisation_type
                  );
                }

                return (
                  type.organisation_type_id != null &&
                  !!type.organisation_type &&
                  this.toBoolean(isActive)
                );

              });

            if (activeTypes.length === 0) {


              this.clearData();
              return;

            }

            // -----------------------------------------
            // 2. GET ORGANISATIONS FOR EACH TYPE
            // -----------------------------------------

            const requests =
              activeTypes.map((type: any) => {

                const typeId =
                  Number(
                    type.organisation_type_id
                  );

                return this.organisationService
                  .getOrganisations(
                    typeId,
                    undefined,
                    1,
                    1000
                  );

              });

            forkJoin(requests)
              .subscribe({

                next: (responses: any[]) => {

                  const organisations:
                    OrganizationItem[] = [];

                  // -----------------------------------------
                  // 3. COMBINE ALL ORGANISATIONS
                  // -----------------------------------------

                  responses.forEach(
                    (
                      organisationRes: any,
                      index: number
                    ) => {

                      const type =
                        activeTypes[index];

                      const typeId =
                        Number(
                          type.organisation_type_id
                        );

                      const typeName =
                        String(
                          type.organisation_type ?? ''
                        );

                      const orgData =
                        this.extractOrganisationRecords(
                          organisationRes
                        );

                      orgData.forEach(
                        (org: any) => {

                          if (
                            org.organisation_id == null ||
                            !org.organisation_name
                          ) {
                            return;
                          }

                          const isActive =
                            org.IsActive ??
                            org.isActive ??
                            org.isactive ??
                            org.is_active ??
                            org.Active ??
                            org.active;

                          // -----------------------------------------
                          // ONLY ACTIVE ORGANISATIONS
                          // -----------------------------------------
                          //
                          // If API sends is_active,
                          // respect it.
                          //
                          // If API does NOT send it,
                          // don't hide the organisation.
                          // -----------------------------------------

                          if (
                            isActive !== undefined &&
                            !this.toBoolean(isActive)
                          ) {
                            return;
                          }

                          organisations.push({

                            organisation_id:
                              Number(
                                org.organisation_id
                              ),

                            organisation_name:
                              String(
                                org.organisation_name
                              ),

                            short_name:
                              org.short_name
                                ? String(
                                  org.short_name
                                )
                                : '',

                            organisation_type_id:
                              typeId,

                            organisation_type:
                              typeName,

                            hq_city:
                              org.hq_city
                                ? String(
                                  org.hq_city
                                )
                                : '',

                            hq_state:
                              org.hq_state
                                ? String(
                                  org.hq_state
                                )
                                : '',

                            hq:
                              [
                                org.hq_street_address,
                                org.hq_city,
                                org.hq_state,
                                org.hq_pincode
                              ]
                                .filter(Boolean)
                                .map(
                                  (value: any) =>
                                    String(value)
                                )
                                .join(', '),

                            official_website_url:
                              org.official_website_url
                                ? String(
                                  org.official_website_url
                                )
                                : '',

                            is_active:
                              isActive === undefined
                                ? true
                                : this.toBoolean(
                                  isActive
                                ),

                            raw: org,

                          });

                        }
                      );

                    }
                  );

                  this.setPaginatedData(organisations);

                },

                error: (error: any) => {

                  console.error(
                    'GetOrganisations API Error:',
                    error
                  );

                  this.clearData();

                },

              });

          } catch (error) {

            console.error(
              'Failed to process organisation types:',
              error
            );

            this.clearData();

          }

        },

        error: (error: any) => {

          console.error(
            'OrganisationMaster GetAll API Error:',
            error
          );

          this.clearData();

        },

      });

  }

  // =====================================================
  // EXTRACT ORGANISATIONS FROM GET ORGANISATIONS RESPONSE
  // =====================================================

  private extractOrganisationRecords(res: any): any[] {

    if (!res) {
      return [];
    }

    // -------------------------------------------------
    // Direct records
    // -------------------------------------------------

    if (Array.isArray(res?.records)) {
      return res.records;
    }

    if (Array.isArray(res?.Records)) {
      return res.Records;
    }

    // -------------------------------------------------
    // Direct organisations
    // -------------------------------------------------

    if (Array.isArray(res?.organisations)) {
      return res.organisations;
    }

    if (Array.isArray(res?.Organisations)) {
      return res.Organisations;
    }

    // -------------------------------------------------
    // Common wrappers
    // -------------------------------------------------

    const possibleContainers = [
      res?.Organisation,
      res?.organisation,
      res?.OrganisationMaster,
      res?.organisationMaster,
      res?.organisation_master,
      res?.data,
      res?.Data,
      res?.result,
      res?.Result,
      res?.decryptedData,
    ];

    for (const container of possibleContainers) {

      if (!container) {
        continue;
      }

      if (Array.isArray(container)) {
        return container;
      }

      if (Array.isArray(container?.records)) {
        return container.records;
      }

      if (Array.isArray(container?.Records)) {
        return container.Records;
      }

      if (Array.isArray(container?.organisations)) {
        return container.organisations;
      }

      if (Array.isArray(container?.Organisations)) {
        return container.Organisations;
      }

    }

    // -------------------------------------------------
    // Recursive fallback
    // -------------------------------------------------

    const findRecords = (obj: any): any[] => {

      if (!obj || typeof obj !== 'object') {
        return [];
      }

      if (Array.isArray(obj)) {
        return obj;
      }

      for (const key of Object.keys(obj)) {

        const value = obj[key];

        if (
          key.toLowerCase() === 'records' &&
          Array.isArray(value)
        ) {
          return value;
        }

        if (
          key.toLowerCase() === 'organisations' &&
          Array.isArray(value)
        ) {
          return value;
        }

        if (
          value &&
          typeof value === 'object'
        ) {

          const found = findRecords(value);

          if (found.length > 0) {
            return found;
          }

        }

      }

      return [];
    };

    const found = findRecords(res);

    return found;
  }
  // =====================================================
  // FETCH CURRENT OPENINGS
  // =====================================================

  fetchCurrentOpenings(): void {

    this.isLoading.set(true);

    // -----------------------------------------
    // 1. GET ACTIVE SCHEDULE
    // -----------------------------------------

    const schedulePayload = {};

    const encryptedSchedule =
      CryptoHelper.encrypt(
        JSON.stringify(schedulePayload)
      );

    const scheduleBody =
      JSON.stringify(encryptedSchedule);

    this.scheduleService
      .getActiveSchedule(scheduleBody)
      .subscribe({

        next: (scheduleRes: any) => {

          let activeSchedule: any = null;

          // -----------------------------------------
          // DECRYPT SCHEDULE
          // -----------------------------------------

          try {

            if (
              scheduleRes?.code === 1 &&
              scheduleRes?.data
            ) {

              const decrypted =
                CryptoHelper.decrypt(
                  scheduleRes.data
                );

              const scheduleData =
                JSON.parse(decrypted);

              const schedule =
                scheduleData?.Schedule ??
                scheduleData?.schedule ??
                scheduleData;

              if (
                schedule &&
                typeof schedule === 'object'
              ) {

                activeSchedule =
                  Array.isArray(schedule)
                    ? schedule[0]
                    : schedule;

              }

            }

          } catch (error) {

            console.error(
              'Error decrypting active schedule:',
              error
            );

          }

          // -----------------------------------------
          // 2. GET JOB NOTIFICATIONS
          // -----------------------------------------

          this.getCurrentOpeningNotifications(
            activeSchedule
          );

        },

        error: (error: any) => {

          console.error(
            'Active Schedule API Error:',
            error
          );

          // Even if schedule fails,
          // get published notifications.

          this.getCurrentOpeningNotifications(null);

        },

      });

  }

  private getCurrentOpeningNotifications(
    activeSchedule: any
  ): void {

    const payload = {
      page_number: 1,
      record_per_page: 1000,
    };

    const encrypted =
      CryptoHelper.encrypt(
        JSON.stringify(payload)
      );

    const bodyToSend =
      JSON.stringify(encrypted);

    this.jobNotificationService
      .getJobNotificationList(bodyToSend)
      .subscribe({

        next: (res: any) => {

          try {

            const data =
              this.decryptResponse(res);

            const list =
              Array.isArray(data)
                ? data
                : data?.list ??
                data?.records ??
                data?.JobNotifications ??
                data?.job_notifications ??
                data?.JobNotificationList ??
                data?.data ??
                [];

            if (!Array.isArray(list)) {

              this.clearData();
              return;

            }

            // -----------------------------------------
            // ACTIVE ROUND
            // -----------------------------------------

            const activeRound =
              activeSchedule?.Round ??
              activeSchedule?.round ??
              null;

            // -----------------------------------------
            // ONLY PUBLISHED
            // -----------------------------------------

            const published =
              list.filter(
                (item: any) =>
                  this.isItemPublished(item)
              );

            // -----------------------------------------
            // ONLY CURRENT ROUND
            // -----------------------------------------

            const currentOpenings =
              published.filter(
                (item: any) => {

                  // If active round is not available,
                  // keep published notifications.
                  if (
                    activeRound === null ||
                    activeRound === undefined
                  ) {
                    return true;
                  }

                  const itemRound =
                    item.round ??
                    item.Round ??
                    null;

                  return (
                    itemRound !== null &&
                    String(itemRound)
                      .trim()
                      .toLowerCase() ===
                    String(activeRound)
                      .trim()
                      .toLowerCase()
                  );

                }
              );

            // -----------------------------------------
            // MAP FOR TABLE
            // -----------------------------------------

            const mapped: OpeningItem[] =
              currentOpenings.map(
                (item: any, index: number) => ({

                  srNo: index + 1,

                  id:
                    item.id ??
                    item.job_notification_id ??
                    item.autoid ??
                    item.schedule_autoid,

                  advtNo:
                    item.advertisement_number ??
                    item.advt_no ??
                    item.AdvtNo ??
                    item.advtNo ??
                    'N/A',

                  organisationName:
                    item.organisation_name ??
                    item.organization ??
                    item.OrganisationName ??
                    'N/A',

                  title:
                    item.title ??
                    item.notification_title ??
                    item.job_title ??
                    item.JobTitle ??
                    'Untitled Notification',

                  round:
                    item.round ??
                    item.Round ??
                    null,

                  raw: item,

                })
              );

            this.setPaginatedData(mapped);

          } catch (error) {

            console.error(
              'Failed to parse current openings:',
              error
            );

            this.clearData();

          }

        },

        error: (error: any) => {

          console.error(
            'Job Notification API Error:',
            error
          );

          this.clearData();

        },

      });

  }

  // =====================================================
  // PAGINATION DATA
  // =====================================================

  private setPaginatedData(
    records: any[]
  ): void {

    this.totalRecords.set(
      records.length
    );

    const totalPages =
      records.length > 0
        ? Math.ceil(
          records.length /
          this.recordPerPage()
        )
        : 1;

    this.totalPages.set(
      totalPages
    );

    if (
      this.pageNumber() >
      totalPages
    ) {

      this.pageNumber.set(
        totalPages
      );

    }

    const start =
      (this.pageNumber() - 1) *
      this.recordPerPage();

    const end =
      start +
      this.recordPerPage();

    this.rawRecords.set(
      records.slice(start, end)
    );

    setTimeout(() => {

      this.gridApi?.sizeColumnsToFit();

    }, 50);

    this.isLoading.set(false);

  }

  // =====================================================
  // CLEAR DATA
  // =====================================================

  private clearData(): void {

    this.rawRecords.set([]);

    this.totalRecords.set(0);

    this.totalPages.set(1);

    this.isLoading.set(false);

  }

  // =====================================================
  // SEARCH
  // =====================================================

  onSearchChange(value: string): void {

    this.searchQuery.set(value);

    setTimeout(() => {

      this.gridApi?.sizeColumnsToFit();

    }, 50);

  }

  clearSearch(): void {

    this.searchQuery.set('');

  }

  // =====================================================
  // PAGINATION
  // =====================================================

  changePageSize(
    newSize: string | number
  ): void {

    const size =
      Number(newSize);

    if (
      !Number.isFinite(size) ||
      size <= 0
    ) {

      return;
    }

    this.recordPerPage.set(size);

    this.pageNumber.set(1);

    this.loadData();

  }

  goToNextPage(): void {

    if (
      this.pageNumber() >=
      this.totalPages()
    ) {

      return;
    }

    this.pageNumber.update(
      (p) => p + 1
    );

    this.loadData();

  }

  goToPreviousPage(): void {

    if (
      this.pageNumber() <= 1
    ) {

      return;
    }

    this.pageNumber.update(
      (p) => p - 1
    );

    this.loadData();

  }

  goToFirstPage(): void {

    if (
      this.pageNumber() <= 1
    ) {

      return;
    }

    this.pageNumber.set(1);

    this.loadData();

  }

  goToLastPage(): void {

    if (
      this.pageNumber() >=
      this.totalPages()
    ) {

      return;
    }

    this.pageNumber.set(
      this.totalPages()
    );

    this.loadData();

  }

  // =====================================================
  // GRID READY
  // =====================================================

  onGridReady(
    params: GridReadyEvent<any>
  ): void {

    this.gridApi =
      params.api;

    setTimeout(() => {

      this.gridApi?.sizeColumnsToFit();

    }, 100);

  }

  // =====================================================
  // RESIZE
  // =====================================================

  @HostListener('window:resize')
  onWindowResize(): void {

    this.gridApi?.sizeColumnsToFit();

  }

  // =====================================================
  // EXTRACT RECORDS
  // =====================================================

  private extractRecords(res: any): any[] {

    if (!res) {
      return [];
    }

    // -------------------------------------------------
    // 1. OrganisationService already decrypted response
    //    and merged it into the original response.
    // -------------------------------------------------

    const master =
      res?.OrganisationMaster ??
      res?.organisationMaster ??
      res?.organisation_master;

    if (Array.isArray(master?.records)) {
      return master.records;
    }

    // -------------------------------------------------
    // 2. Direct records
    // -------------------------------------------------

    if (Array.isArray(res?.records)) {
      return res.records;
    }

    if (Array.isArray(res?.Records)) {
      return res.Records;
    }

    // -------------------------------------------------
    // 3. decryptedData
    // -------------------------------------------------

    const decryptedData =
      res?.decryptedData;

    if (Array.isArray(decryptedData)) {
      return decryptedData;
    }

    if (Array.isArray(decryptedData?.records)) {
      return decryptedData.records;
    }

    const decryptedMaster =
      decryptedData?.OrganisationMaster ??
      decryptedData?.organisationMaster ??
      decryptedData?.organisation_master;

    if (Array.isArray(decryptedMaster?.records)) {
      return decryptedMaster.records;
    }

    // -------------------------------------------------
    // 4. Fallback to data
    // -------------------------------------------------

    const data =
      res?.data ??
      res?.Data;

    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.records)) {
      return data.records;
    }

    return [];
  }

  // =====================================================
  // PUBLISHED CHECK
  // =====================================================

  private isItemPublished(
    item: any
  ): boolean {

    const val =
      item.is_publish ??
      item.is_published ??
      item.isPublish ??
      item.isPublished ??
      item.is_notification_published ??
      item.is_job_notification_published;

    return (
      val === true ||
      val === 1 ||
      val === '1' ||
      val === 'true' ||
      val === 'True'
    );

  }

  // =====================================================
  // DECRYPT RESPONSE
  // =====================================================
  private decryptResponse(res: any): any {

    if (!res) {
      return null;
    }

    if (
      res.decryptedData !== undefined
    ) {
      return res.decryptedData;
    }

    let data =
      res?.data ??
      res?.Data ??
      res;

    if (typeof data === 'string') {

      try {

        const decrypted =
          CryptoHelper.decrypt(data);

        try {
          return JSON.parse(decrypted);
        } catch {
          return decrypted;
        }

      } catch (error) {

        console.warn(
          'Response decryption failed:',
          error
        );

        return data;

      }

    }

    return data;

  }

  // =====================================================
  // BOOLEAN
  // =====================================================

  private toBoolean(
    value: any
  ): boolean {

    if (
      value === true ||
      value === 1
    ) {

      return true;
    }

    if (
      typeof value === 'string'
    ) {

      const normalized =
        value
          .trim()
          .toLowerCase();

      return [
        'true',
        '1',
        'yes',
        'y',
        'active',
        'enabled',
      ].includes(
        normalized
      );

    }

    return false;

  }

  // =====================================================
  // ESCAPE HTML
  // =====================================================

  private escapeHtml(
    value: any
  ): string {

    return String(
      value ?? ''
    )
      .replace(
        /&/g,
        '&amp;'
      )
      .replace(
        /</g,
        '&lt;'
      )
      .replace(
        />/g,
        '&gt;'
      )
      .replace(
        /"/g,
        '&quot;'
      )
      .replace(
        /'/g,
        '&#039;'
      );

  }

}
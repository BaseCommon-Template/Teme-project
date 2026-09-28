import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  inject,
  signal,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import {
  ColDef,
  GridApi,
  GridReadyEvent,
  CellClickedEvent,
  ICellRendererParams,
  ModuleRegistry,
  AllCommunityModule,
} from 'ag-grid-community';
import Swal from 'sweetalert2';
import {
  PostMasterService,
  PostMasterPayload,
  DefencePostMappingPayload,
} from '../../services/post-master.service';
import { AgniveerUploadService } from '../../services/agniveer-upload/agniveer-upload';
import { CryptoHelper } from '../../helpers/crypto-helper';

ModuleRegistry.registerModules([AllCommunityModule]);

export interface DefencePostMappingItem {
  postname: string;
  branch: string;
  defence_autoid?: number;
}

export interface AgniveerGroupOption {
  branch: string;
  posts: string[];
}

export interface PostDropdownOption {
  post_autoid: number;
  post_name: string;
  post_code: string;
  displayName: string;
}

export interface PostMappingRowItem {
  id: number;
  postmaster_autoid: number;
  post_autoid?: number;
  srNo: number;
  postName: string;
  organization: string;
  organizationFullName: string;
  organisation_type_id: number;
  organisation_type: string;
  short_name: string;
  organisation_id: number;
  organisation_name: string;
  organisation_short_name: string;
  defence_post_mappings: DefencePostMappingItem[];
  mappings: {
    branch: string;
    posts: string[];
  }[];
  createdAt: string;
  active: boolean;
}

export interface OrganisationDropdownOption {
  organisation_type_id: number;
  organisation_type: string;
  short_name: string; // type short name, e.g. "CAPF"
  organisation_id: number;
  organisation_name: string;
  organisation_short_name: string; // org short name, e.g. "CRPF"
  displayName: string;
}

@Component({
  selector: 'app-postmapping',
  standalone: true,
  imports: [CommonModule, FormsModule, AgGridAngular, RouterLink],
  templateUrl: './postmapping.html',
  styleUrl: './postmapping.css',
})
export class Postmapping implements OnInit, AfterViewInit {
  private gridApi!: GridApi<PostMappingRowItem>;
  private readonly postMasterService = inject(PostMasterService);
  private readonly agniveerUploadService = inject(AgniveerUploadService);
  private readonly cdr = inject(ChangeDetectorRef);

  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  @ViewChild('firstFormInput') firstFormInput!: ElementRef<HTMLSelectElement>;

  searchText = signal('');
  pageSize = signal(20);
  isModalOpen = signal(false);
  isEditMode = signal(false);
  isLoading = signal(false);
  showActiveOnly = signal(true);

  currentPage = 1;
  totalRecords = 0;
  totalPages = 0;

  selectedAgniveerPost = '';

  formData = {
    id: 0,
    postmaster_autoid: 0,
    post_autoid: 0,
    postName: '',
    active: true,
    organization: '',
    agniveerPosts: [] as DefencePostMappingItem[],
  };

  postsList: PostDropdownOption[] = [];
  postOptions: string[] = [];

  organisationsList: OrganisationDropdownOption[] = [];
  organizationOptions: string[] = [];

  agniveerPostMasterList: { postName: string; branch: string }[] = [];
  agniveerPostGroups: AgniveerGroupOption[] = [];
  agniveerPostOptions: string[] = [];

  rowData: PostMappingRowItem[] = [];
  filteredRowData = signal<PostMappingRowItem[]>([]);

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }



  colDefs: ColDef<PostMappingRowItem>[] = [
    {
      headerName: 'SR. NO.',
      width: 80,
      minWidth: 80,
      valueGetter: (params) => {
        if (params.node?.rowIndex == null) return '';
        return (this.currentPage - 1) * this.pageSize() + params.node.rowIndex + 1;
      },
      sortable: true,
      filter: true,
    },
    {
      headerName: 'POST',
      field: 'postName',
      width: 270,
      sortable: true,
      filter: true,
      cellClass: 'post-badge',
    },
    {
      headerName: 'ORGANIZATION',
      field: 'organization',
      width: 190,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<PostMappingRowItem>) => {
        if (!params.data) return '';
        return `
          <div>
            <span class="organization-badge">${params.data.organization}</span>
            <span class="sub-text">${params.data.organizationFullName}</span>
          </div>
        `;
      },
    },
    {
      headerName: 'AGNIVEER POST MAPPINGS',
      field: 'mappings',
      flex: 1,
      minWidth: 330,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<PostMappingRowItem>) => {
        const mappings = params.value || [];

        return mappings
          .map(
            (mapping: any) => `
            <div style="margin: 2px 0 5px;">
              <div style="
                font-size:11px;
                font-weight:700;
                letter-spacing:.5px;
                margin-bottom:3px;
                color:#394555;
              ">
                ${mapping.branch}
              </div>
              <div>
                ${(mapping.posts || [])
                .map(
                  (post: string) => `
                  <span class="mapping-badge" style="margin-right:5px;">
                    ${post}
                  </span>
                `
                )
                .join('')}
              </div>
            </div>
          `
          )
          .join('');
      },
      autoHeight: true,
    },
    {
      field: 'active',
      headerName: 'STATUS',
      width: 140,
      minWidth: 115,
      maxWidth: 140,
      sortable: true,
      filter: true,
      cellRenderer: (params: ICellRendererParams<PostMappingRowItem>) => {
        const isActive = params.value !== false;
        return `
          <div style="
            width:100%;
            height:100%;
            display:flex;
            align-items:center;
            justify-content:flex-start;
            box-sizing:border-box;
            padding-left:4px;
          ">
            <span style="
              display:inline-flex;
              align-items:center;
              justify-content:center;
              gap:7px;
              min-width:76px;
              height:26px;
              padding:0 11px;
              box-sizing:border-box;
              border-radius:14px;
              ${isActive
            ? `
                    background:#ecfdf5;
                    border:1px solid #86efac;
                    color:#059669;
                  `
            : `
                    background:#fff1f2;
                    border:1px solid #fda4af;
                    color:#e11d48;
                  `
          }
              font-size:11px;
              font-weight:600;
              line-height:1;
              white-space:nowrap;
            ">
              <span style="
                width:7px;
                height:7px;
                flex-shrink:0;
                border-radius:50%;
                background:${isActive ? '#10b981' : '#f43f5e'};
              "></span>
              <span>${isActive ? 'Active' : 'Inactive'}</span>
            </span>
          </div>
        `;
      },
    },
    {
      headerName: 'ACTIONS',
      width: 125,
      sortable: false,
      filter: false,
      cellRenderer: (params: ICellRendererParams<PostMappingRowItem>) => {
        const id = params.data?.postmaster_autoid || params.data?.id;
        return `
          <div style="
            display:flex;
            align-items:center;
            justify-content:flex-start;
            gap:8px;
            height:100%;
            padding-left:4px;
            box-sizing:border-box;
          ">
            <button
              class="action-btn edit-btn"
              title="Edit"
              data-action="edit"
              data-id="${id}"
              style="
                width:30px;
                height:30px;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:0;
                border:1px solid #dbeafe;
                border-radius:6px;
                background:#eff6ff;
                color:#2563eb;
                cursor:pointer;
              "
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 20h9"></path>
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"></path>
              </svg>
            </button>

            <button
              class="action-btn delete-btn"
              title="Delete"
              data-action="delete"
              data-id="${id}"
              style="
                width:30px;
                height:30px;
                display:flex;
                align-items:center;
                justify-content:center;
                padding:0;
                border:1px solid #fee2e2;
                border-radius:6px;
                background:#fef2f2;
                color:#dc2626;
                cursor:pointer;
              "
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 6h18"></path>
                <path d="M8 6V4h8v2"></path>
                <path d="M19 6v14H5V6"></path>
                <path d="M10 11v6"></path>
                <path d="M14 11v6"></path>
              </svg>
            </button>
          </div>
        `;
      },
    },
  ];

  defaultColDef: ColDef = {
    resizable: true,
    sortable: true,
    filter: true,
  };

  rowHeight = 60;
  headerHeight = 30;

  ngOnInit(): void {
    this.loadPostMasters();
    this.loadOrganisations();
    this.loadPostOptions();
    this.loadAgniveerPostOptions();
  }

  loadPostOptions(): void {
    this.postMasterService.getAllPosts(1, 1000).subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;

        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('Post GetAll Decryption Error:', err);
          }
        }

        const isNotFound = res?.code === 0 || data?.code === 0 || res?.message === 'Record not found' || data?.message === 'Record not found';

        if (isNotFound) {
          this.postsList = [];
          this.postOptions = [];
          this.cdr.detectChanges();
          return;
        }

        const postsObj = data?.Posts || data?.posts || data;
        const records: any[] = Array.isArray(postsObj?.records)
          ? postsObj.records
          : Array.isArray(postsObj)
            ? postsObj
            : Array.isArray(data?.records)
              ? data.records
              : Array.isArray(data)
                ? data
                : [];

        const list: PostDropdownOption[] = [];
        const namesSet = new Set<string>();

        records.forEach((r: any, idx: number) => {
          const autoId = Number(r.post_autoid ?? r.post_id ?? r.id ?? (idx + 1));
          const name = (r.post_name || r.postName || '').trim();
          const code = (r.post_code || r.postCode || '').trim();
          if (name) {
            namesSet.add(name);
            list.push({
              post_autoid: autoId,
              post_name: name,
              post_code: code,
              displayName: code ? `${name} (${code})` : name,
            });
          }
        });

        this.postsList = list;
        this.postOptions = Array.from(namesSet);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading post options:', err);
        this.postsList = [];
        this.postOptions = [];
        this.cdr.detectChanges();
      },
    });
  }

  onPostChange(selectedPostName: string): void {
    const match = this.postsList.find((p) => p.post_name === selectedPostName);
    if (match) {
      this.formData.post_autoid = match.post_autoid;
      this.formData.postName = match.post_name;
    }
  }

  loadAgniveerPostOptions(): void {
    this.agniveerUploadService.getPostMaster().subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;

        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('Agniveer Post Master decryption error:', err);
          }
        }

        const isNotFound = res?.code === 0 || data?.code === 0 || res?.message === 'Record not found' || data?.message === 'Record not found';

        if (isNotFound) {
          this.agniveerPostMasterList = [];
          this.agniveerPostGroups = [];
          this.agniveerPostOptions = [];
          this.cdr.detectChanges();
          return;
        }

        const records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : [];

        const list: { postName: string; branch: string }[] = [];
        const groupsMap = new Map<string, Set<string>>();

        records.forEach((item: any) => {
          const name = (item.PostName ?? item.post_name ?? item.postName ?? '').trim();
          const branch = (item.Branch ?? item.branch ?? 'Indian Army').trim();

          if (name) {
            list.push({ postName: name, branch });
            if (!groupsMap.has(branch)) {
              groupsMap.set(branch, new Set<string>());
            }
            groupsMap.get(branch)!.add(name);
          }
        });

        this.agniveerPostMasterList = list;

        const groups: AgniveerGroupOption[] = [];
        groupsMap.forEach((postsSet, branchName) => {
          groups.push({
            branch: branchName,
            posts: Array.from(postsSet).sort(),
          });
        });

        this.agniveerPostGroups = groups.sort((a, b) => a.branch.localeCompare(b.branch));
        this.agniveerPostOptions = Array.from(new Set(list.map((l) => l.postName)));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading Agniveer post options:', err);
        this.agniveerPostMasterList = [];
        this.agniveerPostGroups = [];
        this.agniveerPostOptions = [];
        this.cdr.detectChanges();
      },
    });
  }

  loadOrganisations(): void {
    this.postMasterService.getAllOrganisations(1, 1000).subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;

        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('Organisation Decryption Error:', err);
          }
        }

        const isNotFound = res?.code === 0 || data?.code === 0 || res?.message === 'Record not found' || data?.message === 'Record not found';

        if (isNotFound) {
          this.organisationsList = [];
          this.organizationOptions = [];
          this.cdr.detectChanges();
          return;
        }

        const orgMaster = data?.OrganisationMaster || data?.organisationMaster || data;
        const typeRecords: any[] = Array.isArray(orgMaster?.records)
          ? orgMaster.records
          : Array.isArray(orgMaster)
            ? orgMaster
            : [];

        const list: OrganisationDropdownOption[] = [];

        typeRecords.forEach((typeObj: any) => {
          const typeId = typeObj.organisation_type_id || typeObj.type_id || 1;
          const typeName = typeObj.organisation_type || typeObj.type_name || 'Central Armed Police Force';
          const typeShort = typeObj.short_name || typeObj.type_short || 'CAPF';

          const orgs = Array.isArray(typeObj.organisations) ? typeObj.organisations : [];

          orgs.forEach((org: any) => {
            if (org.organisation_name) {
              const displayName = org.short_name
                ? `${org.organisation_name} (${org.short_name})`
                : org.organisation_name;

              list.push({
                organisation_type_id: typeId,
                organisation_type: typeName,
                short_name: typeShort,
                organisation_id: org.organisation_id || 0,
                organisation_name: org.organisation_name,
                organisation_short_name: org.short_name || org.organisation_short_name || '',
                displayName: displayName,
              });
            }
          });
        });

        this.organisationsList = list;
        this.organizationOptions = list.map((o) => o.displayName);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Load Organisations Error:', err);
        this.organisationsList = [];
        this.organizationOptions = [];
        this.cdr.detectChanges();
      },
    });
  }

  loadPostMasters(page: number = this.currentPage, limit: number = this.pageSize()): void {
    this.isLoading.set(true);

    this.postMasterService.getPostMastersList(page, limit).subscribe({
      next: (res: any) => {
        let data: any = res?.data ?? res;

        if (typeof data === 'string') {
          try {
            const decrypted = CryptoHelper.decrypt(data);
            data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
          } catch (err) {
            console.error('PostMaster Decryption Error:', err);
          }
        }

        let records: any[] = Array.isArray(data)
          ? data
          : Array.isArray(data?.records)
            ? data.records
            : Array.isArray(data?.data)
              ? data.data
              : [];

        this.totalRecords = Number(data?.total_records ?? records.length);
        this.currentPage = Number(data?.page_number ?? page);
        this.totalPages = Number(data?.total_pages ?? Math.ceil(this.totalRecords / limit)) || 1;

        this.rowData = records.map((item: any, index: number): PostMappingRowItem => {
          const autoId = item.postmaster_autoid || item.id || index + 1;
          const postAutoId = Number(item.post_autoid || item.post_id || 0);
          const rawMappings: DefencePostMappingItem[] = Array.isArray(item.defence_post_mappings)
            ? item.defence_post_mappings.map((m: any) => ({
              postname: m.postname ?? m.post_name ?? '',
              branch: (m.branch || 'Indian Army').toUpperCase(),
              defence_autoid: m.defence_autoid,
            }))
            : [];

          const groupedMappings = this.formatMappings(rawMappings);

          const orgShort = item.organisation_short_name || item.short_name || 'CRPF';
          const orgName = item.organisation_name || item.organisation_type || 'Central Reserve Police Force';

          return {
            id: autoId,
            postmaster_autoid: autoId,
            post_autoid: postAutoId,
            srNo: (this.currentPage - 1) * limit + index + 1,
            postName: item.post_name || '',
            organization: orgShort,
            organizationFullName: orgName,
            organisation_type_id: item.organisation_type_id || 1,
            organisation_type: item.organisation_type || 'Central Armed Police Force',
            short_name: item.short_name || 'CAPF',
            organisation_id: item.organisation_id || 1,
            organisation_name: orgName,
            organisation_short_name: orgShort,
            defence_post_mappings: rawMappings,
            mappings: groupedMappings,
            createdAt: this.formatDate(item.createdAt ? new Date(item.createdAt) : new Date()),
            active: item.is_active ?? item.IsActive ?? (item.active !== false),
          };
        });

        this.applyPostMappingView();

        this.isLoading.set(false);
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('PostMaster List Error:', error);
        this.isLoading.set(false);
      },
    });
  }

  private formatMappings(defencePostMappings: DefencePostMappingItem[]) {
    const branchMap = new Map<string, string[]>();
    (defencePostMappings || []).forEach((m) => {
      const branch = (m.branch || 'INDIAN ARMY').toUpperCase();
      if (!branchMap.has(branch)) {
        branchMap.set(branch, []);
      }
      if (m.postname && !branchMap.get(branch)!.includes(m.postname)) {
        branchMap.get(branch)!.push(m.postname);
      }
    });

    return Array.from(branchMap.entries()).map(([branch, posts]) => ({
      branch,
      posts,
    }));
  }

  applyPostMappingView(): void {
    const search = this.searchText().trim().toLowerCase();
    const activeOnly = this.showActiveOnly();

    let list = this.rowData;
    if (activeOnly) {
      list = list.filter((item) => item.active !== false);
    }

    if (search) {
      list = list.filter(
        (item) =>
          item.postName.toLowerCase().includes(search) ||
          item.organization.toLowerCase().includes(search) ||
          item.organizationFullName.toLowerCase().includes(search) ||
          item.mappings.some(
            (mapping) =>
              mapping.branch.toLowerCase().includes(search) ||
              mapping.posts.some((post) => post.toLowerCase().includes(search))
          )
      );
    }

    this.filteredRowData.set(list);

    if (this.gridApi) {
      this.gridApi.setGridOption('rowData', this.filteredRowData());
    }
  }

  onGridReady(event: GridReadyEvent<PostMappingRowItem>): void {
    this.gridApi = event.api;
    if (this.filteredRowData().length > 0) {
      this.gridApi.setGridOption('rowData', this.filteredRowData());
    }
  }

  onSearchChange(value: string): void {
    this.searchText.set(value);
    this.applyPostMappingView();
  }

  toggleActiveFilter(): void {
    this.showActiveOnly.update((v) => !v);
    this.applyPostMappingView();
  }

  readonly Math = Math;

  changePageSize(value: number | string): void {
    const size = Number(value);
    if (!size) return;
    this.pageSize.set(size);
    this.currentPage = 1;
    this.loadPostMasters(1, size);
  }

  onPageSizeChange(value: number | string): void {
    this.changePageSize(value);
  }

  goToFirstPage(): void {
    if (this.currentPage === 1) return;
    this.currentPage = 1;
    this.loadPostMasters(1, this.pageSize());
  }

  goToPreviousPage(): void {
    if (this.currentPage <= 1) return;
    this.currentPage--;
    this.loadPostMasters(this.currentPage, this.pageSize());
  }

  goToNextPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage++;
    this.loadPostMasters(this.currentPage, this.pageSize());
  }

  goToLastPage(): void {
    if (this.currentPage >= this.totalPages) return;
    this.currentPage = this.totalPages;
    this.loadPostMasters(this.currentPage, this.pageSize());
  }

  exportCsv(): void {
    if (this.gridApi) {
      this.gridApi.exportDataAsCsv({
        fileName: 'post-mapping-master.csv',
      });
    }
  }

  openAddModal(): void {
    this.isEditMode.set(false);
    this.selectedAgniveerPost = '';

    this.formData = {
      id: 0,
      postmaster_autoid: 0,
      post_autoid: 0,
      postName: '',
      active: true,
      organization: '',
      agniveerPosts: [],
    };

    this.isModalOpen.set(true);
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  openEditModal(row: PostMappingRowItem): void {
    // console.log('========== OPEN EDIT MODAL ROW DATA ==========', row);
    this.isEditMode.set(true);
    this.selectedAgniveerPost = '';

    const rowPostAutoId = Number((row as any).post_autoid || (row as any).post_id || row.post_autoid || 0);
    const postName = (row.postName || (row as any).post_name || '').trim();

    let matchedPost = this.postsList.find(
      (p) =>
        (rowPostAutoId > 0 && p.post_autoid === rowPostAutoId) ||
        p.post_name.toLowerCase().trim() === postName.toLowerCase()
    );

    if (matchedPost) {
      this.formData.post_autoid = matchedPost.post_autoid;
      this.formData.postName = matchedPost.post_name;
    } else if (postName) {
      const fallbackAutoId = rowPostAutoId || 1;
      this.postsList = [
        {
          post_autoid: fallbackAutoId,
          post_name: postName,
          post_code: '',
          displayName: postName,
        },
        ...this.postsList,
      ];
      this.formData.post_autoid = fallbackAutoId;
      this.formData.postName = postName;
    } else {
      this.formData.post_autoid = 0;
      this.formData.postName = '';
    }

    let orgValue = row.organization || row.organisation_short_name || '';
    const matchedOrg = this.organisationsList.find(
      (o) =>
        o.displayName === orgValue ||
        o.organisation_short_name?.toLowerCase() === orgValue.toLowerCase() ||
        o.organisation_name?.toLowerCase() === (row.organizationFullName || row.organisation_name || '').toLowerCase() ||
        o.organisation_short_name?.toLowerCase() === (row.organisation_short_name || '').toLowerCase() ||
        o.displayName.toLowerCase().includes(orgValue.toLowerCase())
    );

    if (matchedOrg) {
      orgValue = matchedOrg.displayName;
    }

    if (orgValue) {
      const match = this.organizationOptions.find((o) => o.toLowerCase().trim() === orgValue.toLowerCase().trim());
      if (match) {
        this.formData.organization = match;
      } else {
        this.organizationOptions = [orgValue, ...this.organizationOptions];
        this.formData.organization = orgValue;
      }
    } else {
      this.formData.organization = '';
    }

    const defenceMappings: DefencePostMappingItem[] = [];

    if (Array.isArray(row.defence_post_mappings) && row.defence_post_mappings.length > 0) {
      row.defence_post_mappings.forEach((m: any) => {
        const name = (m.postname ?? m.post_name ?? m.postName ?? '').trim();
        const branch = (m.branch || 'Indian Army').trim();
        if (name) {
          defenceMappings.push({
            postname: name,
            branch: branch,
            defence_autoid: m.defence_autoid || m.id,
          });
        }
      });
    }

    if (defenceMappings.length === 0 && Array.isArray(row.mappings) && row.mappings.length > 0) {
      row.mappings.forEach((m: any) => {
        const branch = (m.branch || 'Indian Army').trim();
        (m.posts || []).forEach((p: any) => {
          const name = typeof p === 'string' ? p.trim() : (p.postname ?? p.post_name ?? p.postName ?? '').trim();
          if (name) {
            defenceMappings.push({
              postname: name,
              branch: branch,
            });
          }
        });
      });
    }

    this.formData = {
      id: row.id || row.postmaster_autoid || 0,
      postmaster_autoid: row.postmaster_autoid || row.id || 0,
      post_autoid: this.formData.post_autoid,
      postName: this.formData.postName,
      organization: this.formData.organization,
      active: row.active !== false,
      agniveerPosts: defenceMappings,
    };

    this.isModalOpen.set(true);
    this.cdr.detectChanges();
    setTimeout(() => this.firstFormInput?.nativeElement?.focus(), 100);
  }

  addAgniveerPost(value: string): void {
    if (!value) {
      return;
    }

    const exists = this.formData.agniveerPosts.some((p) => p.postname === value);
    if (!exists) {
      let branch = '';

      for (const group of this.agniveerPostGroups) {
        if (group.posts.includes(value)) {
          branch = group.branch;
          break;
        }
      }

      if (!branch) {
        const match = this.agniveerPostMasterList.find((item) => item.postName === value);
        branch = match ? match.branch : 'Indian Army';
      }

      this.formData.agniveerPosts.push({
        postname: value,
        branch: branch,
      });
    }

    this.selectedAgniveerPost = '';
  }

  removeAgniveerPost(index: number): void {
    this.formData.agniveerPosts.splice(index, 1);
  }

  onCellClicked(event: CellClickedEvent<PostMappingRowItem>): void {
    const target = event.event?.target as HTMLElement;
    const button = target?.closest('button');
    if (!button) return;

    const action = button.getAttribute('data-action');
    const id = button.getAttribute('data-id');
    const item = event.data || this.rowData.find(
      (r) => String(r.postmaster_autoid) === String(id) || String(r.id) === String(id)
    );

    if (action === 'edit' && item) {
      this.openEditModal(item);
    } else if (action === 'delete' && item) {
      this.confirmDelete(item);
    }
  }

  saveMapping(): void {
    if (
      !this.formData.postName ||
      !this.formData.organization ||
      this.formData.agniveerPosts.length === 0
    ) {
      Swal.fire({
        icon: 'warning',
        title: 'Required Fields',
        text: 'Please select Post, Organization, and add at least one Agniveer Post.',
      });
      return;
    }

    const selectedPost = this.postsList.find(
      (p) =>
        (this.formData.post_autoid > 0 && p.post_autoid === this.formData.post_autoid) ||
        p.post_name.toLowerCase().trim() === this.formData.postName.toLowerCase().trim()
    );

    const postAutoId = selectedPost?.post_autoid || Number(this.formData.post_autoid) || 1;
    const postCode = selectedPost?.post_code || '';
    const finalPostName = (this.formData.postName || selectedPost?.post_name || '').trim();

    const selectedOrg = this.organisationsList.find(
      (o) =>
        o.displayName === this.formData.organization ||
        o.organisation_name === this.formData.organization ||
        o.organisation_short_name === this.formData.organization
    ) || {
      organisation_type_id: 1,
      organisation_type: 'Central Armed Police Force',
      short_name: 'CAPF',
      organisation_id: 1,
      organisation_name: this.formData.organization,
      organisation_short_name: 'CRPF',
      displayName: this.formData.organization,
    };

    this.isLoading.set(true);

    const parseResponse = (res: any): any => {
      let data: any = res?.data ?? res;
      if (typeof data === 'string') {
        try {
          const decrypted = CryptoHelper.decrypt(data);
          data = typeof decrypted === 'string' ? JSON.parse(decrypted) : decrypted;
        } catch (e) { }
      }
      return data;
    };

    if (this.isEditMode()) {
      const payload: PostMasterPayload = {
        postmaster_autoid: Number(this.formData.postmaster_autoid) || Number(this.formData.id),
        post_autoid: Number(postAutoId),
        post_autoId: Number(postAutoId),
        post_id: Number(postAutoId),
        post_name: finalPostName,
        post_code: postCode,
        defence_post_mappings: this.formData.agniveerPosts.map((p) => ({
          postname: p.postname,
          branch: p.branch || 'Indian Army',
          ...(p.defence_autoid ? { defence_autoid: p.defence_autoid } : {}),
        })),
        organisation_type_id: Number(selectedOrg.organisation_type_id || 1),
        organisation_type: selectedOrg.organisation_type || 'Central Armed Police Force',
        short_name: selectedOrg.short_name || 'CAPF',
        organisation_id: Number(selectedOrg.organisation_id || 1),
        organisation_name: selectedOrg.organisation_name,
        organisation_short_name: selectedOrg.organisation_short_name || selectedOrg.short_name || 'CRPF',
        is_active: !!this.formData.active,
      };

      this.postMasterService.updatePostMaster(payload).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          const data = parseResponse(res);
          if (res?.code === 0 || res?.status === false || data?.code === 0 || data?.status === false) {
            Swal.fire({
              icon: 'warning',
              title: 'Update Failed',
              text: data?.message || res?.message || 'Failed to update post mapping.',
            });
            return;
          }
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Updated',
            text: data?.message || `Post "${this.formData.postName}" updated successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadPostMasters(this.currentPage, this.pageSize());
        },
        error: (err) => {
          console.error('Update PostMaster error:', err);
          this.isLoading.set(false);
          const msg = err?.error?.message || err?.message || 'Failed to update post mapping on server.';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: msg,
          });
        },
      });
    } else {
      const payload: PostMasterPayload = {
        post_autoid: Number(postAutoId),
        post_autoId: Number(postAutoId),
        post_id: Number(postAutoId),
        post_name: finalPostName,
        post_code: postCode,
        defence_post_mappings: this.formData.agniveerPosts.map((p) => ({
          postname: p.postname,
          branch: p.branch || 'Indian Army',
        })),
        organisation_type_id: Number(selectedOrg.organisation_type_id || 1),
        organisation_type: selectedOrg.organisation_type || 'Central Armed Police Force',
        short_name: selectedOrg.short_name || 'CAPF',
        organisation_id: Number(selectedOrg.organisation_id || 1),
        organisation_name: selectedOrg.organisation_name,
        organisation_short_name: selectedOrg.organisation_short_name || selectedOrg.short_name || 'CRPF',
        is_active: !!this.formData.active,
      };

      this.postMasterService.addPostMaster(payload).subscribe({
        next: (res: any) => {
          this.isLoading.set(false);
          const data = parseResponse(res);
          if (res?.code === 0 || res?.status === false || data?.code === 0 || data?.status === false) {
            Swal.fire({
              icon: 'warning',
              title: 'Creation Failed',
              text: data?.message || res?.message || 'Failed to create post mapping.',
            });
            return;
          }
          this.closeModal();
          Swal.fire({
            icon: 'success',
            title: 'Created',
            text: data?.message || `Post "${this.formData.postName}" added successfully.`,
            timer: 2000,
            showConfirmButton: false,
          });
          this.loadPostMasters(1, this.pageSize());
        },
        error: (err) => {
          console.error('Add PostMaster error:', err);
          this.isLoading.set(false);
          const msg = err?.error?.message || err?.message || 'Failed to create post mapping on server.';
          Swal.fire({
            icon: 'error',
            title: 'Error',
            text: msg,
          });
        },
      });
    }
  }

  confirmDelete(row: PostMappingRowItem): void {
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to delete post mapping for "${row.postName}"?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Yes, Delete',
      cancelButtonText: 'Cancel',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);
        this.postMasterService.deletePostMaster(row.postmaster_autoid).subscribe({
          next: () => {
            this.isLoading.set(false);
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: `Post mapping "${row.postName}" has been deleted.`,
              timer: 2000,
              showConfirmButton: false,
            });
            this.loadPostMasters();
          },
          error: (err) => {
            console.error('Delete PostMaster error:', err);
            this.isLoading.set(false);
            this.rowData = this.rowData.filter((r) => r.postmaster_autoid !== row.postmaster_autoid);
            this.filteredRowData.set([...this.rowData]);
            if (this.gridApi) this.gridApi.setGridOption('rowData', this.filteredRowData());
            Swal.fire({
              icon: 'success',
              title: 'Deleted',
              text: `Post mapping "${row.postName}" has been deleted.`,
              timer: 2000,
              showConfirmButton: false,
            });
          },
        });
      }
    });
  }

  closeModal(): void {
    this.isModalOpen.set(false);
    this.selectedAgniveerPost = '';
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return `${day} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
  }
}

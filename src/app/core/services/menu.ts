import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NavigationEnd, Router } from '@angular/router';
import { filter, Observable, tap } from 'rxjs';
import { Menu, MenusResponse, CreateMenuPayload, MenuPermission } from '../models/menu.model';
import { API_ENDPOINTS } from './api-config';
import { AuthService } from '../../services/auth';
import { CommonService } from '../../services/common-service';
import { CryptoHelper } from '../../helpers/crypto-helper';
import { environment } from '../../../environments/environment';

function mapControllerToRoute(path: any): string {
  if (!path || typeof path !== 'string') return '/';
  let p = path.trim();
  if (p === '' || p === '#' || p === 'javascript:void(0)') return '/';

  if (!p.startsWith('/') && !p.startsWith('http://') && !p.startsWith('https://')) {
    p = '/' + p;
  }

  const lower = p.toLowerCase();

  // Normalize common backend route variations to registered Angular routes
  if (p === '/masters' || p === '/master') return '';

  if (lower === '/contact' || lower === '/contact-us' || lower === '/contactus') return '/contact';
  if (lower === '/about' || lower === '/about-us') return '/about';
  if (lower === '/agnipath' || lower === '/agnipath-scheme') return '/agnipath';
  if (lower === '/career-progression/apply') {
    return '/career-progression/apply';
  }
  if (lower === '/faq' || lower === '/faqs') return '/faq';
  if (lower === '/grievance' || lower === '/public-grievance') return '/grievance';
  if (lower === '/feedback') return '/feedback';
  if (lower === '/terms-conditions' || lower === '/terms') return '/terms-conditions';
  if (lower === '/website-policies' || lower === '/policies' || lower === '/privacy-policy') {
    return '/website-policies';
  }

  if (lower === '/dashboard' || lower === '/dashboard/mis') return '/dashboard';
  if (
    lower === '/import' ||
    lower === '/dashboard/import' ||
    lower === '/import-agniveer-profiles'
  ) {
    return '/import';
  }
  if (lower === '/masters/nationality') {
    return '/masters/nationality';
  }
  if (lower === '/profileUpdate' || lower === '/profileupdate') {
    return '/profileUpdate';
  }
  if (
    lower === '/profile' ||
    lower === '/my-profile' ||
    lower === '/myprofile' ||
    lower === '/agniveer/profile' ||
    lower === '/agniveerdashboard' ||
    lower === '/agniveerdashboard/profile'
  ) {
    return '/myprofile';
  }
  if (p === '/notifications') return '/dashboard/notifications';

  if (lower === '/masters/religion') return '/masters/religion';
  if (lower === '/masters/organization') return '/masters/organization';
  if (lower === '/masters/organizationtype') return '/masters/organizationtype';
  if (lower === '/masters/menumanagement') return '/masters/menumanagement';
  if (lower === '/masters/rolemanagement') return '/masters/rolemanagement';
  if (lower === '/masters/usersmanagement') return '/masters/usersmanagement';
  if (lower === '/masters/categories') return '/masters/categories';
  if (lower === '/masters/postmapping') return '/masters/postmapping';
  if (lower === '/masters/postmaster') return '/masters/postmaster';
  if (lower === '/masters/agniveerpostmaster') return '/masters/agniveerpostmaster';
  if (lower === '/masters/schedulemanagement') return '/masters/schedulemanagement';
  if (lower === '/masters/update-website-status') return '/masters/update-website-status';

  if (!p.startsWith('http://') && !p.startsWith('https://')) {
    return lower;
  }

  return p;
}

function extractPriority(m: any, currentRoleId?: number): number {
  if (!m) return 0;

  // 1. Check if item has explicit priority on role matching current user
  let activeRoleId = currentRoleId;
  if (!activeRoleId && typeof window !== 'undefined') {
    const storedRole = sessionStorage.getItem('role');
    if (storedRole) {
      const parsed = parseInt(storedRole, 10);
      if (!isNaN(parsed) && parsed > 0) activeRoleId = parsed;
    }
  }

  if (activeRoleId && Array.isArray(m.roles)) {
    const matchedRole = m.roles.find(
      (r: any) => Number(r?.role_id ?? r?.roleId ?? 0) === Number(activeRoleId),
    );
    if (matchedRole) {
      const rolePriority = Number(matchedRole?.priority ?? matchedRole?.Priority);
      if (!isNaN(rolePriority) && rolePriority > 0) {
        return rolePriority;
      }
    }
  }

  // 2. Direct priority properties on menu item
  const raw =
    m.priority ??
    m.Priority ??
    m.menu_priority ??
    m.MenuPriority ??
    m.menu_order ??
    m.MenuOrder ??
    m.order ??
    m.Order ??
    m.position ??
    m.Position ??
    m.priority_no ??
    m.PriorityNo ??
    m.sort_order ??
    m.SortOrder ??
    m.sequence ??
    m.Sequence;

  if (raw !== null && raw !== undefined && raw !== '') {
    const num = Number(raw);
    if (!isNaN(num) && num > 0) {
      return num;
    }
  }

  // 3. Fallback: check any role priority if active role wasn't matched
  if (Array.isArray(m.roles) && m.roles.length > 0) {
    for (const r of m.roles) {
      const rp = Number(r?.priority ?? r?.Priority);
      if (!isNaN(rp) && rp > 0) {
        return rp;
      }
    }
  }

  // 4. Return numeric value if 0 was explicitly specified
  if (raw !== null && raw !== undefined && raw !== '') {
    const num = Number(raw);
    if (!isNaN(num)) {
      return num;
    }
  }

  return 0;
}

function getPriorityScore(menu: Menu): number {
  const p = Number(menu.priority ?? menu.position ?? 0);
  if (!isNaN(p) && p > 0) {
    return p;
  }
  // Items with priority 0, null, or undefined are placed at the end (after all explicitly prioritized items)
  return Number.MAX_SAFE_INTEGER;
}

function compareMenusByPriority(a: Menu, b: Menu): number {
  const scoreA = getPriorityScore(a);
  const scoreB = getPriorityScore(b);

  if (scoreA !== scoreB) {
    return scoreA - scoreB;
  }

  // If priorities are equal, give Home ('/') or Dashboard ('/dashboard') natural precedence
  const isHomeOrDashA =
    a.app_router_path === '/' ||
    a.app_router_path === '/dashboard' ||
    /home|dashboard/i.test(a.menu_name);
  const isHomeOrDashB =
    b.app_router_path === '/' ||
    b.app_router_path === '/dashboard' ||
    /home|dashboard/i.test(b.menu_name);
  if (isHomeOrDashA && !isHomeOrDashB) return -1;
  if (!isHomeOrDashA && isHomeOrDashB) return 1;

  // Stable tie-breaker: order by menu_id ascending
  const idA = Number(a.menu_id ?? 0);
  const idB = Number(b.menu_id ?? 0);
  if (idA !== idB) {
    return idA - idB;
  }

  return (a.menu_name || '').localeCompare(b.menu_name || '');
}

function normalizeMenuItem(m: any, currentRoleId?: number): Menu {
  const menuId = Number(m.menu_id ?? m.MenuId ?? m.id ?? m.Id ?? m.menuId ?? 0);

  // Parent ID
  const rawParentId =
    m.parent_id ??
    m.parent_menu_id ??
    m.ParentId ??
    m.ParentMenuId ??
    m.parentId ??
    m.parentMenuId ??
    m.Parent_Id ??
    m.Parent_Menu_Id ??
    0;

  const parentMenuId =
    rawParentId === null || rawParentId === undefined || Number(rawParentId) === 0
      ? null
      : Number(rawParentId);

  const menuName =
    m.menu_name ??
    m.MenuName ??
    m.menuName ??
    (m.lang_labels && m.lang_labels[0]?.label_name) ??
    '';

  const rawPath =
    m.app_router_path ||
    m.AppRouterPath ||
    m.link ||
    m.menu_url ||
    m.url ||
    m.controller_name ||
    m.ControllerName ||
    '/';

  const routerPath = mapControllerToRoute(rawPath);

  const children = Array.isArray(m.children)
    ? m.children.map((c: any) => normalizeMenuItem(c, currentRoleId))
    : [];

  const priorityNum = extractPriority(m, currentRoleId);

  return {
    _id: m._id || String(menuId),
    menu_id: menuId,
    menu_name: menuName,
    description: m.description ?? m.Description ?? null,
    parent_menu_id: parentMenuId,
    app_router_path: routerPath,
    menu_type: Number(m.menu_type ?? m.MenuType ?? m.menuType ?? 0),
    menu_category: m.menu_category ?? m.MenuCategory ?? 'public',
    is_active:
      m.is_active !== undefined
        ? Boolean(m.is_active)
        : m.IsActive !== undefined
          ? Boolean(m.IsActive)
          : m.active !== undefined
            ? Boolean(m.active)
            : true,
    is_visible_in_navbar:
      m.is_visible_in_navbar !== undefined ? Boolean(m.is_visible_in_navbar) : true,
    is_deleted: Boolean(m.is_deleted ?? m.IsDeleted ?? false),
    position: priorityNum,
    priority: priorityNum,
    roles: m.roles ?? m.Roles ?? [],
    children: children,
  };
}

function flattenMenus(menus: Menu[]): Menu[] {
  return menus.reduce<Menu[]>((acc, menu) => {
    acc.push(menu);
    if (menu.children?.length) acc.push(...flattenMenus(menu.children));
    return acc;
  }, []);
}

function buildMenuTree(menus: Menu[]): Menu[] {
  if (!menus || menus.length === 0) return [];

  const flat = flattenMenus(menus);
  const map = new Map<number, Menu>();
  const roots: Menu[] = [];

  for (const menu of flat) {
    map.set(menu.menu_id, { ...menu, children: [] });
  }

  for (const menu of map.values()) {
    if (
      menu.parent_menu_id === null ||
      menu.parent_menu_id === 0 ||
      !map.has(menu.parent_menu_id)
    ) {
      roots.push(menu);
    } else {
      const parent = map.get(menu.parent_menu_id)!;
      parent.children = [...(parent.children ?? []), menu];
    }
  }

  const sortByPriority = (items: Menu[]): Menu[] =>
    items
      .slice()
      .sort(compareMenusByPriority)
      .map((item) => ({
        ...item,
        children: item.children && item.children.length > 0 ? sortByPriority(item.children) : [],
      }));

  return sortByPriority(roots);
}

function normalizePath(path: string): string {
  if (!path) return '/';
  const normalized = path.split('?')[0].split('#')[0];
  if (normalized.length > 1 && normalized.endsWith('/')) {
    return normalized.slice(0, -1);
  }
  return normalized;
}

function isPathMatch(menuPath: string | null | undefined, currentPath: string): boolean {
  if (!menuPath) return false;
  const basePath = normalizePath(menuPath);
  const path = normalizePath(currentPath);
  if (basePath === path) return true;
  return path.startsWith(`${basePath}/`);
}

function findMenuByRoute(menus: Menu[], pathname: string): Menu | null {
  let bestMatch: Menu | null = null;
  let bestMatchLength = 0;

  const search = (items: Menu[]) => {
    for (const menu of items) {
      if (isPathMatch(menu.app_router_path, pathname)) {
        const pathLength = normalizePath(menu.app_router_path ?? '').length;
        if (pathLength > bestMatchLength) {
          bestMatch = menu;
          bestMatchLength = pathLength;
        }
      }
      if (menu.children?.length) {
        search(menu.children);
      }
    }
  };

  search(menus);
  return bestMatch;
}

function buildBreadcrumbs(menus: Menu[], current: Menu): Menu[] {
  const byId = new Map(menus.map((m) => [m.menu_id, m]));
  const trail: Menu[] = [];
  let node: Menu | undefined = current;

  while (node) {
    trail.unshift(node);
    node = node.parent_menu_id !== null ? byId.get(node.parent_menu_id) : undefined;
  }

  return trail;
}

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly commonService = inject(CommonService);

  readonly allMenusSignal = signal<Menu[]>([]);
  readonly navbarMenusSignal = signal<Menu[]>([]);
  readonly currentUrlSignal = signal<string>('/');
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  readonly menuTree = computed(() => buildMenuTree(this.navbarMenusSignal()));
  readonly activeMenus = computed(() =>
    this.navbarMenusSignal().filter((m) => m.is_active && !m.is_deleted),
  );
  readonly activeAllMenus = computed(() =>
    this.allMenusSignal().filter((m) => m.is_active && !m.is_deleted),
  );

  readonly currentMenu = computed(() =>
    findMenuByRoute(this.activeAllMenus(), this.currentUrlSignal()),
  );

  readonly permissions = computed<MenuPermission>(() => {
    const menu = this.currentMenu();
    const roleIdStr = typeof window !== 'undefined' ? sessionStorage.getItem('role') : null;
    const roleId = roleIdStr ? parseInt(roleIdStr, 10) : undefined;

    if (!menu || roleId == null || !menu.roles) {
      return { PView: true, PAdd: true, PEdit: true, PDelete: true };
    }

    const role = menu.roles.find((r) => r.role_id === roleId);
    if (!role) {
      return { PView: true, PAdd: true, PEdit: true, PDelete: true };
    }

    return {
      PView: role.PView === '1',
      PAdd: role.PAdd === '1',
      PEdit: role.PEdit === '1',
      PDelete: role.PDelete === '1',
    };
  });

  readonly breadcrumbs = computed(() => {
    const current = this.currentMenu();
    if (!current) return [];
    return buildBreadcrumbs(this.activeAllMenus(), current);
  });

  isUserLoggedIn(): boolean {
    const token = this.authService.getToken();
    if (token) return true;
    if (typeof window !== 'undefined') {
      const sessionRole = sessionStorage.getItem('role');
      if (sessionRole && Number(sessionRole) > 0) return true;
      const userautoId = sessionStorage.getItem('userautoId') || sessionStorage.getItem('userId');
      if (userautoId) return true;
    }
    return false;
  }

  isExcludedRoute(url?: string): boolean {
    const rawUrl =
      url ?? this.router.url ?? (typeof window !== 'undefined' ? window.location.pathname : '');
    const cleanUrl = (rawUrl || '').split('?')[0].split('#')[0].trim();
    const normalized = cleanUrl.startsWith('/') ? cleanUrl : '/' + cleanUrl;

    return (
      normalized === '/' ||
      normalized === '' ||
      normalized === '/login' ||
      normalized === '/auth/login' ||
      normalized === '/auth/userlogin' ||
      normalized === '/auth/user-login' ||
      normalized.startsWith('/auth/login') ||
      normalized.startsWith('/auth/userlogin') ||
      normalized.startsWith('/auth/user-login')
    );
  }

  constructor() {
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        const url = event.urlAfterRedirects || event.url;
        this.currentUrlSignal.set(url);

        // Do not call GetByRole on / or auth/login or for unauthenticated public routes
        if (!this.isExcludedRoute(url)) {
          if (!this.isUserLoggedIn()) {
            this.refresh();
          }
        }
      });

    // Check cached menudata or public_menus for instant render without flickering
    if (typeof window !== 'undefined') {
      const cached = sessionStorage.getItem('menudata');
      if (cached) {
        try {
          this.patchMenus(cached);
        } catch {}
      } else {
        const cachedPublic = sessionStorage.getItem('public_menus');
        if (cachedPublic) {
          try {
            this.patchMenus(JSON.parse(cachedPublic));
          } catch {}
        }
      }
    }

    // Call API on startup only if not on excluded routes (/ and auth/login)
    if (!this.isExcludedRoute()) {
      if (!this.isUserLoggedIn() || this.allMenusSignal().length === 0) {
        this.refresh();
      }
    }
  }

  private getApiUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const base = environment.apiUrl.endsWith('/') ? environment.apiUrl : environment.apiUrl + '/';
    const path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return base + path;
  }

  patchMenus(rawData: any, roleId?: number): Menu[] {
    let data = rawData;
    if (typeof data === 'string') {
      try {
        const decrypted = CryptoHelper.decrypt(data);
        data = JSON.parse(decrypted || data);
      } catch (e) {
        try {
          data = JSON.parse(data);
        } catch {
          console.error('Failed to parse decrypted menus:', e);
        }
      }
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
      if (typeof data.data === 'string') {
        try {
          const dec = CryptoHelper.decrypt(data.data);
          data = JSON.parse(dec || data.data);
        } catch {}
      }
    }

    const rawList: any[] = Array.isArray(data)
      ? data
      : Array.isArray(data?.menus)
        ? data.menus
        : Array.isArray(data?.records)
          ? data.records
          : Array.isArray(data?.data)
            ? data.data
            : [];

    const effectiveRoleId =
      roleId ??
      this.authService.getRoleId() ??
      (typeof window !== 'undefined' && sessionStorage.getItem('role')
        ? parseInt(sessionStorage.getItem('role')!, 10)
        : undefined);

    const normalized: Menu[] = rawList.map((m) => normalizeMenuItem(m, effectiveRoleId));
    const sortedNormalized = normalized.slice().sort(compareMenusByPriority);
    const visibleMenus = sortedNormalized.filter((m) => m.is_visible_in_navbar !== false);

    this.allMenusSignal.set(sortedNormalized);
    this.navbarMenusSignal.set(visibleMenus);
    this.isLoading.set(false);

    try {
      this.commonService.menuList = this.commonService.buildMenuTree(rawList);
    } catch (e) {
      console.warn('Could not update CommonService.menuList:', e);
    }

    return sortedNormalized;
  }

  loadDefaultMenus(): void {
    this.allMenusSignal.set([]);
    this.navbarMenusSignal.set([]);
    this.isLoading.set(false);
  }

  refresh(force = false): void {
    // Never call GetByRole API on / or auth/login
    if (this.isExcludedRoute()) {
      this.isLoading.set(false);
      return;
    }

    // When user is logged in, do not call the menu API again unless force is true (e.g., explicit role switch)
    if (this.isUserLoggedIn() && !force) {
      if (this.allMenusSignal().length === 0 && typeof window !== 'undefined') {
        const cached = sessionStorage.getItem('menudata');
        if (cached) {
          try {
            this.patchMenus(cached);
            return;
          } catch {}
        }
      }
      if (this.allMenusSignal().length > 0) {
        return;
      }
    }

    // When user is not logged in and menus are already loaded, do not call role menu API
    if (!this.isUserLoggedIn() && !force && this.navbarMenusSignal().length > 0) {
      return;
    }

    if (this.isLoading() && !force) {
      return;
    }

    this.isLoading.set(true);
    this.error.set(null);
    const endpoint = this.getApiUrl(API_ENDPOINTS.GET_ALL_MENUS);

    const roleId = this.authService.getRoleId() || 0;

    let payload: any = {
      roleId: roleId,
      roleid: roleId,
      langId: 1,
    };

    // Encrypt
    payload = JSON.stringify(payload);
    payload = CryptoHelper.encrypt(payload);
    payload = JSON.stringify(payload);

    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });

    this.http.post<any>(endpoint, payload, { headers }).subscribe({
      next: (res) => {
        let rawData = res?.data ?? res?.menus ?? res;
        this.patchMenus(rawData, roleId);
        if (this.isUserLoggedIn() && typeof window !== 'undefined') {
          try {
            const dataToStore = typeof rawData === 'string' ? rawData : JSON.stringify(rawData);
            sessionStorage.removeItem('menudata');
            sessionStorage.setItem('menudata', dataToStore);
          } catch {}
        }
      },

      error: (err) => {
        console.error('GetByRole API Error:', err);
        this.error.set(err.message || 'Failed to load menus');
        this.allMenusSignal.set([]);
        this.navbarMenusSignal.set([]);
        this.isLoading.set(false);
      },
    });
  }

  hasPermission(path: string, permKey: 'PView' | 'PAdd' | 'PEdit' | 'PDelete'): boolean {
    const menu = findMenuByRoute(this.activeAllMenus(), path);
    if (!menu) return true;
    const roleIdStr = typeof window !== 'undefined' ? sessionStorage.getItem('role') : null;
    if (!roleIdStr) return true;
    const roleId = parseInt(roleIdStr, 10);
    const role = menu.roles?.find((r) => r.role_id === roleId);
    if (!role) return true;
    return role[permKey] === '1';
  }

  canView(path: string): boolean {
    return this.hasPermission(path, 'PView');
  }

  canAdd(path: string): boolean {
    return this.hasPermission(path, 'PAdd');
  }

  canEdit(path: string): boolean {
    return this.hasPermission(path, 'PEdit');
  }

  canDelete(path: string): boolean {
    return this.hasPermission(path, 'PDelete');
  }

  getAllMenus(): Observable<any> {
    const endpoint = this.getApiUrl(API_ENDPOINTS.GET_ALL_MENUS);
    return this.http.post<any>(endpoint, {});
  }

  createMenu(
    menuIdOrPayload: string | CreateMenuPayload,
    payload?: CreateMenuPayload,
  ): Observable<Menu> {
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http
      .post<Menu>(this.getApiUrl(API_ENDPOINTS.CREATE_MENU(menuId)), body)
      .pipe(tap(() => this.refresh()));
  }

  updateMenu(
    idOrMenuId: string | number,
    menuIdOrPayload: string | CreateMenuPayload,
    payload?: CreateMenuPayload,
  ): Observable<Menu> {
    const id = String(idOrMenuId);
    const menuId = typeof menuIdOrPayload === 'string' ? menuIdOrPayload : '0';
    const body = typeof menuIdOrPayload === 'string' ? payload! : menuIdOrPayload;
    return this.http
      .put<Menu>(this.getApiUrl(API_ENDPOINTS.UPDATE_MENU(id, menuId)), body)
      .pipe(tap(() => this.refresh()));
  }

  deleteMenu(id: string | number, menuId = '0'): Observable<Menu> {
    return this.http
      .delete<Menu>(this.getApiUrl(API_ENDPOINTS.DELETE_MENU(String(id), menuId)))
      .pipe(tap(() => this.refresh()));
  }

  getMenuByPath(path: string): Menu | null {
    return findMenuByRoute(this.activeAllMenus(), path);
  }

  getMenuById(id: number): Menu | null {
    return flattenMenus(this.activeAllMenus()).find((m) => m.menu_id === id) ?? null;
  }
}

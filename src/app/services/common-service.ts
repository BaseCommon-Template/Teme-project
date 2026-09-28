import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { CookieService } from 'ngx-cookie-service';
import { CryptoHelper } from '../helpers/crypto-helper';
import { environment } from '../../environments/environment';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class CommonService {
  isLogin: boolean = false;
  userdata: any = '';
  langData: any = '';
  menuList: any = [];
  token: any = '';
  apiURL: any = environment.apiUrl;
  headers = new HttpHeaders({ 'content-Type': 'application/json' });

  options = { headers: this.headers };

  constructor(
    private router: Router,
    private cookieService: CookieService,
    private http: HttpClient,
  ) {
    if (typeof window !== 'undefined') {
      const token =
        this.cookieService.get('token') ||
        (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('token') : null);
      if (token) {
        this.isLogin = true;
        this.token = token;
      }

      let storedUser =
        typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('userdata') : null;

      if (storedUser) {
        try {
          const dec = CryptoHelper.decrypt(storedUser);
          let parsed = typeof dec === 'string' ? JSON.parse(dec) : dec;
          if (typeof parsed === 'string') parsed = JSON.parse(parsed);
          this.userdata = parsed;
        } catch {
          try {
            let parsed = JSON.parse(storedUser);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            this.userdata = parsed;
          } catch {}
        }
      }

      if (!this.userdata || typeof this.userdata !== 'object') {
        const plainUser =
          typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('user') : null;
        if (plainUser) {
          try {
            let parsed = JSON.parse(plainUser);
            if (typeof parsed === 'string') parsed = JSON.parse(parsed);
            this.userdata = parsed;
          } catch {}
        }
      }

      if (this.userdata && typeof this.userdata === 'object') {
        if (!this.userdata.name) {
          this.userdata.name =
            this.userdata.userName ||
            this.userdata.username ||
            this.userdata.fullName ||
            this.userdata.userId ||
            '';
        }
      }
    }
  }
  handleError(error: HttpErrorResponse) {
    const errorMsg = error?.error?.message || error?.message || 'An unknown error occurred';
    /* console.error(errorMsg) */ return throwError(() => errorMsg);
  }
  private getEndpointUrl(endpoint: string): string {
    if (endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
      return endpoint;
    }
    const base = this.apiURL.endsWith('/') ? this.apiURL : this.apiURL + '/';
    let path = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

    // If base URL already includes 'api/' and path also starts with 'api/', avoid duplicate 'api/'
    if (base.endsWith('api/') && path.startsWith('api/')) {
      path = path.slice(4);
    }

    return base + path;
  }
  buildMenuTree(data: any[]) {
    if (!Array.isArray(data)) return [];

    const menuMap = new Map<number, any>();
    const menuTree: any[] = [];

    // Create all menu objects
    data.forEach((item) => {
      const menuId = Number(item.menu_id ?? item.MenuId ?? item.id);

      menuMap.set(menuId, {
        ...item,
        menu_id: menuId,
        menu_name: item.menu_name ?? item.MenuName ?? item.menuName ?? '',
        parent_id: Number(item.parent_id ?? item.parent_menu_id ?? item.ParentId ?? 0),
        priority: Number(item.priority ?? item.Priority ?? 0),
        children: [],
      });
    });

    // Build parent-child tree
    data.forEach((item) => {
      const menuId = Number(item.menu_id ?? item.MenuId ?? item.id);

      const currentMenu = menuMap.get(menuId);

      if (!currentMenu) return;

      const parentId = Number(item.parent_id ?? item.parent_menu_id ?? item.ParentId ?? 0);

      // Top-level menu
      if (!parentId || parentId === 0) {
        menuTree.push(currentMenu);
      }
      // Child menu
      else {
        const parent = menuMap.get(parentId);

        if (parent) {
          parent.children.push(currentMenu);
        } else {
          // Parent not found - keep it as top-level
          menuTree.push(currentMenu);
        }
      }
    });

    const getPriority = (item: any): number => {
      const p = Number(item.priority ?? item.Priority ?? 0);
      return !isNaN(p) && p > 0 ? p : Number.MAX_SAFE_INTEGER;
    };

    // Sort parent menus
    menuTree.sort((a, b) => {
      const diff = getPriority(a) - getPriority(b);
      if (diff !== 0) return diff;
      return Number(a.menu_id ?? a.MenuId ?? 0) - Number(b.menu_id ?? b.MenuId ?? 0);
    });

    // Sort children
    menuTree.forEach((parent) => {
      if (Array.isArray(parent.children)) {
        parent.children.sort((a: any, b: any) => {
          const diff = getPriority(a) - getPriority(b);
          if (diff !== 0) return diff;
          return Number(a.menu_id ?? a.MenuId ?? 0) - Number(b.menu_id ?? b.MenuId ?? 0);
        });
      }
    });

    // console.log('========== FINAL MENU TREE ==========');
    // console.log(menuTree);
    // console.log('=====================================');

    return menuTree;
  }

  getState(param: any = {}) {
    return this.http
      .post(this.getEndpointUrl('/State/GetAll'), param, this.options)
      .pipe(catchError(this.handleError));
  }
}

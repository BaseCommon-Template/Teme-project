import { environment } from '../../../environments/environment';

export const buildUrl = (path: string): string => {
  const base = environment.apiUrl;

  return `${base}${path}`;
};

export const BASE_URL = environment.apiUrl;

const RAW_API_ENDPOINTS = {
  // ── Auth ──────────────────────────────────────────────────
  DIRECT_LOGIN: `/Users/login`,
  LOGOUT_USER: `/Users/logout`,
  JANPARICHAY_LOGIN: `/api/auth/login-janparichay`,
  GET_JANPARICHAY_AUTH_URL: `/api/auth/auth-url-janparichay`,
  UPDATE_USER_ROLE: `/api/auth/update-user-role`,

  // ── Dashboard ─────────────────────────────────────────────
  GET_DASHBOARD_STATS: `/api/dashboard/get-dashboard-stats`,

  // ── Entity ────────────────────────────────────────────────
  GET_ALL_ENTITIES: `/api/entity/get-all-entities`,
  CREATE_ENTITY: (menuId?: string) => `/api/entity/${menuId || '0'}/create-entity`,
  UPDATE_ENTITY: (id: string, menuId?: string) =>
    `/api/entity/${menuId || '0'}/update-entity/${id}`,
  DELETE_ENTITY: (id: string, menuId?: string) =>
    `/api/entity/${menuId || '0'}/delete-entity/${id}`,

  // ── Sub Entity ────────────────────────────────────────────
  GET_ALL_SUB_ENTITIES: `/api/sub-entity/get-all-sub-entities`,
  CREATE_SUB_ENTITY: (menuId?: string) => `/api/sub-entity/${menuId || '0'}/create-sub-entity`,
  UPDATE_SUB_ENTITY: (id: string, menuId?: string) =>
    `/api/sub-entity/${menuId || '0'}/update-sub-entity/${id}`,
  DELETE_SUB_ENTITY: (id: string, menuId?: string) =>
    `/api/sub-entity/${menuId || '0'}/delete-sub-entity/${id}`,

  // ─── Users ────────────────────────────────────────────────
  GET_ALL_USERS: (menuId: string) => `/api/user/${menuId || '0'}/get-all-users`,
  CREATE_USER: (menuId: string) => `/api/user/${menuId || '0'}/create-user`,
  UPDATE_USER: (id: string, menuId: string) => `/api/user/${menuId || '0'}/update-user/${id}`,
  DELETE_USER: (id: string, menuId: string) => `/api/user/${menuId || '0'}/delete-user/${id}`,

  // ─── Roles ────────────────────────────────────────────────
  GET_ALL_ROLES_NEW: `/api/role-new/get-all-roles`,
  GET_ROLE_BY_ID: (id: string) => `/api/role-new/get-role/${id}`,
  CREATE_ROLE: (menuId?: string) => `/api/role-new/${menuId || '0'}/create-role`,
  UPDATE_ROLE: (id: string, menuId?: string) => `/api/role-new/${menuId || '0'}/update-role/${id}`,
  DELETE_ROLE: (id: string, menuId?: string) => `/api/role-new/${menuId || '0'}/delete-role/${id}`,

  // ─── Menus ────────────────────────────────────────────────
  GET_ALL_MENUS: `Menu/GetByRole`,
  GET_MENU_BY_ID: (id: string) => `/Menu/GetById/${id}`,
  CREATE_MENU: (menuId?: string) => `/Menu/AddMenu`,
  UPDATE_MENU: (id: string, menuId?: string) => `/Menu/UpdateMenu`,
  DELETE_MENU: (id: string, menuId?: string) => `/Menu/Delete`,
  GET_MENU_PUBLIC: `Menu/GetByRole`,
  GET_MENU_PRIVATE: `Menu/GetByRole`,

};

export const API_ENDPOINTS: typeof RAW_API_ENDPOINTS = new Proxy(RAW_API_ENDPOINTS, {
  get(target: any, prop: string) {
    const val = target[prop];
    if (typeof val === 'function') {
      return (...args: any[]) => {
        const res = val(...args);
        return typeof res === 'string' ? buildUrl(res) : res;
      };
    }
    if (typeof val === 'string') {
      return buildUrl(val);
    }
    return val;
  },
});

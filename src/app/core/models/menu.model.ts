export interface RolePermission {
  role_id: number;
  role_name?: string;
  priority?: number;
  PAdd: '0' | '1';
  PDelete: '0' | '1';
  PEdit: '0' | '1';
  PView: '0' | '1';
}

export interface Menu {
  _id: string;
  menu_id: number;
  menu_name: string;
  description: string | null;
  parent_menu_id: number | null;
  app_router_path: string;
  menu_type: number;
  menu_category: string;
  is_active: boolean;
  is_visible_in_navbar: boolean;
  is_deleted?: boolean;
  position?: number;
  priority?: number;
  roles: RolePermission[];
  created_data?: {
    created_by_id: string;
    created_at: string;
    ip: string;
  };
  updated_data?: [
    {
      updated_by_id: string;
      updated_at: string;
      ip: string;
    },
  ];
  children?: Menu[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MenusResponse {
  menus: Menu[];
  message: string;
}

export type CreateMenuPayload = Omit<Menu, '_id' | 'createdAt' | 'updatedAt'>;

export interface MenuPermission {
  PView: boolean;
  PAdd: boolean;
  PEdit: boolean;
  PDelete: boolean;
}

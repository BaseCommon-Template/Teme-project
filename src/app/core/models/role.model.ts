export interface Role {
  _id: string;
  role_id: number;
  role_name: string;
  is_active: boolean;
  priority: number;
  otp_based: 'Y' | 'N';
  ip_based: 'Y' | 'N';
  ip_address?: string;
  created_data?: { created_by_id: string; created_at: string; ip: string };
  updated_data?: [{ updated_by_id: string; updated_at: string; ip: string }];
  createdAt?: string;
  updatedAt?: string;
}

export interface RolesResponse {
  roles: Role[];
  message: string;
}

export type CreateRolePayload = Omit<Role, '_id' | 'createdAt' | 'updatedAt'>;

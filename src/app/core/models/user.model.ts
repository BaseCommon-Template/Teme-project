export interface RoleNew {
  role_id: number;
  role_name: string;
  priority: number;
  otp_based: 'Y' | 'N';
  ip_based: 'Y' | 'N';
}

export type UserRoleItem = RoleNew;

export interface UserFromAPI {
  _id: string;
  entity_id: string;
  sub_entity_id: string | null;
  officer_name: string;
  name?: string;
  username?: string;
  role_name?: string;
  rank: string;
  designation: string;
  phone: string;
  email: string;
  role_id: string | any;
  roles?: RoleNew[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateUserPayload {
  entity_id: string;
  sub_entity_id: string | null;
  officer_name: string;
  rank: string;
  designation: string;
  phone: string;
  email: string;
  role_id: string;
  roles?: RoleNew[];
  password?: string;
}

export type UpdateUserPayload = CreateUserPayload;

export interface SessionUser {
  id?: string;
  _id?: string;
  username: string;
  name: string;
  email?: string;
  role: string;
  role_id?: any;
  entity_id?: string;
  sub_entity_id?: string;
  officer_name?: string;
  designation?: string;
  phone?: string;
}

export interface Session {
  user: SessionUser;
  loginTime: number;
}

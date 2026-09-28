export interface Nationality {
  _id: string;
  name?: string;
  nationality?: string;
  code?: string;
  short_name?: string;
  description?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  autonationality_id?: string
}

export interface Religion {
  _id: string;
  name?: string;
  religion?: string;
  code?: string;
  short_name?: string;
  description?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  autoreligion_id?: string
}

export interface Category {
  _id: string;
  name?: string;
  category_name?: string;
  code?: string;
  category_code?: string;
  description?: string;
  sub_categories?: string[];
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface PostMaster {
  _id: string;
  post_name: string;
  name?: string;
  code?: string;
  post_code?: string;
  entity_id?: string;
  sub_entity_id?: string;
  pay_level?: string;
  description?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DomicileStateUT {
  _id: string;
  state_name: string;
  name?: string;
  state_code?: string;
  short_name?: string;
  description?: string;
  is_ut?: boolean;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DomicileDistrict {
  _id: string;
  district_name: string;
  name?: string;
  state_id: string | DomicileStateUT;
  district_code?: string;
  description?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  police_stations?: string;
}

export interface PoliceStation {
  _id: string;
  police_station_name?: string;
  station_name?: string;
  name?: string;
  district_id: string | DomicileDistrict;
  state_id?: string | DomicileStateUT;
  station_code?: string;
  pincode?: string;
  description?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
  police_stations?: string;
}

export interface DefencePost {
  _id: string;
  post_name?: string;
  defence_post_name?: string;
  name?: string;
  branch?: string;
  post_code?: string;
  description?: string;
  is_active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

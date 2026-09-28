export interface SubEntityFromAPI {
  _id: string;
  parent_entity_id: string;
  sub_entity_name: string;
  short_name: string;
  hq_street_address?: string;
  hq_pincode?: number;
  hq_city?: string;
  hq_state?: string;
  official_website_url?: string;
  posts?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateSubEntityPayload {
  parent_entity_id: string;
  sub_entity_name: string;
  short_name: string;
  hq_street_address?: string;
  hq_pincode?: number;
  hq_city?: string;
  hq_state?: string;
  official_website_url?: string;
  posts?: string[];
}

export interface Entity {
  _id: string;
  entity_name: string;
  short_name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEntityPayload {
  entity_name: string;
  short_name: string;
  description: string;
}

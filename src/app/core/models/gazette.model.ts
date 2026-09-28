export interface GazetteItem {
  _id?: string;
  narration: string;
  attachment_url?: string;
  header?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateGazettePayload {
  narration: string;
  attachment_url?: string;
  header?: string;
}

export interface GetAllGazetteResponse {
  gazetteNotifications: GazetteItem[];
  message?: string;
}

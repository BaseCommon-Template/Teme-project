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

  // ── Masters ───────────────────────────────────────────────
  // Nationality
  GET_ALL_NATIONALITIES: `/api/nationality/get-all-nationalities`,
  GET_NATIONALITY_BY_ID: (id: string) => `/api/nationality/get-nationality/${id}`,
  CREATE_NATIONALITY: (menuId?: string) => `/api/nationality/${menuId || '0'}/create-nationality`,
  UPDATE_NATIONALITY: (id: string, menuId?: string) =>
    `/api/nationality/${menuId || '0'}/update-nationality/${id}`,
  DELETE_NATIONALITY: (id: string, menuId?: string) =>
    `/api/nationality/${menuId || '0'}/delete-nationality/${id}`,

  // Religion
  GET_ALL_RELIGIONS: `/api/religion/get-all-religions`,
  GET_RELIGION_BY_ID: (id: string) => `/api/religion/get-religion/${id}`,
  CREATE_RELIGION: (menuId?: string) => `/api/religion/${menuId || '0'}/create-religion`,
  UPDATE_RELIGION: (id: string, menuId?: string) =>
    `/api/religion/${menuId || '0'}/update-religion/${id}`,
  DELETE_RELIGION: (id: string, menuId?: string) =>
    `/api/religion/${menuId || '0'}/delete-religion/${id}`,

  // Category
  GET_ALL_CATEGORIES: `/api/category/get-all-categories`,
  GET_CATEGORY_BY_ID: (id: string) => `/api/category/get-category/${id}`,
  CREATE_CATEGORY: (menuId?: string) => `/api/category/${menuId || '0'}/create-category`,
  UPDATE_CATEGORY: (id: string, menuId?: string) =>
    `/api/category/${menuId || '0'}/update-category/${id}`,
  DELETE_CATEGORY: (id: string, menuId?: string) =>
    `/api/category/${menuId || '0'}/delete-category/${id}`,

  // Post
  GET_ALL_POSTS: `/api/post-master/get-all-posts`,
  GET_POST_BY_ID: (id: string) => `/api/post-master/get-post/${id}`,
  CREATE_POST: (menuId?: string) => `/api/post-master/${menuId || '0'}/create-post`,
  UPDATE_POST: (id: string, menuId?: string) =>
    `/api/post-master/${menuId || '0'}/update-post/${id}`,
  DELETE_POST: (id: string, menuId?: string) =>
    `/api/post-master/${menuId || '0'}/delete-post/${id}`,

  // Domicile State / UT
  GET_ALL_DOMICILE_STATES_UT: `/api/domicile-state-ut/get-all-domicile-states-ut`,
  GET_DOMICILE_STATE_UT_BY_ID: (id: string) => `/api/domicile-state-ut/get-domicile-state-ut/${id}`,
  CREATE_DOMICILE_STATE_UT: (menuId?: string) =>
    `/api/domicile-state-ut/${menuId || '0'}/create-domicile-state-ut`,
  UPDATE_DOMICILE_STATE_UT: (id: string, menuId?: string) =>
    `/api/domicile-state-ut/${menuId || '0'}/update-domicile-state-ut/${id}`,
  DELETE_DOMICILE_STATE_UT: (id: string, menuId?: string) =>
    `/api/domicile-state-ut/${menuId || '0'}/delete-domicile-state-ut/${id}`,

  // Domicile District
  GET_ALL_DOMICILE_DISTRICTS: `/api/domicile-district/get-all-domicile-districts`,
  GET_DOMICILE_DISTRICT_BY_ID: (id: string) => `/api/domicile-district/get-domicile-district/${id}`,
  CREATE_DOMICILE_DISTRICT: (menuId?: string) =>
    `/api/domicile-district/${menuId || '0'}/create-domicile-district`,
  UPDATE_DOMICILE_DISTRICT: (id: string, menuId?: string) =>
    `/api/domicile-district/${menuId || '0'}/update-domicile-district/${id}`,
  DELETE_DOMICILE_DISTRICT: (id: string, menuId?: string) =>
    `/api/domicile-district/${menuId || '0'}/delete-domicile-district/${id}`,

  // Police Station
  GET_ALL_POLICE_STATIONS: `/api/police-station/get-all-police-stations`,
  GET_POLICE_STATION_BY_ID: (id: string) => `/api/police-station/get-police-station/${id}`,
  CREATE_POLICE_STATION: (menuId?: string) =>
    `/api/police-station/${menuId || '0'}/create-police-station`,
  UPDATE_POLICE_STATION: (id: string, menuId?: string) =>
    `/api/police-station/${menuId || '0'}/update-police-station/${id}`,
  DELETE_POLICE_STATION: (id: string, menuId?: string) =>
    `/api/police-station/${menuId || '0'}/delete-police-station/${id}`,

  // Defence Post
  GET_ALL_DEFENCE_POSTS: `/api/defence-post/get-all-posts`,
  GET_DEFENCE_POST_BY_ID: (id: string) => `/api/defence-post/get-post/${id}`,
  CREATE_DEFENCE_POST: (menuId?: string) => `/api/defence-post/${menuId || '0'}/create-post`,
  UPDATE_DEFENCE_POST: (id: string, menuId?: string) =>
    `/api/defence-post/${menuId || '0'}/update-post/${id}`,
  DELETE_DEFENCE_POST: (id: string, menuId?: string) =>
    `/api/defence-post/${menuId || '0'}/delete-post/${id}`,

  // ── Notification ──────────────────────────────────────────
  GET_ALL_NOTIFICATIONS: `/api/notification/get-all-notifications`,
  GET_ALL_PAGINATED_NOTIFICATIONS: `/api/notification/get-all-paginated-notifications`,
  CREATE_NOTIFICATION: (menuId?: string) =>
    `/api/notification/${menuId || '0'}/create-notification`,
  GET_NOTIFICATION_BY_ID: (id: string) => `/api/notification/get-notification/${id}`,
  UPDATE_NOTIFICATION: (id: string) => `/api/notification/update-notification/${id}`,
  DELETE_NOTIFICATION: (id: string) => `/api/notification/delete-notification/${id}`,
  FREEZE_NOTIFICATION: (id: string, menuId?: string) =>
    `/api/notification/${menuId || '0'}/freeze-notification/${id}`,

  // ── Gazette Notification ──────────────────────────────────
  CREATE_GAZETTE_NOTIFICATION: (menuId?: string) =>
    `/api/gazette-notification/${menuId || '0'}/create-gazette-notification`,
  GET_ALL_GAZETTE_NOTIFICATIONS: `/api/gazette-notification/get-all-gazette-notifications`,
  DELETE_GAZETTE_NOTIFICATION: (id: string, menuId?: string) =>
    `/api/gazette-notification/${menuId || '0'}/delete-gazette-notification/${id}`,
  UPDATE_GAZETTE_NOTIFICATION: (id: string, menuId?: string) =>
    `/api/gazette-notification/${menuId || '0'}/update-gazette-notification/${id}`,

  // ── Agniveer Profile ──────────────────────────────────────
  GET_ALL_AGNIVEER_PROFILES: (menuId: string) => `/api/agniveer-profile/get-all`,
  GET_AGNIVEER_PROFILE_BY_ID_OPEN: (id: string) => `/api/agniveer-profile/get-profile/${id}`,
  GET_AGNIVEER_PROFILE_BY_ID: (id: string, menuId: string) =>
    `/api/agniveer-profile/${menuId || '0'}/get-profile/${id}`,
  UPDATE_CONSENT_AGNIVEER_PROFILE_BY_ID: (id: string, menuId: string) =>
    `/api/agniveer-profile/${menuId || '0'}/update-consent/${id}`,
  UPDATE_AGNIVEER_PROFILE_BY_ID: (id: string, menuId: string) =>
    `/api/agniveer-profile/${menuId || '0'}/update-profile/agniveer/${id}`,
  DRAFT_ADDITIONAL_AGNIVEER_DETAIL: (id: string, menuId: string) =>
    `/api/agniveer-profile/${menuId || '0'}/draft-additional-fields/${id}`,
  SUBMIT_ADDITIONAL_AGNIVEER_DETAIL: (id: string, menuId: string) =>
    `/api/agniveer-profile/${menuId || '0'}/submit-additional-fields/${id}`,
  GET_ALL_AGNIVEER_PROFILE_APPROVALS: (menuId: string) =>
    `/api/agniveer-profile/${menuId || '0'}/get-agniveer-profile-approvals`,
  GET_AGNIVEER_PROFILE_APPROVAL_BY_ID: (id: string, menuId: string) =>
    `/api/agniveer-profile/${menuId || '0'}/get-agniveer-profile-approval/${id}`,
  VERIFY_AGNIVEER_PROFILE_APPROVAL: (id: string, menuId: string) =>
    `/api/agniveer-profile/${menuId || '0'}/verify-agniveer-profile/${id}`,

  // ── Post Agniveer Profile ─────────────────────────────────
  GET_ALL_POST_AGNIVEER_PROFILES: `/api/post-agniveer-profile/get-all`,
  GET_POST_AGNIVEER_PROFILE_BY_ID: (id: string) =>
    `/api/post-agniveer-profile/submit-additional-fields/${id}`,
  ADD_QUALIFICATION: (profileId: string) =>
    `/api/post-agniveer-profile/${profileId}/add-qualification`,
  UPDATE_QUALIFICATION: (profileId: string, qualId: string) =>
    `/api/post-agniveer-profile/${profileId}/update-qualification/${qualId}`,
  ADD_EMPLOYMENT: (profileId: string) => `/api/post-agniveer-profile/${profileId}/add-employment`,
  UPDATE_EMPLOYMENT: (profileId: string, empId: string) =>
    `/api/post-agniveer-profile/${profileId}/update-employment/${empId}`,
  ADD_TRAINING: (profileId: string) => `/api/post-agniveer-profile/${profileId}/add-training`,
  UPDATE_TRAINING: (profileId: string, trainId: string) =>
    `/api/post-agniveer-profile/${profileId}/update-training/${trainId}`,
  ADD_CERTIFICATION: (profileId: string) =>
    `/api/post-agniveer-profile/${profileId}/add-certification`,
  UPDATE_CERTIFICATION: (profileId: string, certId: string) =>
    `/api/post-agniveer-profile/${profileId}/update-certification/${certId}`,

  // ── Feedback ───────────────────────────────────────────────
  GET_ALL_FEEDBACK: `/api/feedback/get-all-feedbacks`,
  CREATE_FEEDBACK: `/api/feedback/create-feedback`,
  UPDATE_FEEDBACK: (id: string) => `/api/feedback/update-feedback/${id}`,
  DELETE_FEEDBACK: (id: string) => `/api/feedback/delete-feedback/${id}`,

  // ── Agniveer Import History & Force Types ────────────────
  UPLOAD_AGNIVEER_XML: (menuId?: string) => `/api/import/${menuId || '0'}/upload-xml`,
  AGNIVEER_UPLOAD_XML: `/AgniveerUpload/UploadXml`,
  GET_IMPORT_HISTORY: (menuId?: string) => `/api/import/${menuId || '0'}/import-history`,
  GET_IMPORT_BY_ID: (id: string, menuId?: string) =>
    `/api/import/${menuId || '0'}/import-history-details/${id}`,
  GET_ALL_FORCE_TYPES: `/AgniveerForceType/GetAll`,
  GET_ALL_ATTACHMENTS: `/AgniveerUpload/GetAllAttachment`,

  // ── Grievance ─────────────────────────────────────────────
  GET_ALL_GRIEVANCE: `/api/grievance/get-all-grievances`,
  CREATE_GRIEVANCE: (menuId?: string) => `/api/grievance/${menuId || '0'}/create-grievance`,
  UPDATE_GRIEVANCE: (id: string, menuId?: string) =>
    `/api/grievance/${menuId || '0'}/update-grievance/${id}`,
  DELETE_GRIEVANCE: (id: string) => `/api/grievance/delete-grievance/${id}`,
  GET_GRIEVANCES_BY_USER: (userId: string) => `/api/grievance/get-grievances-by-user/${userId}`,
  ADD_GRIEVANCE_MESSAGE: (id: string, menuId?: string) =>
    `/api/grievance/${menuId || '0'}/messages/${id}`,

  // ── Job Application ───────────────────────────────────────
  GET_ALL_JOB_APPLICATIONS: `/api/job-application/get-all-job-applications`,
  GET_JOB_APPLICATION_BY_ID: (id: string) => `/api/job-application/get-job-application/${id}`,
  GET_MY_JOB_APPLICATIONS: `/api/job-application/get-my-job-applications`,
  DRAFT_JOB_APPLICATION: `/api/job-application/draft`,
  SUBMIT_JOB_APPLICATION: (id: string) => `/api/job-application/submit/${id}`,
  WITHDRAW_JOB_APPLICATION: (id: string) => `/api/job-application/withdraw/${id}`,
  DELETE_JOB_APPLICATION: (id: string) => `/api/job-application/delete/${id}`,
  CREATE_JOB_APPLICATION: (menuId: string) =>
    `/api/job-application/${menuId || '0'}/create-job-application`,
  UPDATE_JOB_APPLICATION_STATUS: (id: string, menuId: string) =>
    `/api/job-application/${menuId || '0'}/update-status/${id}`,
  GET_MY_JOB_APPLICATION_BY_NOTIFICATION: (notificationId: string) =>
    `/api/job-application/get-my-job-application/${notificationId}`,
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

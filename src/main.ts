import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { CookieService } from 'ngx-cookie-service';
import { CryptoHelper } from './app/helpers/crypto-helper';

// Safely encrypt cookie / storage key (base64url format to prevent special character issues in all browsers including Firefox)
function encryptCookieKey(key: string): string {
  if (!key || typeof key !== 'string') return String(key || '');
  if (key.startsWith('enc_')) return key;
  try {
    const enc = CryptoHelper.encrypt(String(key));
    const b64 = btoa(enc).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    return 'enc_' + b64;
  } catch (e) {
    return String(key);
  }
}

// Safely decrypt cookie / storage key
function decryptCookieKey(encKey: string): string {
  if (!encKey || typeof encKey !== 'string' || !encKey.startsWith('enc_')) return encKey;
  try {
    const base64Part = encKey.substring(4);
    let base64 = base64Part.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const enc = atob(base64);
    const dec = CryptoHelper.decrypt(enc);
    return dec || encKey;
  } catch (e) {
    return encKey;
  }
}

// Safely encrypt cookie / storage value
function encryptCookieValue(value: string): string {
  if (value === null || value === undefined) return '';
  try {
    const str = String(value);
    const enc = CryptoHelper.encrypt(str);
    return btoa(enc).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
  } catch (e) {
    return String(value);
  }
}

// Safely decrypt cookie / storage value (supports base64url, raw AES Base64, and space-converted plus signs in Firefox)
function decryptCookieValue(encVal: string): string {
  if (!encVal || typeof encVal !== 'string') return '';
  try {
    let base64 = encVal.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    let enc = base64;
    try {
      enc = atob(base64);
    } catch (e) {}

    // 1. Attempt decrypting base64-decoded string
    const dec = CryptoHelper.decrypt(enc);
    if (dec && dec !== enc) {
      return dec;
    }

    // 2. Direct decrypt in case the value was stored as raw AES ciphertext
    const decDirect = CryptoHelper.decrypt(encVal);
    if (decDirect && decDirect !== encVal) {
      return decDirect;
    }

    return dec || encVal;
  } catch (e) {
    return encVal;
  }
}

const COOKIE_KEYS = [
  'token',
  'refreshToken',
  'access_token',
  'refresh_token',
  'userdata',
  'user',
  'user_session',
  'app_session',
  'roles',
  'menudata',
  'roleId',
  'role-id',
  'role',
  'role_name',
  'userId',
  'user_id',
  'userautoId',
  'agniveer_autoid',
  'agniveerAutoid',
  'agniveerId',
  'forceTypeId',
  'forceType',
  'userType',
  'login_type',
  'agniveer_profile_id',
  'agniveer_profile',
  'languagedata',
  'langId',
  'codeVerifier',
  'pkce_code_verifier',
  'selected_vacancy_notification',
  'font-level',
  'accessibility-settings',
  'site_visit_count',
  'visited',
  'pageno',
  'editRequestFormData',
  'intimationRequestData',
  'active_tab',
  'grid_filter',
  'returnUrl',
  'state',
  'agniveer_session',
];

function isSecureKey(key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  if (key.startsWith('enc_')) return false;
  if (COOKIE_KEYS.includes(key)) return true;
  // Exclude system / backend cookies or internal navigation security keys
  if (key.startsWith('.') || key.startsWith('ASP.NET') || key.startsWith('__')) return false;
  return true;
}

if (typeof window !== 'undefined' && typeof Storage !== 'undefined') {
  // Capture native browser Storage.prototype methods (crucial for Firefox compatibility)
  const originalStorageGetItem = Storage.prototype.getItem;
  const originalStorageSetItem = Storage.prototype.setItem;
  const originalStorageRemoveItem = Storage.prototype.removeItem;
  const originalStorageClear = Storage.prototype.clear;
  const originalStorageKey = Storage.prototype.key;

  // Secure cookie helper functions
  function setSecureCookie(
    key: string,
    value: string,
    expires?: number | Date,
    path?: string,
    domain?: string,
    secure?: boolean,
    sameSite?: 'Lax' | 'None' | 'Strict',
  ): void {
    const encKey = encryptCookieKey(key);
    const encVal = encryptCookieValue(value);

    // 1. Store encrypted key & value in sessionStorage
    try {
      originalStorageSetItem.call(sessionStorage, encKey, encVal);
      if (key !== encKey) {
        originalStorageRemoveItem.call(sessionStorage, key);
      }
    } catch (e) {}

    // 2. Store encrypted key & value in document.cookie (if <= 4000 characters)
    try {
      let cookieStr = `${encKey}=${encVal}`;
      if (cookieStr.length <= 4000) {
        const usePath = path || '/';
        cookieStr += `; path=${usePath}`;

        if (expires !== undefined) {
          if (typeof expires === 'number') {
            const d = new Date();
            d.setTime(d.getTime() + expires * 24 * 60 * 60 * 1000);
            cookieStr += `; expires=${d.toUTCString()}`;
          } else if (expires instanceof Date) {
            cookieStr += `; expires=${expires.toUTCString()}`;
          }
        } else {
          cookieStr += `; max-age=86400`;
        }

        if (domain) {
          cookieStr += `; domain=${domain}`;
        }

        const isHttps = typeof location !== 'undefined' && location.protocol === 'https:';
        const useSecure = secure !== undefined ? secure : isHttps;
        let useSameSite = sameSite || (isHttps ? 'None' : 'Lax');

        if (useSameSite === 'None' && !useSecure) {
          useSameSite = 'Lax';
        }

        cookieStr += `; SameSite=${useSameSite}`;
        if (useSecure) {
          cookieStr += '; Secure';
        }

        document.cookie = cookieStr;
      }
    } catch (e) {}
  }

  function getSecureCookie(key: string): string {
    const encKey = encryptCookieKey(key);

    // 1. Check document.cookie first
    try {
      const cookies = document.cookie.split(';');
      for (let c of cookies) {
        c = c.trim();
        if (c.startsWith(encKey + '=')) {
          const encVal = c.substring(encKey.length + 1);
          const val = decryptCookieValue(encVal);
          if (val !== undefined && val !== null && val !== '') return val;
        }
      }
    } catch (e) {}

    // 2. Check encrypted key in sessionStorage
    try {
      const encVal = originalStorageGetItem.call(sessionStorage, encKey);
      if (encVal) {
        const val = decryptCookieValue(encVal);
        if (val !== undefined && val !== null && val !== '') return val;
      }
    } catch (e) {}

    // 3. Fallback & migration: Check raw key in sessionStorage (migrate to encrypted, delete raw)
    try {
      const rawVal = originalStorageGetItem.call(sessionStorage, key);
      if (rawVal !== undefined && rawVal !== null && rawVal !== '') {
        try {
          originalStorageSetItem.call(sessionStorage, encKey, encryptCookieValue(rawVal));
          originalStorageRemoveItem.call(sessionStorage, key);
        } catch (e) {}
        return rawVal;
      }
    } catch (e) {}

    // 4. Fallback: Check raw key in document.cookie
    try {
      const cookies = document.cookie.split(';');
      for (let c of cookies) {
        c = c.trim();
        if (c.startsWith(key + '=')) {
          const rawVal = c.substring(key.length + 1);
          if (rawVal !== undefined && rawVal !== null && rawVal !== '') return rawVal;
        }
      }
    } catch (e) {}

    return '';
  }

  function deleteSecureCookie(key: string): void {
    const encKey = encryptCookieKey(key);
    try {
      document.cookie = `${encKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
      document.cookie = `${key}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
    } catch (e) {}
    try {
      originalStorageRemoveItem.call(sessionStorage, encKey);
      originalStorageRemoveItem.call(sessionStorage, key);
    } catch (e) {}
  }

  // =========================================================================
  // Intercept Storage.prototype methods (Applies to both sessionStorage and
  // localStorage across ALL browsers, especially Firefox where instance
  // properties are not shadowed)
  // =========================================================================

  Storage.prototype.setItem = function (key: string, value: string): void {
    if (typeof key !== 'string' || !isSecureKey(key)) {
      originalStorageSetItem.call(this, key, String(value ?? ''));
      return;
    }

    const encKey = encryptCookieKey(key);
    const encVal = encryptCookieValue(String(value ?? ''));

    originalStorageSetItem.call(this, encKey, encVal);

    if (key !== encKey) {
      try {
        originalStorageRemoveItem.call(this, key);
      } catch (e) {}
    }

    // Mirror to cookie if key is in COOKIE_KEYS and storage is sessionStorage
    if (this === sessionStorage && COOKIE_KEYS.includes(key)) {
      setSecureCookie(key, String(value ?? ''));
    }
  };

  Storage.prototype.getItem = function (key: string): string | null {
    if (typeof key !== 'string' || !isSecureKey(key)) {
      return originalStorageGetItem.call(this, key);
    }

    const encKey = encryptCookieKey(key);

    // 1. Try reading encrypted key from this storage
    const encVal = originalStorageGetItem.call(this, encKey);
    if (encVal !== null && encVal !== undefined && encVal !== '') {
      const dec = decryptCookieValue(encVal);
      if (dec !== undefined && dec !== null && dec !== '') return dec;
    }

    // 2. Fallback: check document.cookie (if sessionStorage)
    if (this === sessionStorage && COOKIE_KEYS.includes(key)) {
      const cookieVal = getSecureCookie(key);
      if (cookieVal !== undefined && cookieVal !== null && cookieVal !== '') return cookieVal;
    }

    // 3. Fallback & migration: check raw unencrypted key in this storage
    const rawVal = originalStorageGetItem.call(this, key);
    if (rawVal !== null && rawVal !== undefined && rawVal !== '') {
      try {
        originalStorageSetItem.call(this, encKey, encryptCookieValue(rawVal));
        originalStorageRemoveItem.call(this, key);
      } catch (e) {}
      return rawVal;
    }

    return null;
  };

  Storage.prototype.removeItem = function (key: string): void {
    if (typeof key !== 'string') {
      originalStorageRemoveItem.call(this, key);
      return;
    }

    const encKey = encryptCookieKey(key);
    try {
      originalStorageRemoveItem.call(this, encKey);
    } catch (e) {}
    try {
      originalStorageRemoveItem.call(this, key);
    } catch (e) {}

    if (this === sessionStorage && COOKIE_KEYS.includes(key)) {
      deleteSecureCookie(key);
    }
  };

  Storage.prototype.clear = function (): void {
    originalStorageClear.call(this);
    if (this === sessionStorage) {
      for (const key of COOKIE_KEYS) {
        deleteSecureCookie(key);
      }
    }
  };

  Storage.prototype.key = function (index: number): string | null {
    const encKey = originalStorageKey.call(this, index);
    if (encKey && encKey.startsWith('enc_')) {
      return decryptCookieKey(encKey);
    }
    return encKey;
  };

  // Also bind directly on sessionStorage and localStorage instances for compatibility
  try {
    sessionStorage.setItem = Storage.prototype.setItem.bind(sessionStorage);
    sessionStorage.getItem = Storage.prototype.getItem.bind(sessionStorage);
    sessionStorage.removeItem = Storage.prototype.removeItem.bind(sessionStorage);
    sessionStorage.clear = Storage.prototype.clear.bind(sessionStorage);
    sessionStorage.key = Storage.prototype.key.bind(sessionStorage);

    localStorage.setItem = Storage.prototype.setItem.bind(localStorage);
    localStorage.getItem = Storage.prototype.getItem.bind(localStorage);
    localStorage.removeItem = Storage.prototype.removeItem.bind(localStorage);
    localStorage.clear = Storage.prototype.clear.bind(localStorage);
    localStorage.key = Storage.prototype.key.bind(localStorage);
  } catch (e) {}

  // =========================================================================
  // Intercept CookieService prototype methods
  // =========================================================================

  const originalCookieGet = CookieService.prototype.get;
  const originalCookieSet = CookieService.prototype.set;
  const originalCookieDelete = CookieService.prototype.delete;
  const originalCookieCheck = CookieService.prototype.check;
  const originalCookieDeleteAll = CookieService.prototype.deleteAll;

  CookieService.prototype.get = function (key: string) {
    if (isSecureKey(key)) {
      const val = getSecureCookie(key);
      if (val !== undefined && val !== null && val !== '') return val;
    }
    return originalCookieGet.apply(this, arguments as any);
  };

  CookieService.prototype.set = function (key: string, value: string) {
    if (isSecureKey(key)) {
      const expires = arguments[2];
      const path = arguments[3];
      const domain = arguments[4];
      const secure = arguments[5];
      const sameSite = arguments[6];
      setSecureCookie(key, value, expires, path, domain, secure, sameSite);
    } else {
      originalCookieSet.apply(this, arguments as any);
    }
  };

  CookieService.prototype.delete = function (key: string) {
    if (isSecureKey(key)) {
      deleteSecureCookie(key);
    } else {
      originalCookieDelete.apply(this, arguments as any);
    }
  };

  CookieService.prototype.check = function (key: string) {
    if (isSecureKey(key)) {
      return getSecureCookie(key) !== '';
    }
    return originalCookieCheck.apply(this, arguments as any);
  };

  CookieService.prototype.deleteAll = function () {
    if (originalCookieDeleteAll) {
      originalCookieDeleteAll.apply(this, arguments as any);
    }
    try {
      const cookies = document.cookie.split(';');
      for (let c of cookies) {
        c = c.trim();
        const eqIdx = c.indexOf('=');
        if (eqIdx > 0) {
          const encKey = c.substring(0, eqIdx);
          if (encKey.startsWith('enc_')) {
            document.cookie = `${encKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; max-age=0; SameSite=Lax`;
            try {
              originalStorageRemoveItem.call(sessionStorage, encKey);
            } catch (e) {}
          }
        }
      }
    } catch (e) {}
    for (const key of COOKIE_KEYS) {
      deleteSecureCookie(key);
    }
  };
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));

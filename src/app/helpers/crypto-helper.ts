import * as CryptoJS from 'crypto-js';

export class CryptoHelper {
  private static readonly KEY = CryptoJS.enc.Utf8.parse('3829171131048143');
  private static readonly IV = CryptoJS.enc.Utf8.parse('8316058492273143');

  /** Decrypt AES (C# compatible) */
  static decrypt(cipherText: string): string {
    if (!cipherText) return '';
    try {
      const cleanCipher =
        typeof cipherText === 'string' && cipherText.includes(' ')
          ? cipherText.replace(/ /g, '+')
          : cipherText;

      const decrypted = CryptoJS.AES.decrypt(cleanCipher, this.KEY, {
        iv: this.IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      const res = decrypted.toString(CryptoJS.enc.Utf8);
      return res || cipherText;
    } catch (e) {
      return cipherText;
    }
  }

  /** Encrypt (AES CBC mode, matches C# output) */
  static encrypt(plainText: string): string {
    if (!plainText) return '';
    try {
      const encrypted = CryptoJS.AES.encrypt(CryptoJS.enc.Utf8.parse(plainText), this.KEY, {
        iv: this.IV,
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7,
      });

      return encrypted.toString(); // Base64
    } catch (e) {
      return plainText;
    }
  }

  /** Securely store an encrypted item in sessionStorage */
  static setSessionItem(key: string, value: any): void {
    try {
      const strVal = typeof value === 'string' ? value : JSON.stringify(value);
      const encrypted = CryptoHelper.encrypt(strVal);
      sessionStorage.setItem(key, encrypted);
    } catch (e) {
      sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }

  /** Securely retrieve and decrypt an item from sessionStorage */
  static getSessionItem<T = string>(key: string, isJson: boolean = false): T | null {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    try {
      const decrypted = CryptoHelper.decrypt(raw);
      const val = decrypted || raw;
      return isJson ? JSON.parse(val) : (val as unknown as T);
    } catch (e) {
      try {
        return isJson ? JSON.parse(raw) : (raw as unknown as T);
      } catch {
        return raw as unknown as T;
      }
    }
  }

  /** Securely store an encrypted item in sessionStorage (no localStorage storage) */
  static setLocalItem(key: string, value: any): void {
    CryptoHelper.setSessionItem(key, value);
  }

  /** Securely retrieve and decrypt an item from sessionStorage */
  static getLocalItem<T = string>(key: string, isJson: boolean = false): T | null {
    return CryptoHelper.getSessionItem<T>(key, isJson);
  }

  /** Decrypt a potentially encrypted string to a number */
  static decryptToNumber(value: string | null | undefined): number {
    if (!value) return 0;
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    try {
      const dec = this.decrypt(value);
      const decNum = Number(dec);
      return isNaN(decNum) ? 0 : decNum;
    } catch (e) {
      return 0;
    }
  }
}

import { Injectable, signal, computed } from '@angular/core';

export type ThemeId =
  | 'ocean-blue'
  | 'royal-maroon'
  | 'forest-green'
  | 'royal-purple'
  | 'dark-slate';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bodyBg: string;
  cardBg: string;
  textColor: string;
  borderColor: string;
  headerBg: string;
  sidebarBg: string;
  primaryHover: string;
  accentHover: string;
  textSecondary: string;
  headerText: string;
  sidebarText: string;
  tableHeaderBg: string;
  tableHeaderText: string;
  tableHoverBg: string;
  buttonPrimaryBg: string;
  buttonPrimaryText: string;
  buttonPrimaryHover: string;
  accentBarBg: string;
  focusRing: string;
}

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  'ocean-blue': {
    id: 'ocean-blue',
    name: 'Ocean Blue',
    primaryColor: '#0f4c81',
    secondaryColor: '#1e3a5f',
    accentColor: '#0284c7',
    bodyBg: '#f0f7ff',
    cardBg: '#ffffff',
    textColor: '#0f172a',
    borderColor: '#cbd5e1',
    headerBg: '#ffffff',
    sidebarBg: '#ffffff',
    primaryHover: '#0a355c',
    accentHover: '#0369a1',
    textSecondary: '#475569',
    headerText: '#0f4c81',
    sidebarText: '#334155',
    tableHeaderBg: '#0f4c81',
    tableHeaderText: '#ffffff',
    tableHoverBg: '#e0f2fe',
    buttonPrimaryBg: '#0f4c81',
    buttonPrimaryText: '#ffffff',
    buttonPrimaryHover: '#0a355c',
    accentBarBg: '#0284c7',
    focusRing: 'rgba(2, 132, 199, 0.35)',
  },
  'royal-maroon': {
    id: 'royal-maroon',
    name: 'Royal Maroon',
    primaryColor: '#800020',
    secondaryColor: '#500724',
    accentColor: '#e11d48',
    bodyBg: '#fff5f5',
    cardBg: '#ffffff',
    textColor: '#1c1917',
    borderColor: '#fecdd3',
    headerBg: '#ffffff',
    sidebarBg: '#ffffff',
    primaryHover: '#5c0017',
    accentHover: '#be123c',
    textSecondary: '#57534e',
    headerText: '#800020',
    sidebarText: '#44403c',
    tableHeaderBg: '#800020',
    tableHeaderText: '#ffffff',
    tableHoverBg: '#ffe4e6',
    buttonPrimaryBg: '#800020',
    buttonPrimaryText: '#ffffff',
    buttonPrimaryHover: '#5c0017',
    accentBarBg: '#e11d48',
    focusRing: 'rgba(225, 29, 72, 0.35)',
  },
  'forest-green': {
    id: 'forest-green',
    name: 'Forest Green',
    primaryColor: '#1b4332',
    secondaryColor: '#081c15',
    accentColor: '#2d6a4f',
    bodyBg: '#f2f9f4',
    cardBg: '#ffffff',
    textColor: '#0f172a',
    borderColor: '#bbf7d0',
    headerBg: '#ffffff',
    sidebarBg: '#ffffff',
    primaryHover: '#143628',
    accentHover: '#1b4332',
    textSecondary: '#334155',
    headerText: '#1b4332',
    sidebarText: '#334155',
    tableHeaderBg: '#1b4332',
    tableHeaderText: '#ffffff',
    tableHoverBg: '#dcfce7',
    buttonPrimaryBg: '#1b4332',
    buttonPrimaryText: '#ffffff',
    buttonPrimaryHover: '#143628',
    accentBarBg: '#52b788',
    focusRing: 'rgba(45, 106, 79, 0.35)',
  },
  'royal-purple': {
    id: 'royal-purple',
    name: 'Royal Purple',
    primaryColor: '#4c1d95',
    secondaryColor: '#2e1065',
    accentColor: '#7c3aed',
    bodyBg: '#faf5ff',
    cardBg: '#ffffff',
    textColor: '#0f172a',
    borderColor: '#e9d5ff',
    headerBg: '#ffffff',
    sidebarBg: '#ffffff',
    primaryHover: '#3b0764',
    accentHover: '#6d28d9',
    textSecondary: '#475569',
    headerText: '#4c1d95',
    sidebarText: '#334155',
    tableHeaderBg: '#4c1d95',
    tableHeaderText: '#ffffff',
    tableHoverBg: '#f3e8ff',
    buttonPrimaryBg: '#4c1d95',
    buttonPrimaryText: '#ffffff',
    buttonPrimaryHover: '#3b0764',
    accentBarBg: '#7c3aed',
    focusRing: 'rgba(124, 58, 237, 0.35)',
  },
  'dark-slate': {
    id: 'dark-slate',
    name: 'Dark Slate',
    primaryColor: '#1e293b',
    secondaryColor: '#0f172a',
    accentColor: '#f97316',
    bodyBg: '#f8fafc',
    cardBg: '#ffffff',
    textColor: '#0f172a',
    borderColor: '#cbd5e1',
    headerBg: '#ffffff',
    sidebarBg: '#ffffff',
    primaryHover: '#0f172a',
    accentHover: '#ea580c',
    textSecondary: '#475569',
    headerText: '#1e293b',
    sidebarText: '#334155',
    tableHeaderBg: '#1e293b',
    tableHeaderText: '#ffffff',
    tableHoverBg: '#f1f5f9',
    buttonPrimaryBg: '#1e293b',
    buttonPrimaryText: '#ffffff',
    buttonPrimaryHover: '#0f172a',
    accentBarBg: '#f97316',
    focusRing: 'rgba(249, 115, 22, 0.35)',
  },
};

export const DEFAULT_THEME_ID: ThemeId = 'ocean-blue';
const THEME_STORAGE_KEY = 'avrp_selected_theme';

@Injectable({
  providedIn: 'root',
})
export class ThemeService {
  private readonly currentThemeSignal = signal<ThemeId>(DEFAULT_THEME_ID);
  readonly currentTheme = this.currentThemeSignal.asReadonly();
  readonly currentThemeDefinition = computed(() => THEMES[this.currentThemeSignal()]);
  readonly availableThemes: ThemeDefinition[] = Object.values(THEMES);

  constructor() {
    this.initTheme();
  }

  /**
   * Initializes theme from localStorage or default
   */
  initTheme(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY) as ThemeId;
      if (saved && this.isValidTheme(saved)) {
        this.applyTheme(saved, false);
      } else {
        this.applyTheme(DEFAULT_THEME_ID, false);
      }
    } catch (e) {
      console.warn('Could not load theme from localStorage:', e);
      this.applyTheme(DEFAULT_THEME_ID, false);
    }
  }

  /**
   * Sets the theme by ID and updates CSS variables dynamically
   */
  setTheme(themeId: string): void {
    if (!this.isValidTheme(themeId)) {
      console.warn(`Invalid theme ID "${themeId}". Ignored.`);
      return;
    }
    this.applyTheme(themeId as ThemeId, true);
  }

  private isValidTheme(id: string): id is ThemeId {
    return Object.prototype.hasOwnProperty.call(THEMES, id);
  }

  private applyTheme(themeId: ThemeId, persist: boolean): void {
    const theme = THEMES[themeId];
    if (!theme) return;

    this.currentThemeSignal.set(themeId);

    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, themeId);
      } catch (e) {
        console.warn('Could not persist theme to localStorage:', e);
      }
    }

    if (typeof document !== 'undefined') {
      const root = document.documentElement;

      // Centralized CSS Variables via setProperty()
      root.style.setProperty('--primary-color', theme.primaryColor);
      root.style.setProperty('--secondary-color', theme.secondaryColor);
      root.style.setProperty('--accent-color', theme.accentColor);
      root.style.setProperty('--body-bg', theme.bodyBg);
      root.style.setProperty('--card-bg', theme.cardBg);
      root.style.setProperty('--text-color', theme.textColor);
      root.style.setProperty('--border-color', theme.borderColor);
      root.style.setProperty('--header-bg', theme.headerBg);
      root.style.setProperty('--sidebar-bg', theme.sidebarBg);

      // Complementary attributes
      root.style.setProperty('--primary-hover', theme.primaryHover);
      root.style.setProperty('--accent-hover', theme.accentHover);
      root.style.setProperty('--text-secondary', theme.textSecondary);
      root.style.setProperty('--header-text', theme.headerText);
      root.style.setProperty('--sidebar-text', theme.sidebarText);
      root.style.setProperty('--table-header-bg', theme.tableHeaderBg);
      root.style.setProperty('--table-header-text', theme.tableHeaderText);
      root.style.setProperty('--table-hover-bg', theme.tableHoverBg);
      root.style.setProperty('--button-primary-bg', theme.buttonPrimaryBg);
      root.style.setProperty('--button-primary-text', theme.buttonPrimaryText);
      root.style.setProperty('--button-primary-hover', theme.buttonPrimaryHover);
      root.style.setProperty('--accent-bar-bg', theme.accentBarBg);
      root.style.setProperty('--focus-ring', theme.focusRing);

      // Legacy compatibility mappings
      root.style.setProperty('--theme-primary', theme.primaryColor);
      root.style.setProperty('--theme-primary-hover', theme.primaryHover);
      root.style.setProperty('--theme-accent', theme.accentColor);
      root.style.setProperty('--theme-accent-hover', theme.accentHover);
      root.style.setProperty('--theme-border', theme.borderColor);
      root.style.setProperty('--theme-bg-body', theme.bodyBg);
      root.style.setProperty('--theme-bg-surface', theme.cardBg);
      root.style.setProperty('--theme-bg-elevated', theme.bodyBg);
      root.style.setProperty('--theme-text-primary', theme.textColor);
      root.style.setProperty('--theme-text-secondary', theme.textSecondary);
      root.style.setProperty('--primary', theme.primaryColor);
      root.style.setProperty('--accent', theme.accentColor);

      root.setAttribute('data-theme', themeId);
    }
  }
}

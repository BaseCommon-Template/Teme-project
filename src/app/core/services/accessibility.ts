import { Injectable, signal } from '@angular/core';

export interface A11yState {
  darkContrast: boolean;
  invert: boolean;
  saturation: boolean;
  textSize: number;
  highlightLinks: boolean;
  hideImages: boolean;
  defaultCursor: boolean;
}

export const DEFAULT_A11Y_STATE: A11yState = {
  darkContrast: false,
  invert: false,
  saturation: false,
  textSize: 0,
  highlightLinks: false,
  hideImages: false,
  defaultCursor: false,
};

const STORAGE_KEY = 'avrp_a11y_settings';

@Injectable({
  providedIn: 'root',
})
export class AccessibilityService {
  private readonly stateSignal = signal<A11yState>({ ...DEFAULT_A11Y_STATE });
  readonly state = this.stateSignal.asReadonly();
  readonly isWidgetOpen = signal<boolean>(false);

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          this.stateSignal.set({ ...DEFAULT_A11Y_STATE, ...parsed });
          this.applySettings(this.stateSignal());
        }
      } catch (e) {
        console.error('Failed to load accessibility settings', e);
      }
    }
  }

  private applySettings(state: A11yState): void {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    root.classList.toggle('a11y-dark-contrast', state.darkContrast);
    root.classList.toggle('a11y-invert', state.invert);
    root.classList.toggle('a11y-saturate', state.saturation);
    root.classList.toggle('a11y-highlight-links', state.highlightLinks);
    root.classList.toggle('a11y-hide-images', state.hideImages);
    root.classList.toggle('a11y-default-cursor', state.defaultCursor);

    root.classList.remove('a11y-text-lg', 'a11y-text-xl', 'a11y-text-sm');
    if (state.textSize === 1) root.classList.add('a11y-text-lg');
    if (state.textSize >= 2) root.classList.add('a11y-text-xl');
    if (state.textSize === -1) root.classList.add('a11y-text-sm');
  }

  private saveAndApply(next: A11yState): void {
    this.stateSignal.set(next);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      this.applySettings(next);
    }
  }

  toggleDarkContrast(): void {
    this.saveAndApply({
      ...this.stateSignal(),
      darkContrast: !this.stateSignal().darkContrast,
      invert: false,
    });
  }

  toggleInvert(): void {
    this.saveAndApply({
      ...this.stateSignal(),
      invert: !this.stateSignal().invert,
      darkContrast: false,
    });
  }

  toggleSaturation(): void {
    this.saveAndApply({
      ...this.stateSignal(),
      saturation: !this.stateSignal().saturation,
    });
  }

  toggleHighlightLinks(): void {
    this.saveAndApply({
      ...this.stateSignal(),
      highlightLinks: !this.stateSignal().highlightLinks,
    });
  }

  toggleHideImages(): void {
    this.saveAndApply({
      ...this.stateSignal(),
      hideImages: !this.stateSignal().hideImages,
    });
  }

  toggleDefaultCursor(): void {
    this.saveAndApply({
      ...this.stateSignal(),
      defaultCursor: !this.stateSignal().defaultCursor,
    });
  }

  increaseText(): void {
    const current = this.stateSignal().textSize;
    if (current < 2) {
      this.saveAndApply({ ...this.stateSignal(), textSize: current + 1 });
    }
  }

  decreaseText(): void {
    const current = this.stateSignal().textSize;
    if (current > -1) {
      this.saveAndApply({ ...this.stateSignal(), textSize: current - 1 });
    }
  }

  resetAll(): void {
    this.saveAndApply({ ...DEFAULT_A11Y_STATE });
  }

  toggleWidget(): void {
    this.isWidgetOpen.update((v) => !v);
  }

  closeWidget(): void {
    this.isWidgetOpen.set(false);
  }
}

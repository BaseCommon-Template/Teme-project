import { Injectable, signal } from '@angular/core';

const DEFAULT_SIZE = 16;
const STEP = 2;
const MIN_LEVEL = -2;
const MAX_LEVEL = 3;

@Injectable({
  providedIn: 'root',
})
export class FontSizeService {
  private readonly levelSignal = signal<number>(0);
  readonly level = this.levelSignal.asReadonly();

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('font-level');
      if (saved) {
        const parsed = Number(saved);
        this.levelSignal.set(parsed);
        this.applyFontSize(parsed);
      } else {
        this.applyFontSize(0);
      }
    }
  }

  private applyFontSize(lvl: number): void {
    if (typeof document !== 'undefined') {
      const size = DEFAULT_SIZE + lvl * STEP;
      document.documentElement.style.fontSize = `${size}px`;
    }
  }

  private updateLevel(lvl: number): void {
    this.levelSignal.set(lvl);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('font-level', String(lvl));
      this.applyFontSize(lvl);
    }
  }

  increase(): void {
    if (this.levelSignal() < MAX_LEVEL) {
      this.updateLevel(this.levelSignal() + 1);
    }
  }

  decrease(): void {
    if (this.levelSignal() > MIN_LEVEL) {
      this.updateLevel(this.levelSignal() - 1);
    }
  }

  reset(): void {
    this.updateLevel(0);
  }
}

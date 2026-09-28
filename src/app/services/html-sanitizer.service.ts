import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class HtmlSanitizerService {
  private isInitialized = false;

  /**
   * Initializes global document listeners to sanitize HTML tags and brackets
   * on all input and textarea elements across the entire application.
   */
  init(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // Use capture phase to intercept input events before any local component handlers
    document.addEventListener('input', this.handleInput.bind(this), true);
  }

  /**
   * Strips HTML tags (<...>) and angle brackets/curly braces (< > { }) to prevent
   * HTML, script, and template injection.
   */
  sanitize(value: string): string {
    if (!value) return '';
    let sanitized = value.replace(/<\/?[^>]+(>|$)/g, '');
    sanitized = sanitized.replace(/[<>{}]/g, '');
    return sanitized;
  }

  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target || !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    // Skip input types that shouldn't be sanitized
    const type = (target as HTMLInputElement).type;
    if (type === 'file' || type === 'checkbox' || type === 'radio' || type === 'range' || type === 'color') {
      return;
    }

    // Avoid infinite recursion if an input event is dispatched programmatically
    if ((target as any).__htmlSanitizing) {
      return;
    }

    const original = target.value;
    if (!original) return;

    const sanitized = this.sanitize(original);

    if (original !== sanitized) {
      (target as any).__htmlSanitizing = true;

      const selStart = target.selectionStart;
      const newCursorPos =
        selStart !== null ? Math.min(selStart, sanitized.length) : sanitized.length;

      target.value = sanitized;

      try {
        target.setSelectionRange(newCursorPos, newCursorPos);
      } catch {
        // Ignored for input types that do not support selection ranges
      }

      // Dispatch input and change events so Angular FormControl / ngModel stay in sync
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));

      (target as any).__htmlSanitizing = false;
    }
  }
}

import { Injectable } from '@angular/core';

export interface ElementLimitsConfig {
  maxWords: number;
  maxChars: number;
  maxWordLength: number;
}

export interface LimitResult {
  text: string;
  truncated: boolean;
  wordCount: number;
  charCount: number;
}

@Injectable({
  providedIn: 'root',
})
export class WordLimitService {
  private isInitialized = false;

  // Global default limits for text inputs
  public readonly DEFAULT_INPUT_MAX_WORDS = 20;
  public readonly DEFAULT_INPUT_MAX_CHARS = 100;
  public readonly DEFAULT_INPUT_MAX_WORD_LENGTH = 30;

  // Global default limits for textareas
  public readonly DEFAULT_TEXTAREA_MAX_WORDS = 200;
  public readonly DEFAULT_TEXTAREA_MAX_CHARS = 1000;
  public readonly DEFAULT_TEXTAREA_MAX_WORD_LENGTH = 50;

  /**
   * Initialize global capture listeners for enforcing limits across all inputs and textareas.
   */
  init(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return;
    }

    if (this.isInitialized) {
      return;
    }

    this.isInitialized = true;

    // Intercept in capture phase before other listeners or components process it
    document.addEventListener('beforeinput', this.handleBeforeInput.bind(this), true);
    document.addEventListener('input', this.handleInput.bind(this), true);
    document.addEventListener('paste', this.handlePaste.bind(this), true);
  }

  /**
   * Count words in a string (sequences of non-whitespace characters).
   */
  countWords(text: string): number {
    if (!text) return 0;
    const matches = text.match(/\S+/g);
    return matches ? matches.length : 0;
  }

  /**
   * Enforce length, single-word length, and total word count limits.
   */
  enforceLimits(text: string, config: ElementLimitsConfig): LimitResult {
    if (!text) {
      return { text: '', truncated: false, wordCount: 0, charCount: 0 };
    }

    let truncated = false;
    let result = text;

    // 1. Enforce overall total character limit
    if (result.length > config.maxChars) {
      result = result.substring(0, config.maxChars);
      truncated = true;
    }

    // 2. Enforce individual word length limit (prevent unbroken spam strings like jkuhiooooooo...)
    const wordRegex = /\S+/g;
    let match: RegExpExecArray | null;
    let wordCapped = '';
    let lastIndex = 0;

    while ((match = wordRegex.exec(result)) !== null) {
      const word = match[0];
      const startIndex = match.index;
      const endIndex = startIndex + word.length;

      // Append preceding whitespace or characters
      wordCapped += result.substring(lastIndex, startIndex);

      if (word.length > config.maxWordLength) {
        wordCapped += word.substring(0, config.maxWordLength);
        truncated = true;
      } else {
        wordCapped += word;
      }

      lastIndex = endIndex;
    }
    wordCapped += result.substring(lastIndex);
    result = wordCapped;

    // 3. Enforce maximum word count
    const countRegex = /\S+/g;
    let wordCount = 0;
    let cutEndIndex = -1;

    while ((match = countRegex.exec(result)) !== null) {
      wordCount++;
      if (wordCount === config.maxWords) {
        cutEndIndex = match.index + match[0].length;
      } else if (wordCount > config.maxWords) {
        result = cutEndIndex >= 0 ? result.substring(0, cutEndIndex) : result;
        truncated = true;
        break;
      }
    }

    return {
      text: result,
      truncated,
      wordCount: Math.min(wordCount, config.maxWords),
      charCount: result.length,
    };
  }

  /**
   * Retrieve limits configuration for a target element.
   * Returns null if the element is excluded (e.g. passwords, numbers, checkboxes).
   */
  getElementConfig(element: HTMLElement): ElementLimitsConfig | null {
    if (!element) return null;

    // Check opt-out attributes or classes
    if (
      element.hasAttribute('data-no-word-limit') ||
      element.hasAttribute('data-ignore-word-limit') ||
      element.classList.contains('no-word-limit')
    ) {
      return null;
    }

    // Read any explicit custom overrides from data attributes
    const parseAttr = (attr: string): number | null => {
      if (element.hasAttribute(attr)) {
        const val = parseInt(element.getAttribute(attr) || '', 10);
        if (!isNaN(val) && val > 0) return val;
      }
      return null;
    };

    const customMaxWords = parseAttr('data-max-words');
    const customMaxChars = parseAttr('data-max-chars');
    const customMaxWordLength = parseAttr('data-max-word-length');

    // Textarea configuration
    if (element instanceof HTMLTextAreaElement) {
      const nativeMax = element.maxLength > 0 && element.maxLength < 500000 ? element.maxLength : null;
      return {
        maxWords: customMaxWords ?? this.DEFAULT_TEXTAREA_MAX_WORDS,
        maxChars: customMaxChars ?? (nativeMax ? Math.min(nativeMax, this.DEFAULT_TEXTAREA_MAX_CHARS) : this.DEFAULT_TEXTAREA_MAX_CHARS),
        maxWordLength: customMaxWordLength ?? this.DEFAULT_TEXTAREA_MAX_WORD_LENGTH,
      };
    }

    // Input configuration (only for text-like inputs)
    if (element instanceof HTMLInputElement) {
      const type = (element.type || 'text').toLowerCase();
      const isTextInput = ['text', 'search', 'url', 'tel', ''].includes(type);
      if (!isTextInput) {
        return null;
      }

      const nativeMax = element.maxLength > 0 && element.maxLength < 500000 ? element.maxLength : null;
      return {
        maxWords: customMaxWords ?? this.DEFAULT_INPUT_MAX_WORDS,
        maxChars: customMaxChars ?? (nativeMax ? Math.min(nativeMax, this.DEFAULT_INPUT_MAX_CHARS) : this.DEFAULT_INPUT_MAX_CHARS),
        maxWordLength: customMaxWordLength ?? this.DEFAULT_INPUT_MAX_WORD_LENGTH,
      };
    }

    return null;
  }

  /**
   * Handle the 'beforeinput' event to prevent typing beyond limits.
   */
  private handleBeforeInput(event: Event): void {
    const inputEvent = event as InputEvent;
    const target = inputEvent.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target || !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    const config = this.getElementConfig(target);
    if (!config) return;

    if (inputEvent.inputType && inputEvent.inputType.startsWith('insert') && inputEvent.data) {
      const val = target.value || '';
      const selStart = target.selectionStart ?? val.length;
      const selEnd = target.selectionEnd ?? val.length;

      const nextText = val.slice(0, selStart) + inputEvent.data + val.slice(selEnd);
      const result = this.enforceLimits(nextText, config);

      if (result.truncated) {
        inputEvent.preventDefault();

        // Calculate if any part of the typed/inserted text fits
        const allowedPortion = result.text.slice(selStart, result.text.length - (val.length - selEnd));
        if (allowedPortion) {
          const finalVal = val.slice(0, selStart) + allowedPortion + val.slice(selEnd);
          this.applyValue(target, finalVal, selStart + allowedPortion.length);
        }
      }
    }
  }

  /**
   * Handle the 'input' event to ensure final value strictly obeys all limits.
   */
  private handleInput(event: Event): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target || !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    if ((target as any).__wordLimitClamping) {
      return;
    }

    const config = this.getElementConfig(target);
    if (!config) return;

    const currentVal = target.value || '';
    const result = this.enforceLimits(currentVal, config);

    if (result.truncated) {
      const selStart = target.selectionStart;
      const newCursorPos = selStart !== null ? Math.min(selStart, result.text.length) : result.text.length;
      this.applyValue(target, result.text, newCursorPos);
    }
  }

  /**
   * Handle clipboard paste to clamp content to both length and word limits.
   */
  private handlePaste(event: ClipboardEvent): void {
    const target = event.target as HTMLInputElement | HTMLTextAreaElement | null;
    if (!target || !(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }

    const config = this.getElementConfig(target);
    if (!config) return;

    const pastedText = event.clipboardData?.getData('text') || '';
    if (!pastedText) return;

    const val = target.value || '';
    const selStart = target.selectionStart ?? val.length;
    const selEnd = target.selectionEnd ?? val.length;

    const prospectiveText = val.slice(0, selStart) + pastedText + val.slice(selEnd);
    const result = this.enforceLimits(prospectiveText, config);

    if (result.truncated) {
      event.preventDefault();
      const allowedPasted = result.text.slice(selStart, result.text.length - (val.length - selEnd));
      const finalVal = val.slice(0, selStart) + allowedPasted + val.slice(selEnd);
      this.applyValue(target, finalVal, selStart + allowedPasted.length);
    }
  }

  /**
   * Apply updated value to element and notify Angular forms (ngModel / FormControl).
   */
  private applyValue(
    target: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    cursorPos?: number,
  ): void {
    (target as any).__wordLimitClamping = true;

    target.value = value;

    if (cursorPos !== undefined && cursorPos !== null) {
      try {
        target.setSelectionRange(cursorPos, cursorPos);
      } catch {
        // Ignored for certain input types
      }
    }

    // Trigger input and change events so Angular's ControlValueAccessor & ngModel are updated
    target.dispatchEvent(new Event('input', { bubbles: true }));
    target.dispatchEvent(new Event('change', { bubbles: true }));

    (target as any).__wordLimitClamping = false;
  }
}

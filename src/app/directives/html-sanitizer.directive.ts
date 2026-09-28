import { Directive, HostListener, Optional, Self } from '@angular/core';
import { NgControl } from '@angular/forms';

@Directive({
  selector: 'input, textarea',
  standalone: true,
})
export class HtmlSanitizerDirective {
  constructor(@Optional() @Self() private ngControl: NgControl) {}

  @HostListener('input', ['$event'])
  onInput(event: Event): void {
    const input = event.target as HTMLInputElement | HTMLTextAreaElement;
    if (!input) return;

    // Skip input types that shouldn't be sanitized
    const type = (input as HTMLInputElement).type;
    if (type === 'file' || type === 'checkbox' || type === 'radio' || type === 'range' || type === 'color') {
      return;
    }

    const original = input.value;
    if (!original) return;

    // Strip HTML tags and any angle brackets/curly braces to prevent HTML/script/template injection
    let sanitized = original.replace(/<\/?[^>]+(>|$)/g, '');
    sanitized = sanitized.replace(/[<>{}]/g, '');

    if (original !== sanitized) {
      input.value = sanitized;
      if (this.ngControl && this.ngControl.control) {
        this.ngControl.control.setValue(sanitized, { emitEvent: false });
      } else {
        // Dispatch input event for non-reactive/non-model elements
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }
  }
}

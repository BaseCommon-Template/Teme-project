import { Directive, ElementRef, Input, OnInit, inject } from '@angular/core';

/**
 * Optional directive to customize or override word and character limits on specific inputs or textareas.
 *
 * Example:
 * <input type="text" [maxWords]="30" [maxChars]="150">
 * <textarea [maxWords]="300" [maxChars]="2000"></textarea>
 * <input type="text" noWordLimit>
 */
@Directive({
  selector: '[appWordLimit], [maxWords], [maxChars], [maxWordLength], [noWordLimit]',
  standalone: true,
})
export class WordLimitDirective implements OnInit {
  private readonly el = inject(ElementRef<HTMLInputElement | HTMLTextAreaElement>);

  @Input() maxWords?: number | string;
  @Input() maxChars?: number | string;
  @Input() maxWordLength?: number | string;
  @Input() noWordLimit?: boolean | '';

  ngOnInit(): void {
    const nativeEl = this.el.nativeElement;
    if (!nativeEl) return;

    if (this.noWordLimit !== undefined && this.noWordLimit !== false) {
      nativeEl.setAttribute('data-no-word-limit', 'true');
      return;
    }

    if (this.maxWords !== undefined && this.maxWords !== null) {
      const parsed = typeof this.maxWords === 'string' ? parseInt(this.maxWords, 10) : this.maxWords;
      if (!isNaN(parsed) && parsed > 0) {
        nativeEl.setAttribute('data-max-words', parsed.toString());
      }
    }

    if (this.maxChars !== undefined && this.maxChars !== null) {
      const parsed = typeof this.maxChars === 'string' ? parseInt(this.maxChars, 10) : this.maxChars;
      if (!isNaN(parsed) && parsed > 0) {
        nativeEl.setAttribute('data-max-chars', parsed.toString());
      }
    }

    if (this.maxWordLength !== undefined && this.maxWordLength !== null) {
      const parsed =
        typeof this.maxWordLength === 'string'
          ? parseInt(this.maxWordLength, 10)
          : this.maxWordLength;
      if (!isNaN(parsed) && parsed > 0) {
        nativeEl.setAttribute('data-max-word-length', parsed.toString());
      }
    }
  }
}

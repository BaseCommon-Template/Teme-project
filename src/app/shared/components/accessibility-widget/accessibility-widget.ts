import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccessibilityService } from '../../../core/services/accessibility';
import { FontSizeService } from '../../../core/services/font-size';

@Component({
  selector: 'app-accessibility-widget',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accessibility-widget.html',
  styleUrl: './accessibility-widget.css',
})
export class AccessibilityWidgetComponent {
  readonly a11y = inject(AccessibilityService);
  readonly fontSize = inject(FontSizeService);
}

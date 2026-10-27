import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService, ThemeDefinition } from '../../../core/services/theme.service';

@Component({
  selector: 'app-theme-palette',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './theme-palette.html',
  styleUrl: './theme-palette.css',
})
export class ThemePaletteComponent {
  readonly themeService = inject(ThemeService);

  onSelectTheme(theme: ThemeDefinition): void {
    this.themeService.setTheme(theme.id);
  }
}

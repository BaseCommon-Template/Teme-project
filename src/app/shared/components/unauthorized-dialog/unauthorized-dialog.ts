import { Component, HostListener, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-unauthorized-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './unauthorized-dialog.html',
  styleUrl: './unauthorized-dialog.css',
})
export class UnauthorizedDialogComponent {
  readonly isOpen = signal<boolean>(false);

  @HostListener('window:app:forbidden', [])
  onForbidden(): void {
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}

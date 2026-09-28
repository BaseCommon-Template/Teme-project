import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-no-access',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './no-access.html',
  styleUrl: './no-access.css',
})
export class NoAccessComponent {
  private readonly authService = inject(AuthService);

  onLogout(): void {
    this.authService.logout();
  }
}

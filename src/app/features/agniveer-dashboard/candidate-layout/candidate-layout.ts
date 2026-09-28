import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-candidate-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './candidate-layout.html',
  styleUrl: './candidate-layout.css',
})
export class CandidateLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly isCollapsed = signal<boolean>(false);

  onLogout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/userlogin']);
  }
}

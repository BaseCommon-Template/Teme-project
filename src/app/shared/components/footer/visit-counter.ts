import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-visit-counter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './visit-counter.html',
  styleUrl: './visit-counter.css',
})
export class VisitCounterComponent implements OnInit {
  readonly count = signal<number | null>(2003);

  ngOnInit(): void {
    if (typeof window === 'undefined') return;
    try {
      const stored = sessionStorage.getItem('site_visit_count');
      const currentCount = stored ? parseInt(stored, 10) : 2003;
      if (!sessionStorage.getItem('visited')) {
        const newCount = currentCount + 1;
        this.count.set(newCount);
        sessionStorage.setItem('site_visit_count', String(newCount));
        sessionStorage.setItem('visited', 'true');
      } else {
        this.count.set(currentCount);
      }
    } catch {
      this.count.set(2003);
    }
  }
}

import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService } from '../../../services/dashboard/dashboard';
import { CryptoHelper } from '../../../helpers/crypto-helper';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class FooterComponent implements OnInit {

  readonly dashboardService = inject(DashboardService);

  readonly visitorCount = signal<number>(0);

  ngOnInit(): void {
    this.loadVisitorCount();
  }

  loadVisitorCount(): void {
    const payload = {};

    this.dashboardService.getWebsiteHitCount(payload).subscribe({
      next: (res: any) => {

        try {
          let data: any = res?.data ?? res;

          if (res?.data && typeof res.data === 'string') {
            try {
              const decrypted = CryptoHelper.decrypt(res.data);

              data =
                typeof decrypted === 'string'
                  ? JSON.parse(decrypted)
                  : decrypted;
            } catch {
              // Agar data encrypted nahi hai
              data = res.data;
            }
          }

          const raw = Array.isArray(data)
            ? data[0]
            : data?.Table && Array.isArray(data.Table)
              ? data.Table[0]
              : data?.data ?? data;

          const count = Number(
            raw?.website_hit_count ??
            raw?.websiteHitCount ??
            raw?.visitor_count ??
            raw?.visitorCount ??
            raw?.total_visitors ??
            raw?.totalVisitors ??
            raw?.count ??
            0
          );

          this.visitorCount.set(count);
        } catch (error) {

          this.visitorCount.set(0);
        }
      },

      error: (error: any) => {

        this.visitorCount.set(0);
      },
    });
  }

  scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }
}
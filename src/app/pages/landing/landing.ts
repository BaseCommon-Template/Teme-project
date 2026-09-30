import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MenuService } from '../../core/services/menu';
import { LandingPage } from '../../services/landingPage/landing-page';
import { NewnotificationService } from '../../core/services/newnotification';
import { PublicMenuService } from '../../services/public-menu';
import { CryptoHelper } from '../../helpers/crypto-helper';
import { environment } from '../../../environments/environment';

export interface LandingNotificationItem {
  id: string;
  title: string;
  description?: string;
  attachmentPath?: string;
  createdAt?: string;
  isActive: boolean;
  updatedAt?: string;
}

export interface LandingOpeningItem {
  id: string;
  title: string;
  advtNo: string;
  organisationName: string;
  openingDate: string;
  closingDate: string;
  description?: string;
  vacancies?: number;
}

export interface LandingGazetteItem {
  id: string;
  narration: string;
  date: string;
  attachmentUrl?: string;
}

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
})
export class LandingComponent implements OnInit, OnDestroy {
  readonly menuService = inject(MenuService);
  readonly landingService = inject(NewnotificationService);
  readonly landingPageService = inject(LandingPage);
  readonly publicMenuService = inject(PublicMenuService);

  readonly tickerMessage = signal<string>('');

  // Banner carousel
  readonly images = [
    'assets/images/1.png',
    'assets/images/2.png',
    'assets/images/3.png',
  ];

  readonly currentSlide = signal<number>(0);

  private timer: any;

  // 3 Tabs
  readonly activeTab = signal<'notification' | 'openings' | 'archive'>('notification');

  // Selected item modal
  readonly selectedItem = signal<LandingOpeningItem | null>(null);

  // Notifications
  readonly notifications = signal<LandingNotificationItem[]>([]);

  // Current Openings
  readonly currentOpenings = signal<LandingOpeningItem[]>([]);

  // Archive
  readonly archives = signal<LandingOpeningItem[]>([]);

  ngOnInit(): void {
    if (!this.menuService.isUserLoggedIn()) {
      this.loadJobNotificationList();
    }

    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => {
        this.nextSlide();
      }, 5000);
    }

    this.loadTicker();

    this.loadLandingData();
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  loadTicker(): void {
    this.publicMenuService.getTicker().subscribe({
      next: (res: any) => {
        let msg = '';
        if (res && (res.code === 1 || res.code === '1')) {
          let decrypted: any = res.data;
          if (decrypted && typeof decrypted === 'string') {
            try {
              const dec = CryptoHelper.decrypt(decrypted);
              if (dec) {
                try {
                  decrypted = typeof dec === 'string' ? JSON.parse(dec) : dec;
                } catch {
                  decrypted = dec;
                }
              }
            } catch (e) {
              console.error('Error decrypting ticker data:', e);
            }
          }

          if (decrypted && typeof decrypted === 'object') {
            const isOpen =
              decrypted.iswebsitetickeropen ??
              decrypted.isWebsiteTickerOpen ??
              decrypted.isOpen ??
              true;
            if (isOpen === true || isOpen === 'true' || isOpen === 1) {
              msg =
                decrypted.tickertext ??
                decrypted.tickerText ??
                decrypted.ticker_text ??
                decrypted.ticker_message ??
                decrypted.message ??
                '';
            }
          } else if (typeof decrypted === 'string' && decrypted.trim()) {
            msg = decrypted.trim();
          }
        }
        this.tickerMessage.set(msg || '');
      },
      error: (err: any) => {
        console.error('Failed to load ticker message:', err);
        this.tickerMessage.set('');
      },
    });
  }

  // -----------------------------
  // Banner
  // -----------------------------

  nextSlide(): void {
    this.currentSlide.update((cur) => (cur === this.images.length - 1 ? 0 : cur + 1));
  }

  prevSlide(): void {
    this.currentSlide.update((cur) => (cur === 0 ? this.images.length - 1 : cur - 1));
  }

  goToSlide(idx: number): void {
    this.currentSlide.set(idx);
  }

  // -----------------------------
  // Tabs
  // -----------------------------

  setActiveTab(tab: 'notification' | 'openings' | 'archive'): void {
    this.activeTab.set(tab);
  }

  hasNotifications(): boolean {
    return this.notifications().length > 0;
  }

  loadJobNotificationList(): void {
    this.landingPageService.loadPublicMenusOnce();
  }

  // -----------------------------
  // Load Landing Data
  // -----------------------------

  loadLandingData(): void {
    try {
      const api$ = this.landingService.getAll();

      api$.subscribe({
        next: (response: any) => {
          try {
            let encryptedData = response;

            if (typeof response === 'object') {
              encryptedData = response?.data ?? response?.result ?? response?.response ?? response;
            }

            const decryptedData = CryptoHelper.decrypt(encryptedData);

            let finalData: any = decryptedData;

            if (typeof decryptedData === 'string') {
              try {
                finalData = JSON.parse(decryptedData);
              } catch {}
            }

            const records = Array.isArray(finalData?.records) ? finalData.records : [];

            const activeNotifications: LandingNotificationItem[] = records
              .filter((item: any) => item.IsActive === true)
              .map((item: any) => ({
                id: String(item.Id),
                title: item.NotificationTitle ?? '',
                description: item.Description ?? '',
                attachmentPath: item.AttachmentPath ?? '',
                createdAt: item.CreatedAt ?? '',
                isActive: item.IsActive === true,
                updatedAt: item.UpdatedAt ?? '',
              }));

            this.notifications.set(activeNotifications);
          } catch (error) {
            this.notifications.set([]);
          }
        },
      });
    } catch (error) {}
  }

  // -----------------------------
  // Modal
  // -----------------------------

  viewDetails(item: LandingNotificationItem | LandingOpeningItem): void {
    if ('attachmentPath' in item && item.attachmentPath) {
      const documentPath = item.attachmentPath;
      let fullUrl = documentPath;
      if (!documentPath.startsWith('http://') && !documentPath.startsWith('https://')) {
        const base = environment.signaturePath.replace(/\/api\/?$/, '/');
        fullUrl = base + (documentPath.startsWith('/') ? documentPath.slice(1) : documentPath);
      }
      window.open(fullUrl, '_blank');
    } else {
    }
  }

  closeModal(): void {
    this.selectedItem.set(null);
  }
}

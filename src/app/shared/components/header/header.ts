import {
  Component,
  OnInit,
  OnDestroy,
  ElementRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter, Subscription } from 'rxjs';
import { AccessibilityWidgetComponent } from '../accessibility-widget/accessibility-widget';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterLink, AccessibilityWidgetComponent],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class HeaderComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly eRef = inject(ElementRef);
  private bhashiniInterval: any;
  private routerSubscription!: Subscription;

  ngOnInit(): void {
    this.initBhashiniWidget();

    this.routerSubscription = this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          this.initBhashiniWidget();
        }, 100);
      });
  }

  initBhashiniWidget(): void {
    if (this.bhashiniInterval) {
      clearInterval(this.bhashiniInterval);
    }

    const attachWidget = () => {
      if (typeof document === 'undefined') return;
      const win = window as any;
      const bhashiniWidget =
        document.getElementById('bhashini-translation') ||
        win['__bhashiniWidgetNode'];

      const placeholder =
        this.eRef?.nativeElement?.querySelector('#bhashini-placeholder') ||
        document.getElementById('bhashini-placeholder');

      if (bhashiniWidget && placeholder) {
        win['__bhashiniWidgetNode'] = bhashiniWidget;

        if (bhashiniWidget.parentElement !== placeholder) {
          placeholder.appendChild(bhashiniWidget);
        }

        bhashiniWidget.style.setProperty('display', 'inline-flex', 'important');
        bhashiniWidget.style.setProperty('visibility', 'visible', 'important');
        bhashiniWidget.style.setProperty('opacity', '1', 'important');
        bhashiniWidget.style.setProperty('position', 'relative', 'important');
        bhashiniWidget.style.setProperty('z-index', '99999', 'important');

        const staticBtn = placeholder.querySelector('.static-lang-btn') as HTMLElement;
        if (staticBtn) {
          staticBtn.style.display = 'none';
        }

        const triggerBtn = (bhashiniWidget.querySelector('button, [role="button"]') || bhashiniWidget.firstElementChild) as HTMLElement;
        if (triggerBtn && !triggerBtn.querySelector('.bhashini-custom-icon')) {
          triggerBtn.childNodes.forEach((node: any) => {
            if (node.nodeType === Node.TEXT_NODE) {
              node.textContent = '';
            } else if (node.nodeType === Node.ELEMENT_NODE && node.tagName !== 'IMG') {
              (node as HTMLElement).style.display = 'none';
            }
          });

          const img = document.createElement('img');
          img.src = 'language-icon.svg';
          img.alt = 'Language Options';
          img.className = 'h-7 w-7 bhashini-custom-icon cursor-pointer object-contain';
          triggerBtn.prepend(img);
        }
      }
    };

    attachWidget();

    this.bhashiniInterval = setInterval(() => {
      attachWidget();
    }, 250);
  }

  openBhashini(): void {
    if (typeof document === 'undefined') return;
    const win = window as any;
    const bhashiniWidget =
      document.getElementById('bhashini-translation') ||
      win['__bhashiniWidgetNode'];
    if (bhashiniWidget) {
      const clickable =
        (bhashiniWidget.querySelector('button, [role="button"], a') as HTMLElement) ||
        bhashiniWidget;
      clickable?.click();
    }
  }

  skipToContent(): void {
    if (typeof document !== 'undefined') {
      const main =
        document.getElementById('maincontent') ||
        document.querySelector('main');
      main?.scrollIntoView({ behavior: 'smooth' });
    }
  }

  ngOnDestroy(): void {
    if (this.bhashiniInterval) {
      clearInterval(this.bhashiniInterval);
    }
    if (typeof document !== 'undefined') {
      const win = window as any;
      const bhashiniWidget =
        document.getElementById('bhashini-translation') ||
        win['__bhashiniWidgetNode'];

      if (bhashiniWidget) {
        win['__bhashiniWidgetNode'] = bhashiniWidget;
        if (this.eRef?.nativeElement?.contains(bhashiniWidget)) {
          document.body.appendChild(bhashiniWidget);
        }
      }
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}

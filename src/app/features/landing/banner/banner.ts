import { Component, OnDestroy, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './banner.html',
  styleUrl: './banner.css',
})
export class BannerComponent implements OnInit, OnDestroy {
  readonly images = [
    'assets/images/1.png',
    'assets/images/2.png',
    'assets/images/3.png',
  ];

  readonly currentSlide = signal<number>(0);
  private timer: any;

  ngOnInit(): void {
    if (typeof window !== 'undefined') {
      this.timer = setInterval(() => {
        this.nextSlide();
      }, 5000);
    }
  }

  ngOnDestroy(): void {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  nextSlide(): void {
    this.currentSlide.update((cur) => (cur === this.images.length - 1 ? 0 : cur + 1));
  }

  prevSlide(): void {
    this.currentSlide.update((cur) => (cur === 0 ? this.images.length - 1 : cur - 1));
  }

  goToSlide(idx: number): void {
    this.currentSlide.set(idx);
  }
}

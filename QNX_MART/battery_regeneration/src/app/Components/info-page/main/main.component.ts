import { Component } from '@angular/core';

@Component({
  selector: 'app-main',
  standalone: true,
  templateUrl: './main.component.html'
})
export class MainComponent {
  isHovered = false;
  currentCount = 0;
  targetCount = 16300000;   // ₹36,00,000
  displayCount = '0';
  animating = false;
  animationId: number | null = null;
  startTime = 0;
  duration = 2000;

  onCircleEnter() {
    this.isHovered = true;
    if (this.animating) return;
    this.animating = true;
    this.currentCount = 0;
    this.startTime = performance.now();
    this.animateCount(this.startTime);
  }

  onCircleLeave() {
    this.isHovered = false;
    this.animating = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    this.currentCount = 0;
    this.displayCount = '0';
  }

  private animateCount(now: number) {
    if (!this.animating) return;
    const elapsed = now - this.startTime;
    const progress = Math.min(elapsed / this.duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    this.currentCount = Math.floor(eased * this.targetCount);
    this.displayCount = this.formatNumber(this.currentCount);
    if (progress < 1) {
      this.animationId = requestAnimationFrame((t) => this.animateCount(t));
    } else {
      this.currentCount = this.targetCount;
      this.displayCount = this.formatNumber(this.targetCount);
      this.animating = false;
    }
  }

  private formatNumber(num: number): string {
    const x = num.toString();
    const lastThree = x.substring(x.length - 3);
    const otherNumbers = x.substring(0, x.length - 3);
    if (otherNumbers !== '') {
      return '₹' + otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
    }
    return '₹' + lastThree;
  }
}
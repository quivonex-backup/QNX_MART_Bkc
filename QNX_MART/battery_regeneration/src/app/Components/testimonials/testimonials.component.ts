import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ElementRef, QueryList, Renderer2, ViewChild, ViewChildren } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-testimonials',
  imports: [FormsModule, CommonModule],
  templateUrl: './testimonials.component.html',
  styleUrl: './testimonials.component.css'
})
export class TestimonialsComponent implements AfterViewInit {

  currentIndex = 0;
  slideInterval: any;
  slideDuration = 5000; // 5 seconds

  // Reference to the elements
  track!: HTMLElement;   // Use `!` to tell TypeScript it will be assigned later
  prevBtn!: HTMLElement;
  nextBtn!: HTMLElement;
  dots!: NodeListOf<HTMLElement>;
  sliderContainer!: HTMLElement;

  constructor(private el: ElementRef, private renderer: Renderer2) { }

  ngAfterViewInit() {
    this.track = this.el.nativeElement.querySelector('.testimonial-track');
    this.prevBtn = this.el.nativeElement.querySelector('.slider-btn.prev');
    this.nextBtn = this.el.nativeElement.querySelector('.slider-btn.next');
    this.dots = this.el.nativeElement.querySelectorAll('.slider-dot');
    this.sliderContainer = this.el.nativeElement.querySelector('.testimonial-slider-container');

    this.initSlider();
  }

  // Initialize Slider
  initSlider() {
    this.updateSlider();
    this.startAutoSlide();

    // Bind Events
    this.renderer.listen(this.prevBtn, 'click', () => this.prevSlide());
    this.renderer.listen(this.nextBtn, 'click', () => this.nextSlide());

    this.dots.forEach((dot, index) => {
      this.renderer.listen(dot, 'click', () => this.goToSlide(index));
    });

    // Pause on hover
    this.renderer.listen(this.sliderContainer, 'mouseenter', () => this.pauseAutoSlide());
    this.renderer.listen(this.sliderContainer, 'mouseleave', () => this.startAutoSlide());
  }

  // Update Slider with correct transform and active dot
  updateSlider() {
    if (this.track) {
      this.track.style.transform = `translateX(-${this.currentIndex * 100}%)`;
    }

    this.dots.forEach((dot, index) => {
      dot.classList.toggle('active', index === this.currentIndex);
      dot.style.background = index === this.currentIndex ? '#3498db' : '#cbd5e1';
    });
  }

  // Go to next slide
  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.dots.length;
    this.updateSlider();
  }

  // Go to previous slide
  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.dots.length) % this.dots.length;
    this.updateSlider();
  }

  // Jump to a specific slide by index
  goToSlide(index: number) {
    this.currentIndex = index;
    this.updateSlider();
  }

  // Start the auto sliding
  startAutoSlide() {
    this.clearAutoSlide();
    this.slideInterval = setInterval(() => this.nextSlide(), this.slideDuration);
  }

  // Pause the auto sliding
  pauseAutoSlide() {
    clearInterval(this.slideInterval);
  }

  // Clear existing auto slide interval
  clearAutoSlide() {
    if (this.slideInterval) {
      clearInterval(this.slideInterval);
    }
  }
}
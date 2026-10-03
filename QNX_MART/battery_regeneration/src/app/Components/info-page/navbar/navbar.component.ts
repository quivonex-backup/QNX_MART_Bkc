import { Component, Output, EventEmitter, Renderer2, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  @Output() termsClick = new EventEmitter<string>();
  @Output() scrollTo = new EventEmitter<string>();

  private unlistenShow: (() => void) | null = null;
  private unlistenHide: (() => void) | null = null;

  constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) {}

  ngAfterViewInit(): void {
    const navbarCollapse = this.document.getElementById('navbarNav');
    if (navbarCollapse) {
      // When the mobile menu starts opening
      this.unlistenShow = this.renderer.listen(navbarCollapse, 'show.bs.collapse', () => {
        const navbar = this.document.getElementById('navbarQNX');
        if (navbar) {
          this.renderer.addClass(navbar, 'mobile-menu-open');
        }
      });

      // When the mobile menu starts closing
      this.unlistenHide = this.renderer.listen(navbarCollapse, 'hide.bs.collapse', () => {
        const navbar = this.document.getElementById('navbarQNX');
        if (navbar) {
          this.renderer.removeClass(navbar, 'mobile-menu-open');
        }
      });
    }
  }

  ngOnDestroy(): void {
    if (this.unlistenShow) this.unlistenShow();
    if (this.unlistenHide) this.unlistenHide();
  }

  onNavLinkClick(event: Event, target: string) {
    event.preventDefault();
    this.scrollTo.emit(target);
  }

  onTermsClick(role: string) {
    this.termsClick.emit(role);
  }
}
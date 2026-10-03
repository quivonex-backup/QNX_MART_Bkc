import { Component, Output, EventEmitter, Renderer2, Inject, AfterViewInit, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './navbar.component.html'
})
export class NavbarComponent implements AfterViewInit, OnDestroy {
  @Output() termsClick = new EventEmitter<string>();
  @Output() scrollTo = new EventEmitter<string>();
  @Output() languageChange = new EventEmitter<string>();

  selectedLanguage = 'English';
  showLanguageMenu = false;

  private unlistenShow: (() => void) | null = null;
  private unlistenHide: (() => void) | null = null;

  constructor(private renderer: Renderer2, @Inject(DOCUMENT) private document: Document) { }

  ngAfterViewInit(): void {
    const navbarCollapse = this.document.getElementById('navbarNav');
    if (navbarCollapse) {
      this.unlistenShow = this.renderer.listen(navbarCollapse, 'show.bs.collapse', () => {
        const navbar = this.document.getElementById('navbarQNX');
        if (navbar) this.renderer.addClass(navbar, 'mobile-menu-open');
      });
      this.unlistenHide = this.renderer.listen(navbarCollapse, 'hide.bs.collapse', () => {
        const navbar = this.document.getElementById('navbarQNX');
        if (navbar) this.renderer.removeClass(navbar, 'mobile-menu-open');
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

  onTermsClick(event: Event, role: string) {
    event.preventDefault();
    this.termsClick.emit(role);
  }




  // =========================================
  // LANGUAGE MENU
  // =========================================

  toggleLanguageMenu(event: Event): void {
    event.stopPropagation();
    this.showLanguageMenu = !this.showLanguageMenu;
  }

changeLanguage(
  language: string,
  languageName: string,
  event: Event
): void {

  event.stopPropagation();

  this.selectedLanguage =
    languageName;

  this.showLanguageMenu = false;

  // Parent page ला language सांगणे
  this.languageChange.emit(language);
}

}
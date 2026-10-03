import { Component, AfterViewInit, OnDestroy, ViewEncapsulation, Inject } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import * as AOS from 'aos';

import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { TermsModalComponent } from './terms-modal/terms-modal.component';
import { MainComponent } from './main/main.component';

@Component({
  selector: 'app-info-partner',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    TermsModalComponent,
    MainComponent
  ],
  templateUrl: './info-partner.component.html',
  styleUrls: ['./info-partner.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class InfoPartnerComponent implements AfterViewInit, OnDestroy {
  showTerms = false;
  selectedRole = 'marketing-partner';

  private googleScriptId = 'qnx-google-translate-script';
  private translateContainerId = 'qnx-google-translate-container';
  private translateReady = false;
  private translateLoading = false;

  constructor(
    @Inject(DOCUMENT)
    private document: Document
  ) { }

  ngAfterViewInit(): void {
    AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 80 });
    window.addEventListener('scroll', this.onScroll);

    this.clearGoogleTranslateLanguage();
    this.loadGoogleTranslate();
  }

  ngOnDestroy(): void {
    window.removeEventListener('scroll', this.onScroll);
  }

  onScroll = () => {
    const navbar = document.getElementById('navbarQNX');
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    }
  };

  onScrollTo(targetId: string) {
    const target = document.getElementById(targetId);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    const navCollapse = document.getElementById('navbarNav');
    if (navCollapse?.classList.contains('show')) {
      navCollapse.classList.remove('show');
    }
  }

  onTermsRequest(role: string) {
    this.selectedRole = role;
    this.showTerms = true;
  }

  onCloseTerms() {
    this.showTerms = false;
  }

  private clearGoogleTranslateLanguage(): void {
    this.deleteGoogleCookie('googtrans');
    this.document.body.style.top = '0px';
    this.document.body.style.marginTop = '0px';
    this.document.documentElement.style.marginTop = '0px';

    const banners = this.document.querySelectorAll('.goog-te-banner-frame');
    banners.forEach((element) => {
      (element as HTMLElement).style.display = 'none';
    });
  }

  // ==========================================
  // LANGUAGE CHANGE – FIXED TYPE
  // ==========================================
  onLanguageChange(language: any): void {
    // Force it to a string (the navbar emits a string)
    const lang = typeof language === 'string' ? language : String(language);
    console.log('Requested language:', lang);
    this.translatePage(lang);
  }

  private loadGoogleTranslate(): void {
    let container = this.document.getElementById(this.translateContainerId);
    if (!container) {
      container = this.document.createElement('div');
      container.id = this.translateContainerId;
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '-9999px';
      container.style.width = '1px';
      container.style.height = '1px';
      container.style.opacity = '0';
      container.style.pointerEvents = 'none';
      this.document.body.appendChild(container);
    }

    if ((window as any).google && (window as any).google.translate) {
      console.log('Google Translate API already available');
      this.initializeGoogleTranslate();
      return;
    }

    if (this.translateLoading) {
      console.log('Google Translate is already loading');
      return;
    }

    const existingScript = this.document.getElementById(this.googleScriptId);
    if (existingScript) {
      console.log('Google Translate script already exists');
      this.waitForGoogleTranslate();
      return;
    }

    this.translateLoading = true;

    (window as any).googleTranslateElementInit = () => {
      console.log('Google Translate callback fired');
      this.translateLoading = false;
      this.initializeGoogleTranslate();
    };

    const script = this.document.createElement('script');
    script.id = this.googleScriptId;
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;

    script.onload = () => {
      console.log('Google Translate script loaded');
      this.waitForGoogleTranslate();
    };

    script.onerror = () => {
      console.error('Google Translate script failed to load');
      this.translateLoading = false;
    };

    this.document.body.appendChild(script);
  }

  private waitForGoogleTranslate(attempts = 0): void {
    const maxAttempts = 50;
    const google = (window as any).google;
    if (google && google.translate) {
      console.log('Google Translate API available');
      this.initializeGoogleTranslate();
      return;
    }
    if (attempts >= maxAttempts) {
      console.error('Google Translate API timeout');
      return;
    }
    setTimeout(() => {
      this.waitForGoogleTranslate(attempts + 1);
    }, 200);
  }

  private initializeGoogleTranslate(): void {
    const google = (window as any).google;
    if (!google?.translate?.TranslateElement) {
      console.error('Google Translate API not available');
      return;
    }

    const container = this.document.getElementById(this.translateContainerId);
    if (!container) {
      console.error('Google Translate container not found');
      return;
    }

    if (container.querySelector('.goog-te-combo')) {
      console.log('Google Translate already initialized');
      this.translateReady = true;
      return;
    }

    try {
      const TranslateElement = google.translate.TranslateElement;
      console.log('Creating Google Translate element...');
      new TranslateElement(
        {
          pageLanguage: 'en',
          includedLanguages: 'en,mr,hi',
          autoDisplay: false
        },
        this.translateContainerId
      );
      this.waitForTranslateSelect();
    } catch (error) {
      console.error('Google Translate initialization error:', error);
    }
  }

  private waitForTranslateSelect(attempts = 0): void {
    const maxAttempts = 50;
    const select = this.document.querySelector('.goog-te-combo') as HTMLSelectElement | null;
    if (select) {
      console.log('Google Translate READY');
      this.translateReady = true;
      return;
    }
    if (attempts >= maxAttempts) {
      console.error('Google Translate dropdown was not created');
      return;
    }
    setTimeout(() => {
      this.waitForTranslateSelect(attempts + 1);
    }, 200);
  }

  private translatePage(language: string): void {
    let attempts = 0;
    const maxAttempts = 30;

    const tryTranslate = () => {
      const select = this.document.querySelector('.goog-te-combo') as HTMLSelectElement | null;

      if (select) {
        console.log('Changing language to:', language);

        const option = Array.from(select.options).find(option => option.value === language);
        if (!option) {
          console.error('Language not available:', language);
          console.log('Available:', Array.from(select.options).map(o => `${o.text} = ${o.value}`));
          return;
        }

        select.value = language;
        select.dispatchEvent(new Event('change', { bubbles: true }));
        this.translateReady = true;
        return;
      }

      attempts++;
      if (attempts < maxAttempts) {
        setTimeout(tryTranslate, 200);
      } else {
        console.error('Google Translate select not ready');
      }
    };

    tryTranslate();
  }

  private deleteGoogleCookie(name: string): void {
    const expires = 'Thu, 01 Jan 1970 00:00:00 UTC';
    this.document.cookie = `${name}=;expires=${expires};path=/`;
    this.document.cookie = `${name}=;expires=${expires};path=/;domain=${this.document.location.hostname}`;

    const hostname = this.document.location.hostname;
    if (hostname.includes('.')) {
      const domain = '.' + hostname;
      this.document.cookie = `${name}=;expires=${expires};path=/;domain=${domain}`;
    }
  }
}
import { Injectable, NgZone } from '@angular/core';

declare global {
  interface Window {
    google: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class LanguageService {

  private currentLanguage = 'en';

  private googleReady = false;

  constructor(
    private zone: NgZone
  ) {

    this.currentLanguage = 'en';

    this.waitForGoogle();

  }


  // =====================================================
  // WAIT FOR GOOGLE TRANSLATE
  // =====================================================

  private waitForGoogle(): void {

    let attempts = 0;

    const timer = setInterval(() => {

      attempts++;

      if (
        window.google &&
        window.google.translate
      ) {

        clearInterval(timer);

        this.googleReady = true;

        this.waitForGoogleSelect();

        return;
      }

      if (attempts >= 50) {

        clearInterval(timer);

        console.warn(
          'Google Translate not loaded'
        );

      }

    }, 300);

  }


  // =====================================================
  // WAIT FOR GOOGLE SELECT
  // =====================================================

  private waitForGoogleSelect(): void {

    let attempts = 0;

    const timer = setInterval(() => {

      attempts++;

      const select =
        document.querySelector(
          '.goog-te-combo'
        ) as HTMLSelectElement | null;

      if (select) {

        clearInterval(timer);

        // Apply saved language
        setTimeout(() => {

          this.applyLanguage(
            this.currentLanguage
          );

        }, 500);

        return;
      }

      if (attempts >= 50) {

        clearInterval(timer);

        console.warn(
          'Google Translate select not found'
        );

      }

    }, 300);

  }


  // =====================================================
  // CHANGE LANGUAGE
  // =====================================================

  changeLanguage(language: string): void {

    if (
      !['en', 'mr', 'hi'].includes(language)
    ) {

      return;

    }

    // IMPORTANT
    this.currentLanguage = language;

    this.currentLanguage = language;

    this.applyLanguage(language);

  }


  // =====================================================
  // GET CURRENT LANGUAGE
  // =====================================================

  getLanguage(): string {

    // Always read latest value
     return this.currentLanguage;


  }


  // =====================================================
  // APPLY LANGUAGE
  // =====================================================

  private applyLanguage(
    language: string
  ): void {

    const select =
      document.querySelector(
        '.goog-te-combo'
      ) as HTMLSelectElement | null;

    if (!select) {

      setTimeout(() => {

        this.applyLanguage(language);

      }, 500);

      return;

    }


    this.zone.runOutsideAngular(() => {

      // Google Translate language
      select.value = language;

      select.dispatchEvent(
        new Event('change', {
          bubbles: true
        })
      );

    });

  }

}
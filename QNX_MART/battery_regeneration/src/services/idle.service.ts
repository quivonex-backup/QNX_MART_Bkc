import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { AlertService } from './alert.service';

@Injectable({
  providedIn: 'root'
})
export class IdleService {

  // Change only this value
  private readonly IDLE_MINUTES = 10;
  // Automatically converted to milliseconds
  private readonly IDLE_TIMEOUT = this.IDLE_MINUTES * 60 * 1000;

  private timeout: any;
  private listenersAdded = false;

  constructor(
    private router: Router,
    private ngZone: NgZone,
    private alertService: AlertService
  ) {}

  /**
   * Start inactivity monitoring
   */
  startWatching(): void {
    this.resetTimer();

    if (this.listenersAdded) {
      return;
    }

    this.listenersAdded = true;
    const events = [
      'mousemove',
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      window.addEventListener(event, this.activityListener);
    });
  }

  /**
   * Stop monitoring
   */
  stopWatching(): void {
    clearTimeout(this.timeout);

    const events = [
      'mousemove',
      'mousedown',
      'keypress',
      'scroll',
      'touchstart',
      'click'
    ];

    events.forEach(event => {
      window.removeEventListener(event, this.activityListener);
    });

    this.listenersAdded = false;
  }

  /**
   * User activity detected
   */
  private activityListener = () => {
    this.resetTimer();
  };

  /**
   * Reset 10-minute timer
   */
  private resetTimer(): void {
    clearTimeout(this.timeout);

    this.timeout = setTimeout(() => {
      this.logout();

    }, this.IDLE_TIMEOUT);
  }

  /**
   * Auto logout
   */
  private logout(): void {
    this.stopWatching();

    sessionStorage.clear();

    localStorage.clear();

    this.ngZone.run(() => {
      this.alertService.unialert(
        'You have been logged out because you were inactive.'
      );
      this.router.navigate(['/login']);
    });
  }

}
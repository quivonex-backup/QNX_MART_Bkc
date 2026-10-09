// import { Component, OnInit } from '@angular/core';
// import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
// import { NavbarComponent } from './Components/navbar/navbar.component';
// import { FooterComponent } from './Components/footer/footer.component';
// import { SellerRegistrationService } from '../services/seller-registration.service';

// @Component({
//   selector: 'app-root',
//   imports: [RouterOutlet, NavbarComponent, FooterComponent],
//   templateUrl: './app.component.html',
//   styleUrl: './app.component.css'
// })
// export class AppComponent implements OnInit {
//   title = 'battery_regeneration';

//   constructor(
//     private router: Router,
//     private sellerService: SellerRegistrationService
//   ) {
//     this.router.events.subscribe(event => {
//       if (event instanceof NavigationEnd) {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//       }
//     });
//   }

//   ngOnInit() {
//     this.loadSellerIdIfLoggedIn();
//   }

//   private loadSellerIdIfLoggedIn() {
//     const token = sessionStorage.getItem('access_token');
//     const userId = sessionStorage.getItem('user_id');
//     if (!token || !userId) return;

//     // already cached — no need to call API again
//     if (sessionStorage.getItem('seller_id')) return;

//     this.sellerService.getSellerList().subscribe({
//       next: (res: any) => {
//         if (res.status === 'success' && res.data?.length) {
//           // pick latest registration
//           const sorted = [...res.data].sort(
//             (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
//           );
//           sessionStorage.setItem('seller_id', String(sorted[0].id));
//         }
//       },
//       error: () => { } // silent fail — not critical
//     });
//   }
// }



import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { NavbarComponent } from './Components/navbar/navbar.component';
import { FooterComponent } from './Components/footer/footer.component';
import { SellerRegistrationService } from '../services/seller-registration.service';
import { filter } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { IdleService } from '../services/idle.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent, FooterComponent,RouterLinkActive,RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'QNX MART';

  hideLayout = false;  // ← new property

  constructor(
    private router: Router,
    private sellerService: SellerRegistrationService,
    private idleService: IdleService  
  ) {
    // Scroll to top on navigation
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    // ─── Detect route data to hide/show layout ───
    this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => {
        let route = this.router.routerState.root.snapshot;
        while (route.firstChild) {
          route = route.firstChild;
        }
        this.hideLayout = route.data['hideLayout'] === true;
        const disableIdleTimeout = route.data['disableIdleTimeout'] === true;
        if (disableIdleTimeout) {
            this.idleService.stopWatching();
        } else {
            if (sessionStorage.getItem('access_token')) {
                this.idleService.startWatching();
            }
        }
      });
  }

  ngOnInit() {
    this.loadSellerIdIfLoggedIn();
    // const token = sessionStorage.getItem('access_token');
    // if (token) {
    //   this.idleService.startWatching();
    // }
  }

  private loadSellerIdIfLoggedIn() {
    const token = sessionStorage.getItem('access_token');
    const userId = sessionStorage.getItem('user_id');
    if (!token || !userId) return;

    if (sessionStorage.getItem('seller_id')) return;

    this.sellerService.getSellerList().subscribe({
      next: (res: any) => {
        if (res.status === 'success' && res.data?.length) {
          const sorted = [...res.data].sort(
            (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          sessionStorage.setItem('seller_id', String(sorted[0].id));
        }
      },
      error: () => { }
    });
  }
}
import { Component, AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as AOS from 'aos';

import { NavbarComponent } from './navbar/navbar.component';
import { FooterComponent } from './footer/footer.component';
import { TermsModalComponent } from './terms-modal/terms-modal.component';
import { MainComponent } from './main/main.component';

@Component({
  selector: 'app-info-page',
  standalone: true,
  imports: [
    CommonModule,
    NavbarComponent,
    FooterComponent,
    TermsModalComponent,
    MainComponent
  ],
  templateUrl: './info-page.component.html',
  styleUrls: ['./info-page.component.css'],
  encapsulation: ViewEncapsulation.None   // global styles, scoped by #qnx-info-page
})
export class InfoPageComponent implements AfterViewInit {
  showTerms = false;
  selectedRole = '';

  ngAfterViewInit(): void {
    AOS.init({
      duration: 700,
      easing: 'ease-out-cubic',
      once: true,
      offset: 80,
    });
    window.addEventListener('scroll', this.onScroll);
  }

  onScroll = () => {
    const navbar = document.getElementById('navbarQNX');
    if (navbar) {
      navbar.classList.toggle('scrolled', window.scrollY > 60);
    }
  };

  // Called from NavbarComponent to scroll to a section
  onScrollTo(targetId: string) {
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Collapse mobile menu if open
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
}
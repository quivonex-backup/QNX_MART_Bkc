import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AboutService } from '../../../services/about.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-about',
  imports: [RouterLink],
  templateUrl: './about.component.html',
  styleUrl: './about.component.css'
})
export class AboutComponent implements OnInit {

  totalCompanies = 0;
  approvedProducts = 0;
  marketingPartners = 0;
  totalUsers = 0;
  loading = true;

  constructor(private aboutService: AboutService) {}

  ngOnInit(): void {
    this.fetchStats();
  }

  fetchStats(): void {
    this.loading = true;

    forkJoin({
      companies: this.aboutService.getCompanies(),
      products: this.aboutService.getApprovedProductCount(),
      partners: this.aboutService.getApprovedMarketingPartnersCount(),
      users: this.aboutService.getUserCount()
    }).subscribe({
      next: (results) => {
        this.totalCompanies = results.companies?.total ?? 0;
        this.approvedProducts = results.products?.approved_product_count ?? 0;
        this.marketingPartners = results.partners?.count ?? 0;
        this.totalUsers = results.users?.count ?? 0;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error fetching about stats:', err);
        this.loading = false;
      }
    });
  }
}
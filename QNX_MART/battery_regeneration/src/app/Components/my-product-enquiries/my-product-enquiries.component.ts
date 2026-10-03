import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { EnquiryService } from '../../../services/enquiry.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-my-product-enquiries',
  imports: [FormsModule, CommonModule],
  templateUrl: './my-product-enquiries.component.html',
  styleUrl: './my-product-enquiries.component.css'
})
export class MyProductEnquiriesComponent implements OnInit {

  enquiries: any[] = [];
  loading = true;
  filteredEnquiries: any[] = [];
  selectedFilter: string = 'all';
  searchQuery: string = '';

  constructor(private enquiryService: EnquiryService,
    private location: Location  ) { }

  ngOnInit(): void {
    this.loadEnquiries();
  }

  loadEnquiries() {
    this.loading = true;
    this.enquiryService.getMyProductEnquiries({}).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status) {
          this.enquiries = res.data.map((enquiry: any) => ({
            ...enquiry,
            expanded: false
          }));
          this.applyFilters();
        }
      },
      error: (err) => {
        this.loading = false;
        console.log(err);
      }
    });
  }

  toggleExpand(enquiry: any) {
    enquiry.expanded = !enquiry.expanded;
  }

  filterEnquiries(status: string) {
    this.selectedFilter = status;
    this.applyFilters();
  }

  onSearch() {
    this.applyFilters();
  }

  clearSearch() {
    this.searchQuery = '';
    this.applyFilters();
  }

  applyFilters() {
    let result = this.enquiries;

    if (this.selectedFilter !== 'all') {
      result = result.filter(
        (item: any) => item.status?.toLowerCase() === this.selectedFilter.toLowerCase()
      );
    }

    if (this.searchQuery.trim()) {
      const q = this.searchQuery.trim().toLowerCase();
      result = result.filter((item: any) =>
        item.product_name?.toLowerCase().includes(q)
      );
    }

    this.filteredEnquiries = result;
  }

  getCount(status: string): number {
    if (status === 'all') {
      return this.enquiries.length;
    }
    return this.enquiries.filter(
      (item: any) => item.status?.toLowerCase() === status.toLowerCase()
    ).length;
  }

  // Add this method:
  goBack() {
      this.location.back();
  }
}
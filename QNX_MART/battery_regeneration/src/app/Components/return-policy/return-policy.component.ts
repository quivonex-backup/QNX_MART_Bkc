import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AlertService } from '../../../services/alert.service';

interface ReturnCategory {
  icon: string;
  title: string;
  window: string;
  description: string;
  eligible: boolean;
  conditions: string[];
}

interface FAQItem {
  question: string;
  answer: string;
  open: boolean;
}

@Component({
  selector: 'app-return-policy',
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './return-policy.component.html',
  styleUrl: './return-policy.component.css'
})
export class ReturnPolicyComponent implements OnInit {

  activeTab: 'policy' | 'request' | 'track' | 'faq' = 'policy';
  currentYear = new Date().getFullYear();

  // ===== RETURN REQUEST FORM =====
  requestStep = 1; // 1 = order info, 2 = reason, 3 = method, 4 = confirm, 5 = submitted

  returnForm = {
    orderId: '',
    email: '',
    itemName: '',
    reason: '',
    reasonDetail: '',
    hasImages: false,
    refundMethod: '',
    agreeToPolicy: false
  };

  uploadedImages: string[] = [];
  submittedRequestId = '';

  // ===== TRACK RETURN =====
  trackOrderId = '';
  trackEmail = '';
  trackResult: any = null;
  trackSearched = false;

  // ===== ELIGIBILITY CHECKER =====
  checkerCategory = '';
  checkerDays = '';
  eligibilityResult: 'eligible' | 'ineligible' | null = null;

  // ===== RETURN CATEGORIES =====
  returnCategories: ReturnCategory[] = [
    {
      icon: 'bi-phone',
      title: 'Electronics',
      window: '7 days',
      description: 'Smartphones, laptops, accessories',
      eligible: true,
      conditions: ['Item must be in original packaging', 'All accessories included', 'No physical damage', 'Manufacturing defect proof required']
    },
    {
      icon: 'bi-bag',
      title: 'Fashion & Apparel',
      window: '30 days',
      description: 'Clothing, footwear, bags',
      eligible: true,
      conditions: ['Tags must be intact', 'Unwashed and unworn', 'Original packaging required', 'Free size exchanges available']
    },
    {
      icon: 'bi-house',
      title: 'Home & Kitchen',
      window: '10 days',
      description: 'Furniture, appliances, cookware',
      eligible: true,
      conditions: ['Item must be unused', 'Original packaging required', 'All parts included', 'Assembly void may affect returns']
    },
    {
      icon: 'bi-book',
      title: 'Books & Media',
      window: '10 days',
      description: 'Books, CDs, digital media',
      eligible: true,
      conditions: ['Sealed/unread condition only', 'Digital downloads non-returnable', 'Educational books returnable within 7 days']
    },
    {
      icon: 'bi-bicycle',
      title: 'Sports & Fitness',
      window: '10 days',
      description: 'Equipment, activewear, gear',
      eligible: true,
      conditions: ['Unused and in original packaging', 'Equipment must not be assembled', 'Hygiene products non-returnable']
    },
    {
      icon: 'bi-droplet',
      title: 'Health & Beauty',
      window: '10 days',
      description: 'Skincare, supplements, medical',
      eligible: false,
      conditions: ['Opened personal care items non-returnable', 'Sealed products returnable within 10 days', 'Expired products are exceptions']
    },
    {
      icon: 'bi-lightning',
      title: 'Automotive',
      window: '7 days',
      description: 'Car parts, accessories, batteries',
      eligible: true,
      conditions: ['Installed parts non-returnable', 'Must be in original condition', 'Compatibility issues accepted with proof']
    },
    {
      icon: 'bi-gift',
      title: 'Toys & Games',
      window: '15 days',
      description: 'Toys, board games, puzzles',
      eligible: true,
      conditions: ['Sealed packaging required for electronics toys', 'Damaged-in-transit returned within 48 hours', 'Safety recalls are unconditional']
    }
  ];

  // ===== RETURN REASONS =====
  returnReasons = [
    { value: 'defective', label: '🔧 Defective / Not Working', needsProof: true },
    { value: 'wrong_item', label: '📦 Wrong Item Received', needsProof: true },
    { value: 'damaged', label: '💥 Item Damaged in Transit', needsProof: true },
    { value: 'not_as_described', label: '📋 Not as Described', needsProof: false },
    { value: 'size_fit', label: '👗 Size / Fit Issue', needsProof: false },
    { value: 'missing_parts', label: '🔩 Missing Parts / Accessories', needsProof: true },
    { value: 'changed_mind', label: '💭 Changed My Mind', needsProof: false },
    { value: 'quality', label: '⚠️ Quality Not Satisfactory', needsProof: false }
  ];

  get selectedReasonNeedsProof(): boolean {
    const r = this.returnReasons.find(r => r.value === this.returnForm.reason);
    return r?.needsProof ?? false;
  }

  getReasonLabel(value: string): string {
    return this.returnReasons.find(r => r.value === value)?.label || value;
  }

  getRefundLabel(value: string): string {
    return this.refundMethods.find(m => m.value === value)?.label || value;
  }

  // ===== REFUND METHODS =====
  refundMethods = [
    { value: 'original', label: 'Original Payment Method', desc: '5–7 business days', icon: 'bi-credit-card-2-back' },
    // { value: 'wallet', label: 'QNX Wallet Credit', desc: 'Instant — 10% bonus credit', icon: 'bi-wallet2' },
    { value: 'bank', label: 'Direct Bank Transfer', desc: '3–5 business days', icon: 'bi-bank' },
    { value: 'upi', label: 'UPI Refund', desc: '24–48 hours', icon: 'bi-phone' }
  ];

  // ===== FAQ =====
  faqs: FAQItem[] = [
    {
      question: 'How do I initiate a return?',
      answer: 'Go to the "Request a Return" tab, enter your order details, select the reason, choose your refund method, and submit. We\'ll process your request within 24 hours.',
      open: false
    },
    {
      question: 'What is the return window?',
      answer: 'Return windows vary by category — from 7 days for Electronics to 30 days for Fashion. Check the Policy Details tab for your specific category.',
      open: false
    },
    {
      question: 'Will I get a full refund?',
      answer: 'Yes, for eligible returns you will receive a full refund including the original shipping cost if the return is due to a seller or product error. For other reasons, shipping charges may be deducted.',
      open: false
    },
    {
      question: 'Do I need to return the original packaging?',
      answer: 'Yes, most items must be returned in their original packaging with all accessories, manuals, and tags included. Items returned without original packaging may be subject to a restocking fee.',
      open: false
    },
    {
      question: 'Who pays for return shipping?',
      answer: 'If the return is due to a defect, wrong item, or transit damage, QNX Mart arranges free pickup. For other reasons (e.g., change of mind), the customer may bear the shipping cost.',
      open: false
    },
    {
      question: 'Can I exchange instead of returning?',
      answer: 'Yes! For fashion, footwear, and size-related issues you can opt for a direct exchange. The exchange is processed after we receive the original item.',
      open: false
    },
    {
      question: 'What items cannot be returned?',
      answer: 'Opened personal care / hygiene products, digital downloads, customized/personalized items, perishables, and items marked as "Non-Returnable" on the product page cannot be returned.',
      open: false
    },
    {
      question: 'How long does the refund take?',
      answer: 'Refunds are processed within 3–7 business days after we receive and inspect the returned item. UPI refunds are fastest (24–48 hours). QNX Wallet credit is instant.',
      open: false
    },
    {
      question: 'What if my item was a gift?',
      answer: 'Gift returns are accepted with the original order ID. Refunds will go back to the original purchaser\'s payment method, or as QNX Wallet credit for the recipient.',
      open: false
    }
  ];

  // ===== MOCK TRACKING DATA =====
  private mockReturns: any = {
    'QNX123456': {
      orderId: 'QNX123456',
      product: 'Wireless Earbuds Pro X200',
      reason: 'Defective / Not Working',
      requestDate: '28 Mar 2026',
      status: 'pickup_scheduled',
      timeline: [
        { step: 'Return Requested', date: '28 Mar 2026', done: true, icon: 'bi-bag-x' },
        { step: 'Request Approved', date: '29 Mar 2026', done: true, icon: 'bi-check-circle' },
        { step: 'Pickup Scheduled', date: '01 Apr 2026', done: true, icon: 'bi-truck' },
        { step: 'Item Received', date: 'Pending', done: false, icon: 'bi-box-seam' },
        { step: 'Quality Check', date: 'Pending', done: false, icon: 'bi-shield-check' },
        { step: 'Refund Processed', date: 'Pending', done: false, icon: 'bi-currency-rupee' }
      ],
      refundAmount: '₹2,499',
      refundMethod: 'Original Payment Method',
      estimatedRefund: '05 Apr 2026'
    },
    'QNX654321': {
      orderId: 'QNX654321',
      product: 'Men\'s Running Shoes (Size 42)',
      reason: 'Size / Fit Issue',
      requestDate: '30 Mar 2026',
      status: 'refund_processed',
      timeline: [
        { step: 'Return Requested', date: '30 Mar 2026', done: true, icon: 'bi-bag-x' },
        { step: 'Request Approved', date: '30 Mar 2026', done: true, icon: 'bi-check-circle' },
        { step: 'Pickup Scheduled', date: '31 Mar 2026', done: true, icon: 'bi-truck' },
        { step: 'Item Received', date: '02 Apr 2026', done: true, icon: 'bi-box-seam' },
        { step: 'Quality Check', date: '02 Apr 2026', done: true, icon: 'bi-shield-check' },
        { step: 'Refund Processed', date: '03 Apr 2026', done: true, icon: 'bi-currency-rupee' }
      ],
      refundAmount: '₹1,899',
      refundMethod: 'QNX Wallet Credit',
      estimatedRefund: 'Completed'
    }
  };

  constructor(private router: Router, private alertService: AlertService) { }

  ngOnInit() {
    window.scrollTo(0, 0);
  }

  // ===== TAB NAVIGATION =====
  setTab(tab: 'policy' | 'request' | 'track' | 'faq') {
    this.activeTab = tab;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ===== RETURN REQUEST STEPS =====
  nextStep() {
    if (this.requestStep === 1) {
      if (!this.returnForm.orderId.trim() || !this.returnForm.email.trim() || !this.returnForm.itemName.trim()) {
        this.alertService.unialert('Please fill all required fields'); return;
      }
    }
    if (this.requestStep === 2) {
      if (!this.returnForm.reason) { this.alertService.unialert('Please select a return reason'); return; }
    }
    if (this.requestStep === 3) {
      if (!this.returnForm.refundMethod) { this.alertService.unialert('Please select a refund method'); return; }
    }
    if (this.requestStep === 4) {
      if (!this.returnForm.agreeToPolicy) { this.alertService.unialert('Please agree to the return policy'); return; }
      this.submitReturn();
      return;
    }
    this.requestStep++;
  }

  prevStep() {
    if (this.requestStep > 1) this.requestStep--;
  }

  submitReturn() {
    this.submittedRequestId = 'RET' + Math.floor(100000 + Math.random() * 900000);
    this.requestStep = 5;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  resetForm() {
    this.returnForm = {
      orderId: '', email: '', itemName: '', reason: '',
      reasonDetail: '', hasImages: false, refundMethod: '', agreeToPolicy: false
    };
    this.requestStep = 1;
    this.uploadedImages = [];
    this.submittedRequestId = '';
  }

  // ===== TRACK RETURN =====
  trackReturn() {
    if (!this.trackOrderId.trim()) { this.alertService.unialert('Please enter your Order ID'); return; }
    this.trackSearched = true;
    this.trackResult = this.mockReturns[this.trackOrderId.trim().toUpperCase()] || null;
  }

  resetTrack() {
    this.trackOrderId = '';
    this.trackEmail = '';
    this.trackResult = null;
    this.trackSearched = false;
  }

  getStatusLabel(status: string): string {
    const map: any = {
      pickup_scheduled: 'Pickup Scheduled',
      item_received: 'Item Received',
      quality_check: 'Under Quality Check',
      refund_processed: 'Refund Processed ✓'
    };
    return map[status] || status;
  }

  getStatusClass(status: string): string {
    if (status === 'refund_processed') return 'status-completed';
    if (status === 'pickup_scheduled') return 'status-active';
    return 'status-pending';
  }

  // ===== FAQ =====
  toggleFaq(i: number) {
    this.faqs[i].open = !this.faqs[i].open;
  }

  // ===== ELIGIBILITY CHECKER =====
  checkEligibility() {
    if (!this.checkerCategory || !this.checkerDays) {
      this.alertService.unialert('Please select category and enter days'); return;
    }
    const days = Number(this.checkerDays);
    const windowMap: any = {
      electronics: 7, fashion: 30, home: 10, books: 10,
      sports: 10, health: 10, automotive: 7, toys: 15
    };
    const maxDays = windowMap[this.checkerCategory] || 10;
    this.eligibilityResult = days <= maxDays ? 'eligible' : 'ineligible';
  }

  resetEligibility() {
    this.checkerCategory = '';
    this.checkerDays = '';
    this.eligibilityResult = null;
  }
}

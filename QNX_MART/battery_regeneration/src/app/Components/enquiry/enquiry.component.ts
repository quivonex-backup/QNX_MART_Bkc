import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Enquiry } from '../../../Models/models/enquiry.model';
import { ProductService } from '../../../services/product.service';
import { EnquiryService } from '../../../services/enquiry.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AlertService } from '../../../services/alert.service';

@Component({
  selector: 'app-enquiry',
  imports: [FormsModule, CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './enquiry.component.html',
  styleUrl: './enquiry.component.css'
})
export class EnquiryComponent {

  enquiryForm!: FormGroup;

  products: any[] = [];
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private productService: ProductService,
    private enquiryService: EnquiryService,
    private route: ActivatedRoute,
    private alertService: AlertService
  ) { }

  ngOnInit() {

    this.route.queryParams.subscribe(params => {
      const productId = params['product_id'];
      if (productId) {
        this.enquiryForm.patchValue({
          product_name: [productId]
        });
      }
    });

    this.loadProducts();

    this.enquiryForm = this.fb.group({
      person_name: ['', Validators.required],
      user_type: ['personal', Validators.required],
      shop_name: [''],
      firm_name: [''],
      company_name: [''],
      contacts: this.fb.array([
        this.createContact()
      ]),
      emails: this.fb.array([
        this.createEmail()
      ]),
      product_name: [[], Validators.required],
      address: ['', Validators.required],
      pincode: ['', [Validators.required, Validators.pattern("^[0-9]{6}$")]],
      message: ['', Validators.required],
      demo_required: ['no'],
      demo_type: [''],
      attachment: ['']
    });
  }

  loadProducts() {
    this.productService.getProducts({}).subscribe((res: any) => {
      this.products = res.data;
      const productId = this.route.snapshot.queryParamMap.get('product_id');
      if (productId) {
        this.enquiryForm.patchValue({
          product_name: [productId]
        });
      }
    });
  }

  createContact(): FormGroup {
    return this.fb.group({
      contact: ['', [Validators.required, Validators.pattern("^[0-9]{10}$")]]
    });
  }

  createEmail(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get contacts(): FormArray {
    return this.enquiryForm.get('contacts') as FormArray;
  }

  get emails(): FormArray {
    return this.enquiryForm.get('emails') as FormArray;
  }

  addContact() {
    this.contacts.push(this.createContact());
  }

  removeContact(i: number) {
    this.contacts.removeAt(i);
  }

  addEmail() {
    this.emails.push(this.createEmail());
  }

  removeEmail(i: number) {
    this.emails.removeAt(i);
  }

  onFileSelect(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = () => {
        this.previewUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  submit() {
    console.log("Submit Clicked");

    if (this.enquiryForm.invalid) {
      this.enquiryForm.markAllAsTouched();
      return;
    }

    const formValue = this.enquiryForm.value;

    // Build FormData
    const formData = new FormData();

    // Basic fields
    formData.append('person_name', formValue.person_name);
    formData.append('user_type', formValue.user_type);
    formData.append('shop_name', formValue.shop_name || '');
    formData.append('firm_name', formValue.firm_name || '');
    formData.append('company_name', formValue.company_name || '');

    // Contacts and emails as JSON strings
    const contactsArray = formValue.contacts.map((c: any) => c.contact);
    const emailsArray = formValue.emails.map((e: any) => e.email);
    formData.append('contacts', JSON.stringify(contactsArray));
    formData.append('emails', JSON.stringify(emailsArray));

    // Address, pincode, message
    formData.append('address', formValue.address);
    formData.append('pincode', formValue.pincode);
    formData.append('message', formValue.message);

    // Demo
    formData.append('demo_required', formValue.demo_required);
    formData.append('demo_type', formValue.demo_type || '');

    // Product (send as JSON string because it's an array of IDs)
    formData.append('products', JSON.stringify(formValue.product_name));

    // Attachment
    if (this.selectedFile) {
      formData.append('attachment', this.selectedFile, this.selectedFile.name);
    }

    console.log("Payload (FormData):", formData);

    this.enquiryService.createEnquiry(formData).subscribe({
      next: (res) => {
        console.log("API Response", res);
        if (res.status) {
          this.alertService.unialert("Enquiry Created Successfully");
          this.enquiryForm.reset();
          this.previewUrl = null;
          this.selectedFile = null;
          // Reset arrays to one each
          while (this.contacts.length > 1) this.contacts.removeAt(1);
          while (this.emails.length > 1) this.emails.removeAt(1);
        }
      },
      error: (err) => {
        console.log("API Error", err);
        this.alertService.unialert('Something went wrong. Please try again.');
      }
    });
  }
}
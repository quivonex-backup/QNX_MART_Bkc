import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ProductService } from '../../../services/product.service';
import { EnquiryService } from '../../../services/enquiry.service';
import { AlertService } from '../../../services/alert.service';
import { Location } from '@angular/common';

@Component({
    selector: 'app-product-enquiry',
    imports: [FormsModule, CommonModule, ReactiveFormsModule],
    templateUrl: './product-enquiry.component.html',
    styleUrl: './product-enquiry.component.css'
})
export class ProductEnquiryComponent implements OnInit {

    product: any = null;
    enquiryForm!: FormGroup;
    submitted = false;
    selectedFile: File | null = null;
    attachmentPreview: string | null = null;
    attachmentName: string = '';
    selectedPrice: any = null;

    referralCode: string = '';

    // Variant selections
    selectedColor: string = '';
    selectedSize: string = '';
    selectedVariant: string = '';
    selectedVariantData: any = null;   // full attribute object from URL

    // Parsed options from product.specifications
    colorOptions: string[] = [];
    sizeOptions: string[] = [];
    variantOptions: string[] = [];

    readonly ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    readonly MAX_SIZE = 5 * 1024 * 1024;

    constructor(
        private fb: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private productService: ProductService,
        private enquiryService: EnquiryService,
        private alertService: AlertService,
        private location: Location,
    ) { }

    // ####################

    ngOnInit() {
        // const userId = sessionStorage.getItem('user_id');
        // if (!userId) {
        //     this.alertService.unialert('⚠️ Login First');
        //     sessionStorage.setItem('returnUrl', this.router.url);
        //     this.router.navigate(['/login']);
        //     return;
        // }
        // sessionStorage.removeItem('returnUrl');

        this.buildForm();

        // const id = this.route.snapshot.queryParamMap.get('product_id');
        const slug = this.route.snapshot.queryParamMap.get('product');
        const price = this.route.snapshot.queryParamMap.get('price');
        const variant = this.route.snapshot.queryParamMap.get('variant');

        const refCode = this.route.snapshot.queryParamMap.get('ref_code');

        if (refCode) {
            this.referralCode = refCode;
        }

        if (price) {
            this.selectedPrice = price;
        }

        // ═══ Parse variant from URL and populate fields ═══
        if (variant) {
            try {
                const parsed = JSON.parse(variant);
                if (parsed && typeof parsed === 'object') {
                    this.selectedVariantData = parsed;

                    const keys = Object.keys(parsed);
                    const variantParts: string[] = [];

                    keys.forEach(k => {
                        const lower = k.toLowerCase();
                        const val = parsed[k];
                        if (typeof val === 'string') {
                            if (lower === 'color' || lower === 'colour') {
                                this.selectedColor = val;
                                variantParts.push(val);
                            } else if (lower === 'size') {
                                this.selectedSize = val;
                                variantParts.push(val);
                            } else {
                                // Other attributes (e.g. RAM, Storage) – include in variant label
                                variantParts.push(val);
                            }
                        }
                    });

                    // Build selected_variant as a hyphen‑joined string of all attribute values
                    // e.g. "White-6GB-128GB"
                    if (variantParts.length > 0) {
                        this.selectedVariant = variantParts.join('-');
                    } else {
                        // fallback: use the first string value we find
                        const values = Object.values(parsed).filter(v => typeof v === 'string');
                        if (values.length) {
                            this.selectedVariant = values[0];
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to parse variant query param:', e);
            }
        }

        // ═══ Load product details ═══
        // if (id) {
        //     this.productService.getProductDetails({ id }).subscribe({
        if (slug) {
            this.productService.getProductDetails({ slug }).subscribe({
                next: (res: any) => {
                    // this.product = res.product;
                    this.product = res.data;
                    this.parseVariants();
                    this.autoSelectVariantOptions();
                },
                error: (err) => console.log(err)
            });
        }
    }

    // ngOnInit() {
    //     const userId = sessionStorage.getItem('user_id');
    //     if (!userId) {
    //         this.alertService.unialert('⚠️ Login First');
    //         sessionStorage.setItem('returnUrl', this.router.url);
    //         this.router.navigate(['/login']);
    //         return;
    //     }
    //     sessionStorage.removeItem('returnUrl');
    
    //     this.buildForm();
    
    //     // Get the raw product parameter (already decoded by Angular)
    //     const productParam = this.route.snapshot.queryParamMap.get('product');
    //     const price = this.route.snapshot.queryParamMap.get('price');
    //     const variant = this.route.snapshot.queryParamMap.get('variant');
    
    //     // Extract slug and possible referral code from productParam
    //     let slug: string | null = null;
    //     if (productParam) {
    //         const idx = productParam.indexOf('?');
    //         if (idx !== -1) {
    //             // There is a query string inside the product value
    //             slug = productParam.substring(0, idx);
    //             const queryString = productParam.substring(idx + 1);
    //             const params = new URLSearchParams(queryString);
    //             const ref = params.get('ref');
    //             if (ref) {
    //                 this.referralCode = ref;
    //             }
    //         } else {
    //             slug = productParam;
    //         }
    //     }
    
    //     // Also check for a separate 'ref_code' query param (fallback)
    //     const refCode = this.route.snapshot.queryParamMap.get('ref_code');
    //     if (refCode && !this.referralCode) {
    //         this.referralCode = refCode;
    //     }
    
    //     if (price) {
    //         this.selectedPrice = price;
    //     }
    
    //     // Parse variant from URL (unchanged)
    //     if (variant) {
    //         try {
    //             const parsed = JSON.parse(variant);
    //             if (parsed && typeof parsed === 'object') {
    //                 this.selectedVariantData = parsed;
    //                 // ... rest of variant parsing code ...
    //             }
    //         } catch (e) {
    //             console.warn('Failed to parse variant query param:', e);
    //         }
    //     }
    
    //     // Load product using the extracted slug
    //     if (slug) {
    //         this.productService.getProductDetails({ slug }).subscribe({
    //             next: (res: any) => {
    //                 this.product = res.data;
    //                 this.parseVariants();
    //                 this.autoSelectVariantOptions();
    //             },
    //             error: (err) => console.log(err)
    //         });
    //     }
    // }


    // #################

    buildForm() {
        this.enquiryForm = this.fb.group({
            person_name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            contact: ['', [Validators.required, Validators.pattern('^[0-9]{10}$')]],
            address: ['', Validators.required],
            pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
            quantity: [null, [Validators.required, Validators.min(1)]],
            message: ['', [Validators.required, Validators.minLength(10)]],
            demo_required: ['no'],
            demo_type: ['']
        });

        this.enquiryForm.get('demo_required')?.valueChanges.subscribe(val => {
            const demoType = this.enquiryForm.get('demo_type');
            if (val === 'yes') {
                demoType?.setValidators(Validators.required);
            } else {
                demoType?.clearValidators();
                demoType?.setValue('');
            }
            demoType?.updateValueAndValidity();
        });
    }

    // Parse color / size / variant from product.specifications
    parseVariants() {
        if (!this.product?.specifications?.length) return;

        this.product.specifications.forEach((spec: any) => {
            const key = (spec.key || '').toLowerCase().trim();
            const val = (spec.value || '').toString().trim();

            if (!val) return;

            if (key === 'color' || key === 'colour') {
                this.colorOptions = val.split(',').map((v: string) => v.trim()).filter(Boolean);
            } else if (key === 'size' || key === 'sizes') {
                this.sizeOptions = val.split(',').map((v: string) => v.trim()).filter(Boolean);
            } else if (key === 'variant' || key === 'variants' || key === 'model') {
                this.variantOptions = val.split(',').map((v: string) => v.trim()).filter(Boolean);
            }
        });
    }

    // Auto‑select if only one option exists (and not already selected)
    autoSelectVariantOptions() {
        if (this.colorOptions.length === 1 && !this.selectedColor) {
            this.selectedColor = this.colorOptions[0];
        }
        if (this.sizeOptions.length === 1 && !this.selectedSize) {
            this.selectedSize = this.sizeOptions[0];
        }
        if (this.variantOptions.length === 1 && !this.selectedVariant) {
            this.selectedVariant = this.variantOptions[0];
        }
    }

    f(field: string) { return this.enquiryForm.get(field); }

    isInvalid(field: string): boolean {
        const ctrl = this.f(field);
        return !!(ctrl && ctrl.invalid && (ctrl.touched || this.submitted));
    }

    onFileSelect(event: any) {
        const file: File = event.target.files[0];
        if (!file) return;

        if (!this.ALLOWED_TYPES.includes(file.type)) {
            this.alertService.unialert('❌ Only JPG, PNG, WebP, or PDF files are allowed.');
            event.target.value = '';
            return;
        }
        if (file.size > this.MAX_SIZE) {
            this.alertService.unialert('❌ File size must be under 5MB.');
            event.target.value = '';
            return;
        }

        this.selectedFile = file;
        this.attachmentName = file.name;

        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = () => { this.attachmentPreview = reader.result as string; };
            reader.readAsDataURL(file);
        } else {
            this.attachmentPreview = null;
        }
    }

    removeAttachment() {
        this.selectedFile = null;
        this.attachmentPreview = null;
        this.attachmentName = '';
        const input = document.getElementById('attachmentInput') as HTMLInputElement;
        if (input) input.value = '';
    }

    submit() {
        this.submitted = true;
        if (this.enquiryForm.invalid) {
            this.enquiryForm.markAllAsTouched();
            window.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }

        if (!this.product?.id) {
            this.alertService.unialert('❌ Product not loaded. Please go back and try again.');
            return;
        }

        const v = this.enquiryForm.value;

        // Build FormData
        const formData = new FormData();

        // Basic fields
        formData.append('product', String(this.product.id));
        formData.append('person_name', v.person_name);
        formData.append('email', v.email);
        formData.append('contact', v.contact);
        formData.append('address', v.address);
        formData.append('pincode', v.pincode);
        formData.append('quantity', String(v.quantity));
        formData.append('message', v.message);
        formData.append('demo_required', v.demo_required);
        formData.append('demo_type', v.demo_type || '');
        formData.append('price', String(this.selectedPrice || this.product.final_price));

        if (this.referralCode) {
            formData.append(
                'enquiry_referral_code',
                this.referralCode
            );
        }

        // Variant fields – now properly populated
        formData.append('selected_color', this.selectedColor || '');
        formData.append('selected_size', this.selectedSize || '');
        formData.append('selected_variant', this.selectedVariant || '');

        // Also send the full variant data as JSON (optional)
        if (this.selectedVariantData) {
            formData.append('selected_variant_data', JSON.stringify(this.selectedVariantData));
        }

        // Attachment
        if (this.selectedFile) {
            formData.append('attachment', this.selectedFile, this.selectedFile.name);
        }

        console.log('Enquiry FormData:', formData);

        this.enquiryService.createEnquiry(formData).subscribe({
            next: (res: any) => {
                if (res.status) {
                    this.alertService.unialert('✅ Enquiry submitted successfully! We will contact you soon.');
                    // this.router.navigate(['/product-details', this.product?.id]);
                    this.router.navigate(['/product-details', this.product?.slug]);
                }
            },
            error: (err) => {
                console.log(err);
                this.alertService.unialert('❌ Failed to submit enquiry. Please try again.');
            }
        });
    }

    goBack() {
      this.location.back();
    }
}
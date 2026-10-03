// agreement.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import html2canvas from 'html2canvas';
import { AlertService } from '../../../services/alert.service';


interface Company {
  id: number;
  name: string;
  ownerName: string;
  email: string;
  phone: string;
  address: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
  commission: number;
}

@Component({
  selector: 'app-agreement',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './agreement.component.html',
  styleUrls: ['./agreement.component.css']
})
export class AgreementComponent implements OnInit {
  agreementForm: FormGroup;
  submitted = false;
  agreementData: any = null;
  
  // Mock data - Replace with actual API calls
  companies: Company[] = [
    { id: 1, name: 'Tech Solutions Ltd', ownerName: 'John Doe', email: 'john@techsolutions.com', phone: '+1234567890', address: '123 Tech Park, Silicon Valley' },
    { id: 2, name: 'Fashion Hub Inc', ownerName: 'Jane Smith', email: 'jane@fashionhub.com', phone: '+1234567891', address: '456 Fashion Street, New York' },
    { id: 3, name: 'Electro World', ownerName: 'Mike Johnson', email: 'mike@electroworld.com', phone: '+1234567892', address: '789 Electronics Ave, Texas' }
  ];

  products: Product[] = [
    { id: 1, name: 'Smartphone X', category: 'Electronics', price: 599, commission: 10 },
    { id: 2, name: 'Laptop Pro', category: 'Electronics', price: 999, commission: 12 },
    { id: 3, name: 'Designer Jeans', category: 'Fashion', price: 79, commission: 15 },
    { id: 4, name: 'Running Shoes', category: 'Sports', price: 89, commission: 12 },
    { id: 5, name: 'Smart Watch', category: 'Electronics', price: 199, commission: 10 }
  ];

  constructor(private alertService: AlertService, private fb: FormBuilder) {
    this.agreementForm = this.fb.group({
      agreementStartDate: ['', Validators.required],
      agreementEndDate: ['', Validators.required],
      companyId: ['', Validators.required],
      companyOwnerName: ['', Validators.required],
      companyOwnerEmail: ['', [Validators.required, Validators.email]],
      companyPhone: ['', Validators.required],
      companyAddress: ['', Validators.required],
      selectedProducts: this.fb.array([], Validators.required),
      profitSharePercentage: ['', [Validators.required, Validators.min(0), Validators.max(100)]],
      additionalPoints: ['', Validators.required],
      qnxMartRepresentative: ['', Validators.required],
      qnxMartSign: ['', Validators.required],
      companySign: ['', Validators.required],
      qnxMartPicture: ['', Validators.required],
      companyPicture: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.onCompanyChange();
  }

  get selectedProductsArray() {
    return this.agreementForm.get('selectedProducts') as FormArray;
  }

  getCompanyName(companyId: number): string {
  const company = this.companies.find(c => c.id === +companyId);
  return company ? company.name : 'N/A';
}
  onCompanyChange() {
    this.agreementForm.get('companyId')?.valueChanges.subscribe(companyId => {
      const company = this.companies.find(c => c.id === +companyId);
      if (company) {
        this.agreementForm.patchValue({
          companyOwnerName: company.ownerName,
          companyOwnerEmail: company.email,
          companyPhone: company.phone,
          companyAddress: company.address
        });
      }
    });
  }

  onProductCheckboxChange(event: any, product: Product) {
    const selectedProducts = this.agreementForm.get('selectedProducts') as FormArray;
    
    if (event.target.checked) {
      selectedProducts.push(this.fb.group({
        productId: [product.id],
        productName: [product.name],
        category: [product.category],
        price: [product.price],
        commission: [product.commission]
      }));
    } else {
      const index = selectedProducts.controls.findIndex(x => 
        x.get('productId')?.value === product.id
      );
      if (index !== -1) {
        selectedProducts.removeAt(index);
      }
    }
  }

  isProductSelected(productId: number): boolean {
    const selectedProducts = this.agreementForm.get('selectedProducts') as FormArray;
    return selectedProducts.controls.some(x => x.get('productId')?.value === productId);
  }
  onFileChange(event: any, field: string) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = () => {
      this.agreementForm.patchValue({
        [field]: reader.result // base64 store
      });
    };
    reader.readAsDataURL(file);
  }
}

  getTotalCommission(): number {
    const selectedProducts = this.agreementForm.get('selectedProducts') as FormArray;
    let total = 0;
    selectedProducts.controls.forEach(control => {
      total += control.get('price')?.value * (control.get('commission')?.value / 100);
    });
    return total;
  }

  onSubmit() {
    if (this.agreementForm.valid) {
      this.agreementData = {
        ...this.agreementForm.value,
        selectedProducts: this.agreementForm.value.selectedProducts,
        totalCommission: this.getTotalCommission(),
        agreementNumber: 'QNX-' + Date.now(),
        createdDate: new Date()
      };
      this.submitted = true;
      
      // Scroll to agreement preview
      setTimeout(() => {
        document.getElementById('agreementPreview')?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      Object.keys(this.agreementForm.controls).forEach(key => {
        const control = this.agreementForm.get(key);
        control?.markAsTouched();
      });
    }
  }

  downloadPDF() {
    const element = document.getElementById('agreementContent');
    if (element) {
      html2canvas(element, { scale: 2 }).then((canvas) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const imgWidth = 210;
        const pageHeight = 295;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;
        
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
        
        while (heightLeft > 0) {
          position = heightLeft - imgHeight;
          pdf.addPage();
          pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
          heightLeft -= pageHeight;
        }
        
        pdf.save(`agreement_${this.agreementData.agreementNumber}.pdf`);
      });
    }
  }

  downloadExcel() {
    const worksheet = XLSX.utils.json_to_sheet([this.agreementData]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Agreement');
    XLSX.writeFile(workbook, `agreement_${this.agreementData.agreementNumber}.xlsx`);
  }

  shareAgreement() {
    if (navigator.share) {
      navigator.share({
        title: 'QNX Mart Agreement',
        text: `Agreement ${this.agreementData.agreementNumber}`,
        url: window.location.href
      }).catch(console.error);
    } else {
      this.alertService.unialert('Share feature not supported. You can download the agreement instead.');
    }
  }

  resetForm() {
    this.agreementForm.reset();
    this.submitted = false;
    this.agreementData = null;
    while (this.selectedProductsArray.length) {
      this.selectedProductsArray.removeAt(0);
    }
  }
}
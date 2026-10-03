import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CompanyCreateService } from '../../../../services/company-create.service';
import { Router } from '@angular/router';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-company-list',
  imports: [FormsModule,CommonModule],
  templateUrl: './company-list.component.html',
  styleUrl: './company-list.component.css'
})
export class CompanyListComponent implements OnInit {

  companies:any[]=[];
editData:any = {
  social_media_accounts:{
    facebook:'',
    linkedin:'',
    instagram:''
  }
};
  selectedLogo:any;


  constructor(private companyService:CompanyCreateService,private router:Router,private alertService: AlertService){}

  ngOnInit(){
    this.loadCompanies();
  }

  loadCompanies(){

    this.companyService.getCompanyList().subscribe({
      next:(res:any)=>{

        if(res.status){
          this.companies = res.data;
          console.log("Company List",this.companies);
        }

      },
      error:(err)=>{
        console.error("API Error",err);
      }
    })

  }

  
editCompany(company:any){

this.editData = {
  ...company,
  social_media_accounts: company.social_media_accounts || {
    facebook:'',
    linkedin:'',
    instagram:''
  }
};

const modal = new (window as any).bootstrap.Modal(
document.getElementById('editModal')
);

modal.show();

}

onLogoSelect(event:any){

const file = event.target.files[0];

if(file){
this.selectedLogo = file;

const reader = new FileReader();

reader.onload = (e:any)=>{
this.editData.logo = e.target.result;
};

reader.readAsDataURL(file);

}

}

updateCompany(){

const formData = new FormData();

formData.append("id",this.editData.id);

formData.append("name",this.editData.name);
formData.append("owner_name",this.editData.owner_name);
formData.append("email",this.editData.email);
formData.append("phone_number",this.editData.phone_number);
formData.append("address",this.editData.address);

formData.append("state",this.editData.state);
formData.append("district",this.editData.district);
formData.append("taluka",this.editData.taluka);
formData.append("village",this.editData.village);

formData.append("pincode",this.editData.pincode);
formData.append("gst_number",this.editData.gst_number);

formData.append("registration_no",this.editData.registration_no);
formData.append("company_pan_no",this.editData.company_pan_no);

formData.append("IAN_No",this.editData.IAN_No);

formData.append("website_url",this.editData.website_url);

formData.append(
"multiple_email_ids",
JSON.stringify(this.editData.multiple_email_ids)
);

formData.append(
"contacts",
JSON.stringify(this.editData.contacts)
);

formData.append(
"social_media_accounts",
JSON.stringify(this.editData.social_media_accounts)
);

if(this.selectedLogo){
formData.append("logo",this.selectedLogo);
}

this.companyService.updateCompany(formData).subscribe({

next:(res:any)=>{

this.alertService.unialert(res.message);

this.loadCompanies();

const modal = (window as any).bootstrap.Modal.getInstance(
document.getElementById("editModal")
);

modal.hide();

},

error:(err)=>{
console.log(err);
}

});

}
}
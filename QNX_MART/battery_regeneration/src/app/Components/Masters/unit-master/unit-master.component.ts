import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule, NgForm, ReactiveFormsModule } from '@angular/forms';
import { UnitMasterService } from '../../../../services/State-Master/unit-master.service';
import { Router } from '@angular/router';
import { AlertService } from '../../../../services/alert.service';

@Component({
  selector: 'app-unit-master',
  imports: [FormsModule,CommonModule,ReactiveFormsModule],
  templateUrl: './unit-master.component.html',
  styleUrl: './unit-master.component.css'
})
export class UnitMasterComponent {

  constructor(private unitService: UnitMasterService,private router:Router,private alertService: AlertService){}

  showSuccess=false;
  loading=false;
  units:any[]=[];
  isEditMode = false;
  editUnitId: number | null = null;

  unitData={
    name:'',
    short_name:''
  }

   ngOnInit(){
            const token = sessionStorage.getItem('access_token');
    const userId = sessionStorage.getItem('user_id');
    if (!token || !userId) {
      this.alertService.unialert('Please login first');
      this.router.navigate(['/login']);
      return;
    }
    this.getUnits();
  }

    getUnits(){

    this.loading=true;

    this.unitService.getUnitList().subscribe({

      next:(res)=>{

        console.log("Unit List :",res);

        if(res.status){
          this.units=res.data;
        }

        this.loading=false;
      },

      error:(err)=>{
        console.log(err);
        this.loading=false;
      }

    })

  }
  editUnit(unit: any) {
  console.log('Edit Unit:', unit);

  this.isEditMode = true;
  this.editUnitId = unit.id;

  this.unitData = {
    name: unit.name,
    short_name: unit.short_name
  };

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

toggleUnitStatus(unit: any) {

  // 🔥 if ACTIVE → SOFT DELETE
  if (unit.is_active) {

    if (!confirm('Are you sure you want to delete this unit?')) return;

    this.unitService.softDeleteUnit(unit.id).subscribe({
      next: (res: any) => {
        console.log(res);
        this.alertService.unialert('Unit soft deleted 🗑️');

        this.getUnits(); // refresh list
      },
      error: (err) => {
        console.error(err);
      }
    });

  }

  // 🔥 if INACTIVE → RESTORE
  else {

    this.unitService.restoreUnit(unit.id).subscribe({
      next: (res: any) => {
        console.log(res);
        this.alertService.unialert('Unit restored ♻️');

        this.getUnits();
      },
      error: (err) => {
        console.error(err);
      }
    });

  }
}

saveUnit(form: NgForm) {

  if (form.valid) {

    const payload: any = {
      name: this.unitData.name,
      short_name: this.unitData.short_name
    };

    // 🔥 UPDATE MODE
    if (this.isEditMode && this.editUnitId) {

      payload.id = this.editUnitId;

      this.unitService.updateUnit(payload).subscribe({
        next: (res: any) => {
          console.log(res);

          this.alertService.unialert('Unit Updated Successfully 🔥');

          this.resetForm(form);
          this.getUnits();
        },
        error: (err) => {
          console.error(err);
        }
      });

    }

    // 🔥 CREATE MODE
    else {

      this.unitService.createUnit(payload).subscribe({
        next: (response) => {

          console.log("Response :", response);

          if (response.status) {

            this.showSuccess = true;

            this.resetForm(form);
            this.getUnits();

            setTimeout(() => {
              this.showSuccess = false;
            }, 3000);
          }
        },
        error: (error) => {
          console.log("Error :", error);
        }
      });

    }
  }
}
resetForm(form: NgForm) {
  form.reset();

  this.unitData = {
    name: '',
    short_name: ''
  };

  this.isEditMode = false;
  this.editUnitId = null;
}
}

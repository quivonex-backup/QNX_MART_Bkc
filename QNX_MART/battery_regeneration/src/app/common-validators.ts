import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

export class CommonValidators {

  // Only letters and spaces
  static onlyText(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const regex = /^[A-Za-z ]+$/;
      return regex.test(value) ? null : { onlyText: true };
    };
  }

    // Email validation
  static email(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {

      if (!control.value) return null;

      let value = control.value.toString().trim();

      // Proper email regex
      const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;

      if (!regex.test(value)) {
        return { invalidEmail: true };
      }

      return null;
    };
  }

  // Phone number validation (10 digit)
static phone(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    if (!control.value) return null;

    // 1️⃣ Convert to string
    let value = control.value.toString();

    // 2️⃣ Remove all non-digit characters
    let filteredValue = value.replace(/\D/g, '');

    // 3️⃣ Allow max 10 digits
    filteredValue = filteredValue.substring(0, 10);

    // 4️⃣ If value changed (paste case), update control
    if (value !== filteredValue) {
      control.setValue(filteredValue, { emitEvent: false });
    }

    // 5️⃣ Validation check
    if (filteredValue.length !== 10) {
      return { invalidPhone: true };
    }

    // First digit must be 6-9
    if (!/^[6-9]/.test(filteredValue)) {
      return { invalidStartDigit: true };
    }

    return null;
  };
}

  // Password strength
  static strongPassword(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const value = control.value;
      if (!value) return null;
      const regex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
      return regex.test(value) ? null : { weakPassword: true };
    };
  }

  // No whitespace allowed
  static noSpace(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value && control.value.indexOf(' ') >= 0) {
        return { noSpace: true };
      }
      return null;
    };
  }

    // GST No 
static gst(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {

    if (!control.value) return null;

    let value = control.value.toString().trim();

    // auto convert to uppercase
    const upperValue = value.toUpperCase();

    if (value !== upperValue) {
      control.setValue(upperValue, { emitEvent: false });
    }

    const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

    if (!regex.test(upperValue)) {
      return { invalidGST: true };
    }

    return null;
  };
}
}
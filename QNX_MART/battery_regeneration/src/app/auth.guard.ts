import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const token = sessionStorage.getItem('access_token');

  // जर युजर आधीच लॉगिन असेल आणि तो लॉगिन पेज उघडण्याचा प्रयत्न करत असेल
  if (token) {
    router.navigate(['/home'], { replaceUrl: true });
    return false; // लॉगिन पेजवर जाऊ देणार नाही
  }
  return true; // टोकन नसेल तरच लॉगिन पेज दिसेल
};
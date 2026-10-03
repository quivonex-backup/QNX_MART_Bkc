export interface Enquiry {
  id?: number;
  personName: string;
  firmName?: string;
  contactNo: string;
  email: string;
  userType: 'Seller' | 'Vendor' | 'User';
  productName: 'DCC6' | 'DCC7' | 'DDC10' | 'DCC15';
  address: string;
  message: string;
  createdAt?: string;
}
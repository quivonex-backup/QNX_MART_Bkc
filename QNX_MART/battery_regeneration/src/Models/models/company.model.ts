export interface CompanyData {
  name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  address: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  gst_number?: string;
  is_active: boolean;
  logo?: File;
  company_slogan?: string;
  farm_registration_year?: number;
  registration_no?: string;
  IAN_No?:string;
  company_pan_no?: string;
  multiple_email_ids?: string[];
  contacts?: string[];
  website_url?: string;
  social_media_accounts?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
  pincode?: string;
}

export interface Company {
  id: number;
  logo: string;
  name: string;
  owner_name: string;
  email: string;
  phone_number: string;
  address: string;
  gst_number: string;
  logo_s3_key: string;
  is_active: boolean;
  created_at: string;
  state: string;
  district: string;
  taluka: string;
  village: string;
  pincode: string;
  company_slogan?: string;
  farm_registration_year?: number;
  registration_no?: string;
  company_pan_no?: string;
  multiple_email_ids?: string[];
  contacts?: string[];
  website_url?: string;
  social_media_accounts?: {
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export interface CompanyResponse {
  status: boolean;
  message: string;
  data: Company;
}
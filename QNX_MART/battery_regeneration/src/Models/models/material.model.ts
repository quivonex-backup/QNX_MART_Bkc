export interface Material {
  old_price: number;
  id: number;
  name: string;
  brand: string;
  size: string[];
  thumbnail_image: string | null;
  rate: string;
  material_description: string | null;
  specification: string[];
  is_active: boolean;
  created_at: string;
  category: number;
  category_name: string;
  unit: number;
  unit_name: string;
}

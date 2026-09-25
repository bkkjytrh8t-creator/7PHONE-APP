export type Locale = 'en' | 'ar';

export type Badge = 'none' | 'new' | 'deal' | 'best-seller';

export type Category = {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string;
  sort_order: number;
  display_order?: number;
  is_visible?: boolean;
  is_active?: boolean;
  homepage_url?: string;
};

export type Brand = {
  id: number | string;
  name_en: string;
  name_ar: string;
  logo_url?: string | null;
  sort_order?: number;
  is_visible?: boolean;
  slug?: string;
  homepage_url?: string;
};

export type Product = {
  id: number;
  slug?: string;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  short_description_en?: string;
  short_description_ar?: string;
  price_bhd: number;
  old_price_bhd?: number | null;
  storage_prices: {label: string; price_bhd: number}[];
  variants_enabled?: boolean;
  variants?: ProductVariant[];
  accessories: Accessory[];
  comparison: {
    display: string;
    camera: string;
    battery: string;
    processor: string;
  };
  brand: Brand;
  category: Category;
  condition: string;
  warranty: string;
  installments: string;
  badge: Badge;
  stock_status: string;
  quantity?: number | null;
  stock_quantity?: number | null;
  inventory?: number | null;
  available?: boolean | string | number | null;
  views: number;
  shares: number;
  orders: number;
  is_active: boolean;
  images: string[];
  hero_banner_image_url?: string;
  image_gallery?: ProductImage[];
  media_gallery?: ProductMedia[];
  product_content_blocks?: import('./productContent').ProductContentBlock[];
  storage: string[];
  colors: string[];
  color_options?: ProductColorOption[];
  features: string[];
  details_specifications?: string[];
  box_contents?: string[];
  warranty_details?: string;
  additional_notes?: string;
  tags: string[];
  specifications_en: string[];
  specifications_ar: string[];
  likes: number;
  sold_count: number;
  rating: number;
  review_count: number;
  created_at: string;
};

export type ProductColorOption = {name: string; hex: string};

export type ProductMedia = {
  id: string;
  product_id?: number;
  media_type: 'image' | 'video';
  source_type: 'upload' | 'external_url' | 'youtube' | 'tiktok' | 'instagram' | 'mp4' | 'webm';
  url: string;
  thumbnail_url?: string;
  sort_order: number;
  is_primary: boolean;
  color?: string | null;
  created_at?: string;
  status?: 'active' | 'hidden';
};

export type ProductVariant = {
  id?: string;
  color?: string;
  color_en?: string;
  color_ar?: string;
  color_hex?: string;
  storage?: string;
  ram?: string;
  warranty?: string;
  price_bhd?: number | null;
  old_price_bhd?: number | null;
  stock?: number | null;
  sku?: string;
  available?: boolean;
  is_default?: boolean;
  most_popular?: boolean;
  images?: string[];
};

export type ProductImage = {
  url: string;
  color?: string | null;
};

export type Accessory = {
  id: number;
  name_ar: string;
  name_en: string;
  price_bhd: number;
  category: string;
};

export type StoreSettings = {
  logoUrl?: string | null;
  bannerUrl?: string | null;
  whatsapp: string;
  phoneSales: string;
  phoneRepairs: string;
  mapsUrl: string;
  instagram: string;
  siteUrl: string;
  benefitPayEnabled: boolean;
  benefitPayQr: string;
  benefitPayAccountHolder: string;
  benefitPayPhone: string;
  iban: string;
  benefitPayInstructionsAr: string;
  benefitPayInstructionsEn: string;
  paymentOptions?: string;
  deliveryOptions?: string;
  whatsappTemplate?: string;
};

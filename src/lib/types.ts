export type Locale = 'en' | 'ar';

export type Badge = 'none' | 'new' | 'deal' | 'best-seller';

export type Category = {
  id: number;
  slug: string;
  name_en: string;
  name_ar: string;
  icon: string;
  sort_order: number;
};

export type Brand = {
  id: number;
  name_en: string;
  name_ar: string;
  logo_url?: string | null;
};

export type Product = {
  id: number;
  name_en: string;
  name_ar: string;
  description_en: string;
  description_ar: string;
  price_bhd: number;
  old_price_bhd?: number | null;
  storage_prices: {label: string; price_bhd: number}[];
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
  views: number;
  shares: number;
  orders: number;
  is_active: boolean;
  images: string[];
  storage: string[];
  colors: string[];
  specifications_en: string[];
  specifications_ar: string[];
  likes: number;
  sold_count: number;
  rating: number;
  review_count: number;
  created_at: string;
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
  benefitPayQr: string;
  iban: string;
};

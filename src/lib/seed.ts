import type {Brand, Category, Product, StoreSettings} from './types';

export const settings: StoreSettings = {
  logoUrl: '/images/7phone-logo.svg',
  bannerUrl: null,
  whatsapp: '97339011777',
  phoneSales: '17210009',
  phoneRepairs: '17210077',
  mapsUrl: 'https://maps.google.com/?q=7phone%20Bahrain%20Jid%20Ali',
  instagram: 'https://instagram.com/7phone',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://7phone.app',
  benefitPayQr: '/images/benefitpay-qr.svg',
  iban: 'BH67BBKU001000000000001234'
};

export const categories: Category[] = [
  {id: 1, slug: 'offers', name_en: 'Offers', name_ar: 'عروض', icon: '🔥', sort_order: 1},
  {id: 2, slug: 'phones', name_en: 'Phones', name_ar: 'هواتف', icon: '📱', sort_order: 2},
  {id: 3, slug: 'tablets', name_en: 'Tablets', name_ar: 'تابلت', icon: '📲', sort_order: 3},
  {id: 4, slug: 'watches', name_en: 'Watches', name_ar: 'ساعات', icon: '⌚', sort_order: 4},
  {id: 5, slug: 'audio', name_en: 'Audio', name_ar: 'اكسسوارات', icon: '🎧', sort_order: 5},
  {id: 6, slug: 'laptops', name_en: 'Laptops', name_ar: 'لابتوبات', icon: '💻', sort_order: 6},
  {id: 7, slug: 'gaming', name_en: 'Gaming', name_ar: 'ألعاب', icon: '🎮', sort_order: 7}
];

export const brands: Brand[] = [
  'Apple',
  'Samsung',
  'Honor',
  'Oppo',
  'Huawei',
  'Tecno',
  'Realme',
  'Xiaomi',
  'Nubia',
  'Meizu'
].map((name, index) => ({id: index + 1, name_en: name, name_ar: name}));

const phone = categories[1];
const offer = categories[0];
const apple = brands[0];
const samsung = brands[1];
const honor = brands[2];

const sharedAccessories = [
  {id: 1, name_en: 'USB-C Fast Charger', name_ar: 'شاحن USB-C سريع', price_bhd: 9.9, category: 'charger'},
  {id: 2, name_en: 'Screen Protector', name_ar: 'حماية شاشة', price_bhd: 3, category: 'protector'},
  {id: 3, name_en: 'Premium Case', name_ar: 'كفر حماية فاخر', price_bhd: 5, category: 'case'},
  {id: 4, name_en: 'MagSafe Power Bank', name_ar: 'باور بنك MagSafe', price_bhd: 14.5, category: 'magsafe'}
];

export const products: Product[] = [
  {
    id: 1,
    name_en: 'iPhone 17 Pro Max',
    name_ar: 'iPhone 17 Pro Max',
    description_en: 'Flagship iPhone with premium build, strong camera system, and Bahrain warranty.',
    description_ar: 'آيفون رائد بتصميم فاخر، كاميرات قوية، وضمان في البحرين.',
    price_bhd: 519,
    old_price_bhd: 549,
    storage_prices: [
      {label: '256GB', price_bhd: 519},
      {label: '512GB', price_bhd: 589},
      {label: '1TB', price_bhd: 689}
    ],
    accessories: sharedAccessories,
    comparison: {
      display: '6.9" Super Retina XDR',
      camera: '48MP Pro camera system',
      battery: 'Up to 33 hours video',
      processor: 'A19 Pro'
    },
    brand: apple,
    category: offer,
    condition: 'New sealed',
    warranty: 'ضمان الوكيل - سنة كاملة',
    installments: 'Available',
    badge: 'deal',
    stock_status: 'available',
    views: 1420,
    shares: 118,
    orders: 37,
    is_active: true,
    images: ['/images/products/iphone17.svg', '/images/products/iphone17-alt.svg'],
    storage: ['256GB', '512GB', '1TB'],
    colors: ['Black', 'White', 'Desert Titanium'],
    specifications_en: ['6.9-inch display', 'A-series chip', 'Triple camera system'],
    specifications_ar: ['شاشة 6.9 إنش', 'معالج A-series', 'نظام كاميرات ثلاثي'],
    likes: 24,
    sold_count: 37,
    rating: 4.8,
    review_count: 16,
    created_at: '2026-01-01'
  },
  {
    id: 2,
    name_en: 'Samsung Galaxy S Ultra',
    name_ar: 'Samsung Galaxy S Ultra',
    description_en: 'High-end Samsung phone with large display and powerful zoom camera.',
    description_ar: 'هاتف سامسونج فاخر بشاشة كبيرة وكاميرا زوم قوية.',
    price_bhd: 399,
    old_price_bhd: null,
    storage_prices: [
      {label: '256GB', price_bhd: 399},
      {label: '512GB', price_bhd: 459}
    ],
    accessories: sharedAccessories.slice(0, 3),
    comparison: {
      display: '6.8" Dynamic AMOLED 2X',
      camera: '200MP zoom camera',
      battery: '5000 mAh',
      processor: 'Snapdragon Elite'
    },
    brand: samsung,
    category: phone,
    condition: 'New sealed',
    warranty: 'ضمان الوكيل - سنة كاملة',
    installments: 'Available',
    badge: 'new',
    stock_status: 'available',
    views: 1098,
    shares: 76,
    orders: 22,
    is_active: true,
    images: ['/images/products/galaxy-ultra.svg'],
    storage: ['256GB', '512GB'],
    colors: ['Titanium Gray', 'Black'],
    specifications_en: ['Dynamic AMOLED display', 'Fast charging', 'Pro camera system'],
    specifications_ar: ['شاشة Dynamic AMOLED', 'شحن سريع', 'نظام كاميرات احترافي'],
    likes: 18,
    sold_count: 22,
    rating: 4.7,
    review_count: 11,
    created_at: '2026-01-02'
  },
  {
    id: 3,
    name_en: 'Honor Magic Series',
    name_ar: 'Honor Magic Series',
    description_en: 'Balanced Android phone with strong battery and smooth performance.',
    description_ar: 'هاتف أندرويد متوازن ببطارية قوية وأداء سلس.',
    price_bhd: 189,
    old_price_bhd: 209,
    storage_prices: [{label: '256GB', price_bhd: 189}],
    accessories: sharedAccessories.slice(0, 3),
    comparison: {
      display: '6.78" OLED',
      camera: '50MP AI camera',
      battery: '5600 mAh',
      processor: 'Snapdragon 7 series'
    },
    brand: honor,
    category: offer,
    condition: 'New',
    warranty: 'ضمان 7Phone - سنة كاملة',
    installments: 'Available',
    badge: 'best-seller',
    stock_status: 'available',
    views: 880,
    shares: 64,
    orders: 54,
    is_active: true,
    images: ['/images/products/honor-magic.svg'],
    storage: ['256GB'],
    colors: ['Green', 'Black'],
    specifications_en: ['OLED display', 'Long battery life', 'Fast charging'],
    specifications_ar: ['شاشة OLED', 'بطارية تدوم طويلاً', 'شحن سريع'],
    likes: 31,
    sold_count: 54,
    rating: 4.6,
    review_count: 24,
    created_at: '2026-01-03'
  },
  {
    id: 4,
    name_en: 'Apple Watch Series',
    name_ar: 'Apple Watch Series',
    description_en: 'Apple Watch with health tracking, calls, and elegant straps.',
    description_ar: 'ساعة Apple Watch بتتبع صحي، مكالمات، وسوارات أنيقة.',
    price_bhd: 149,
    old_price_bhd: null,
    storage_prices: [{label: 'GPS 45mm', price_bhd: 149}, {label: 'Cellular 45mm', price_bhd: 179}],
    accessories: [
      {id: 5, name_en: 'Sport Band', name_ar: 'سوار رياضي', price_bhd: 6, category: 'strap'},
      {id: 6, name_en: 'Watch Charger', name_ar: 'شاحن الساعة', price_bhd: 8, category: 'charger'}
    ],
    comparison: {
      display: 'Always-On Retina',
      camera: 'No camera',
      battery: 'All-day battery',
      processor: 'S-series chip'
    },
    brand: apple,
    category: categories[3],
    condition: 'New sealed',
    warranty: 'ضمان الوكيل - سنة كاملة',
    installments: 'Available',
    badge: 'new',
    stock_status: 'out',
    views: 520,
    shares: 28,
    orders: 14,
    is_active: true,
    images: ['/images/products/apple-watch.svg'],
    storage: ['GPS 45mm', 'Cellular 45mm'],
    colors: ['Midnight', 'Silver', 'Pink'],
    specifications_en: ['Fitness tracking', 'Calls and notifications', 'Water resistant'],
    specifications_ar: ['تتبع النشاط والصحة', 'مكالمات وتنبيهات', 'مقاومة للماء'],
    likes: 15,
    sold_count: 14,
    rating: 4.6,
    review_count: 9,
    created_at: '2026-01-04'
  }
];

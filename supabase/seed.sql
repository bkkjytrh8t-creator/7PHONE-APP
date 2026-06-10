insert into public.categories (name_en, name_ar, slug, icon, sort_order) values
  ('Offers', 'عروض', 'offers', '🔥', 1),
  ('Phones', 'هواتف', 'phones', '📱', 2),
  ('Tablets', 'تابلت', 'tablets', '📲', 3),
  ('Watches', 'ساعات', 'watches', '⌚', 4),
  ('Audio', 'اكسسوارات', 'audio', '🎧', 5),
  ('Laptops', 'لابتوبات', 'laptops', '💻', 6),
  ('Gaming', 'ألعاب', 'gaming', '🎮', 7)
on conflict (slug) do nothing;

insert into public.brands (name_en, name_ar) values
  ('Apple', 'Apple'),
  ('Samsung', 'Samsung'),
  ('Honor', 'Honor'),
  ('Oppo', 'Oppo'),
  ('Huawei', 'Huawei'),
  ('Tecno', 'Tecno'),
  ('Realme', 'Realme'),
  ('Xiaomi', 'Xiaomi'),
  ('Nubia', 'Nubia'),
  ('Meizu', 'Meizu');

insert into public.settings (
  store_whatsapp_number,
  store_phone_sales,
  store_phone_repairs,
  maps_url,
  store_name_en,
  store_name_ar,
  promo_text_en,
  promo_text_ar
) values (
  '97339011777',
  '17210009',
  '17210077',
  'https://maps.google.com/?q=7phone%20Bahrain%20Jid%20Ali',
  '7phone',
  'سفن فون',
  'Installments, warranty, and repair service in Bahrain',
  'تقسيط، ضمان، وخدمة تصليح في البحرين'
)
on conflict (id) do update set
  store_whatsapp_number = excluded.store_whatsapp_number,
  store_phone_sales = excluded.store_phone_sales,
  store_phone_repairs = excluded.store_phone_repairs,
  maps_url = excluded.maps_url,
  store_name_en = excluded.store_name_en,
  store_name_ar = excluded.store_name_ar,
  promo_text_en = excluded.promo_text_en,
  promo_text_ar = excluded.promo_text_ar;

# 7phone — Website Build Plan

**Project:** Bilingual (EN/AR) product catalog website for 7phone (سفن فون), a phone & electronics retail store in Jid Ali, Bahrain. Customers browse products and order via WhatsApp.

**Status:** Visual prototype approved. Ready to scaffold the production build.

-----

## 1. Overview

|             |                                                                                      |
|-------------|--------------------------------------------------------------------------------------|
|**Type**     |Catalog website (no checkout). Orders happen on WhatsApp.                             |
|**Languages**|English + Arabic, full RTL support                                                    |
|**Currency** |BHD, shown publicly on every product                                                  |
|**Ordering** |Single central WhatsApp number; clicking a product opens a pre-filled WhatsApp message|
|**Admin**    |Non-technical staff manage products through an admin panel                            |
|**v1 scope** |Catalog + WhatsApp ordering only (no cart, no payments)                               |

-----

## 2. Tech Stack

|Layer       |Choice                                     |Why                                                       |
|------------|-------------------------------------------|----------------------------------------------------------|
|Framework   |**Next.js (App Router) + TypeScript**      |SEO-friendly, fast, single codebase for site + admin      |
|Styling     |**Tailwind CSS**                           |Quick, consistent, easy RTL                               |
|Backend / DB|**Supabase** (Postgres + Auth + Storage)   |One service for product DB, admin login, and image hosting|
|i18n        |**next-intl**                              |EN/AR routing + RTL layout flip                           |
|Hosting     |**Vercel** (frontend) + **Supabase** (data)|Free tier covers launch; scales later                     |
|Domain      |Custom (e.g. shop.7phone.net or similar)   |TBD                                                       |

-----

## 3. Visual Identity

- **Logo:** Circled-7 seal (recreated as crisp SVG). Wordmark: **7phone** / **سفن فون**, with “EST. 2007 · BAHRAIN”.
- **Palette:** dark pink `#C2185B` + black `#0B0B0D` + white `#FFFFFF`; WhatsApp green `#25D366` reserved for order buttons only.
- **Fonts:** Sora (English) + IBM Plex Sans Arabic (Arabic).
- **Style:** dense product grid (small cards, more products per row), dark header/hero with pink glow, clean white catalog, big tap-friendly WhatsApp buttons.

-----

## 4. Data Model (Supabase / Postgres)

**products**

- id, name_en, name_ar, description_en, description_ar
- price_bhd, old_price_bhd (nullable, for “deal” badge)
- brand_id (fk), category_id (fk)
- condition, warranty, installments (display fields)
- badge (none / new / deal), stock_status, is_active
- created_at

**product_images**

- id, product_id (fk), url, sort_order

**categories**

- id, name_en, name_ar, slug, sort_order

**brands**

- id, name_en, name_ar, logo_url (nullable)

**settings** (single row, store-wide)

- store_whatsapp_number, store_phone_sales, store_phone_repairs
- maps_url, store_name_en, store_name_ar
- hero content, promo strip text

**Auth:** Supabase Auth (email/password) — admin users only. Row-Level Security so the public can only read active products; only authenticated admins can write.

-----

## 5. Customer Storefront

- **Top strip** — promo line (installments / warranty), editable from settings.
- **Header** — logo + wordmark; **clickable store location** (pin → Google Maps); language toggle (EN/AR); Call button (dials sales number).
- **Search bar** — live filter by name/brand.
- **Hero** — headline, sub-line, trust tags (followers, genuine/sealed, repair workshop).
- **Category bar** — sticky, horizontally scrollable (All, Phones, Tablets, Watches, Audio, Accessories).
- **Product grid** — dense cards: image, brand, name, price in BHD, old price strike-through, NEW/DEAL badge, ♥ favourite, “Order” WhatsApp button.
- **Product detail (modal/page)** — large image gallery, bilingual name & description, specs (condition, warranty, installments), price, full WhatsApp order button.
- **Footer** — store info, contact numbers, “Open in Google Maps”, social links.
- **i18n** — EN/AR toggle flips the entire layout to RTL, swaps all copy, and localizes the WhatsApp message.

### WhatsApp order message format

```
EN:  Hi, I'm interested in this product from 7phone:
     {name} — BHD {price}
     {product_url}

AR:  مرحباً، أنا مهتم بهذا المنتج من 7phone:
     {name} — {price} د.ب
     {product_url}
```

Opens `https://wa.me/{central_number}?text={url-encoded message}` in the customer’s active language.

-----

## 6. Admin Panel (`/admin`, auth-protected)

Built for non-technical staff — simple forms, no code.

- **Login** (Supabase Auth)
- **Products** — list, add, edit, delete; bilingual fields; price + old price; image upload (drag-drop to Supabase Storage); assign category & brand; badge selector; active/hidden toggle; stock status.
- **Categories** — add/edit/reorder, bilingual names.
- **Brands** — add/edit, optional logo upload.
- **Settings** — edit central WhatsApp number, phone numbers, Google Maps link, store info, hero text, promo strip.

-----

## 7. Build Phases

1. **Setup** — Next.js + TypeScript + Tailwind + next-intl scaffold; Supabase project; schema + Row-Level Security; seed categories/brands.
1. **Admin panel** — auth, product/category/brand CRUD, image upload, settings.
1. **Storefront** — header (with location), search, hero, category bar, product grid, detail view; EN/AR toggle + RTL.
1. **WhatsApp integration** — pre-filled bilingual deep links from the central number.
1. **Polish & deploy** — SEO/meta (EN + AR), mobile QA, real product seed data, connect domain, deploy to Vercel.

-----

## 8. Open Items (need from client)

- [ ] **Central WhatsApp order number** (prototype uses placeholder `97339011777`).
- [ ] **Exact Google Maps pin / short link** for the Jid Ali shop.
- [ ] **Official logo file** if available (otherwise the recreated SVG seal is used).
- [ ] **Domain name** to connect.
- [ ] Confirm phone numbers: Sales 17210009 / 39011777, Repairs 17210077.
- [ ] Initial product list + photos (or staff add them via admin after launch).

-----

## 9. Out of Scope for v1 (future)

- Shopping cart / multi-item WhatsApp orders
- Online payments / checkout
- Advanced filters (price range, specs)
- Customer accounts, wishlists synced to login
- Stock/inventory sync with POS
- Analytics dashboard
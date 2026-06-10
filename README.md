# 7phone Web App

Bilingual EN/AR catalog website for 7phone Bahrain. Customers browse products and order through pre-filled WhatsApp links.

## Stack

- Next.js App Router + TypeScript
- Tailwind CSS
- next-intl for EN/AR routing and RTL
- Supabase-ready schema, Auth, Storage, and product data model

## Run

Node.js is required.

```bash
npm install
npm run dev
```

Open `http://localhost:3001/ar`.

## Supabase

1. Create a Supabase project.
2. Run `supabase/schema.sql`.
3. Run `supabase/seed.sql`.
4. Copy `.env.example` to `.env.local`.
5. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

Without Supabase credentials, the app uses local seed products from `src/lib/seed.ts`.

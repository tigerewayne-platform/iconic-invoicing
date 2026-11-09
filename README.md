# Iconic Billing

Quotes, invoices and receipts for Iconic Stretch Tents. Separate from the marketing site, same brand.

**Flow:** quote → client accepts online (or you mark it accepted) → convert to invoice with a deposit % → record each payment → a numbered receipt is issued for every payment. Every document has a branded A4 PDF, an email option, a WhatsApp share and a client link.

## What's in it

- **Quotes** with line items from a price catalogue (packages, extras, services), discount, deposit %, validity date, event details. Status: draft, sent, accepted, declined, expired, invoiced.
- **Client link** (`/p/<token>`) where the client can view, download the PDF and accept the quote by typing their name. Acceptance is logged.
- **Invoices** converted from a quote in one click (lines copied, quote locked) or created from scratch. Deposit due now and balance before installation shown on the PDF. Overdue is calculated from the due date. Invoices are never deleted, only voided, so numbering stays sequential.
- **Receipts** created by recording a payment (EFT, cash, card, SnapScan). Partial payments supported. Invoice flips to part paid / paid automatically.
- **Clients** with history and amounts owing.
- **Overview** with outstanding, overdue, open quotes, cash received this month, and upcoming events.
- **Settings**: business and banking details, VAT switch (off: plain "Invoice"; on: "Tax Invoice" with VAT number and 15%), number prefixes and next numbers, default terms, team logins (admin / staff).

## Stack

Next.js 16 (App Router, server actions), Postgres via Drizzle ORM, `@react-pdf/renderer` for PDFs, Resend for email (optional), Tailwind v4. Fonts and colours match iconicstretchtents.co.za (Cormorant Garamond, Lexend, #FC0101, #0D0D0D, #F5F2ED).

## Deploy on Vercel

1. Import this repo as a new Vercel project.
2. Storage tab → add a **Neon Postgres** database to the project. It sets `DATABASE_URL` for you.
3. Add environment variables:
   - `AUTH_SECRET`: a long random string (`openssl rand -base64 32`)
   - `APP_URL`: the public URL, e.g. `https://billing.iconicstretchtents.co.za`
   - Optional email: `RESEND_API_KEY` and `EMAIL_FROM` (an address on a domain verified in Resend)
4. Deploy. The build runs the database migrations and seeds the catalogue automatically.
5. Open the site, you'll land on **first-time setup** to create the admin login. Then fill in Settings (banking details first) and set catalogue prices.
6. Optional: add the domain `billing.iconicstretchtents.co.za` under Domains.

## Local development

```bash
cp .env.example .env.local   # point DATABASE_URL at a local Postgres
npm install
npm run db:migrate
npm run dev
```

Schema changes: edit `src/db/schema.ts`, run `npm run db:generate`, commit the new file in `drizzle/`.

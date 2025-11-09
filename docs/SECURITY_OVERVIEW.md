# Security & Compliance Reference

This internal note tracks the documents and checkpoints we maintain for legal protection and operational readiness.

## Corporate & Registration
- **Entity:** MyPartsRunner LLC (Kentucky)  
- **Secretary of State Filing #:** MP-45721  
- **EIN:** Stored with finance records; used for banking, Stripe, and tax filings.

## Insurance
- Commercial general liability
- Hired/non-owned auto coverage for delivery operations
- Certificates stored in secure drive; renew annually and keep PDFs in the shared compliance folder.

## Technology Controls
- Supabase row-level security enforced on every table.
- Netlify environment variables reviewed quarterly for least-privilege access.
- Stripe Connect handles all PCI obligations (card data never touches our servers).
- Service worker / push notification permissions logged in Supabase `push_subscriptions`.

## Annual Checklist
1. Legal + tax professional review (January).
2. Insurance policy renewals (prior to expiration).
3. Security policy review & documentation refresh (June).
4. Update public Security page with latest dates and contact emails.

For supporting paperwork requests, email `legal@mypartsrunner.com` or `compliance@mypartsrunner.com`.


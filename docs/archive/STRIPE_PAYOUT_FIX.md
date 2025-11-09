# 📁 Archived: Stripe Payout Fix Notes

_Original file: `STRIPE_PAYOUT_FIX.md`_  
_Status: Archived November 8, 2025 (payout flow stabilized in current codebase)._

Summary of the retired document:
- Investigated 70% driver payout discrepancies and messaging about “instant” payouts.
- Clarified Stripe Connect timing (transfers immediate → bank payouts 2–7 days).
- Recommended logging and driver communication updates.

Use this archive for historical context. The live payout flow now resides in:
- `netlify/functions/process-order-completion.js`
- `src/components/DriversSection.tsx`
- Supabase driver earnings tables

If new payout issues emerge, review current code and logs rather than reapplying these legacy fixes.


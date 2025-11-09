# 📁 Archived: Delivery Photo SMS Setup

_Original file: `PHOTO_SMS_SETUP.md`_  
_Status: Archived November 8, 2025 (push notifications fully restored, Twilio SMS retired)._

This guide described how to send delivery photos via Twilio SMS/MMS, including environment variables, cost analysis, and Netlify function examples. Keep for reference only—no longer part of the production stack.

Key pointers if revisiting:
- Provision Twilio credentials and load them into Netlify environment variables.
- Two Netlify functions powered SMS (`send-sms`) and email (`send-email`).
- Cost estimate: ~$0.75/day for 100 MMS deliveries.

The current platform uses in-app push notifications and Supabase-managed subscriptions instead of SMS. See push notification docs for the active flow.


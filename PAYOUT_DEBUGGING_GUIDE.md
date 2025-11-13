# 🔍 Payout Debugging Guide - Money Not Going to Driver

## 🚨 Problem
- ✅ Drivers are active
- ✅ Accounts are connected  
- ✅ Multiple deliveries completed
- ❌ **Money going to MY-RUNNER.COM minus Stripe fee only**
- ❌ **Nothing being sent to driver**

---

## 🔎 Root Cause Analysis

### The Payment Flow:

1. **Order Created** → Payment Intent created
   - At this point, **NO DRIVER YET** (driver accepts later)
   - Payment goes 100% to platform account
   - This is expected behavior

2. **Driver Accepts Order** → Order assigned to driver

3. **Order Delivered** → `process-order-completion.js` called
   - Should transfer 70% to driver
   - **THIS IS WHERE IT'S FAILING**

---

## 🐛 Why Transfers Might Be Failing

### Issue 1: Insufficient Balance
**Problem:** Platform account doesn't have enough money to transfer.

**Check:**
- Go to Stripe Dashboard → Balance
- Verify there's enough money to cover driver payments
- Stripe holds money for a few days before it's available

**Fix:** Wait for funds to become available, or ensure orders are paid for.

### Issue 2: Transfers Capability Not Active
**Problem:** Driver's `transfers` capability is `pending` or `inactive`.

**Check:**
```bash
POST /.netlify/functions/check-driver-capabilities
Body: { "driverId": "driver-uuid" }
```

**Fix:** Driver must complete Stripe onboarding fully.

### Issue 3: Account Invalid
**Problem:** Driver's Stripe account ID is wrong or account was deleted.

**Check:** Verify `stripe_account_id` in database matches Stripe Dashboard.

**Fix:** Driver must reconnect Stripe account.

### Issue 4: Transfer Error Being Silently Ignored
**Problem:** Error occurs but frontend doesn't show it.

**Check:** Look at Netlify function logs for error messages.

**Fix:** Enhanced logging now shows detailed errors.

---

## 🔧 How to Debug

### Step 1: Check Netlify Function Logs

1. Go to Netlify Dashboard
2. Navigate to Functions → `process-order-completion`
3. Check logs for recent order completions
4. Look for:
   - `❌❌❌ STRIPE TRANSFER ERROR ❌❌❌` (indicates failure)
   - `✅ TRANSFER CREATED SUCCESSFULLY!` (indicates success)

### Step 2: Check Specific Order

```javascript
// Check if transfer was created for an order
POST /.netlify/functions/process-order-completion
Body: { "orderId": "order-uuid-here" }

// Check response for:
// - success: true/false
// - transferId: "tr_xxxxx" (if successful)
// - error: message (if failed)
```

### Step 3: Verify Driver Account

```javascript
POST /.netlify/functions/check-driver-capabilities
Body: { "driverId": "driver-uuid" }

// Check:
// - capabilities.transfers.status === "active"
// - isFullyOnboarded === true
```

### Step 4: Check Stripe Dashboard

1. **Transfers Tab:**
   - Go to Stripe Dashboard → Transfers
   - Look for transfers to driver accounts
   - If none exist, transfer creation is failing

2. **Connected Accounts:**
   - Go to Connect → Accounts
   - Find driver account
   - Check capabilities tab
   - Verify `transfers` is `active`

3. **Balance:**
   - Go to Balance
   - Check available balance
   - Ensure enough money to transfer

---

## ✅ Enhanced Logging Added

The `process-order-completion.js` function now logs:

- ✅ Transfer amount and driver info
- ✅ Platform balance check
- ✅ Driver account status verification
- ✅ Transfer creation success/failure
- ✅ Detailed error messages

**Look for these in logs:**
```
💸 CREATING TRANSFER TO DRIVER
   Order ID: xxx
   Driver ID: xxx
   Amount: $xx.xx
✅ TRANSFER CREATED SUCCESSFULLY!
   Transfer ID: tr_xxxxx
```

OR

```
❌❌❌ STRIPE TRANSFER ERROR ❌❌❌
   Error Code: xxx
   Error Message: xxx
```

---

## 🎯 Quick Test

To test if transfers work for a specific driver:

1. **Pick a recent completed order:**
   ```sql
   SELECT id, driver_id, total, status 
   FROM orders 
   WHERE status = 'delivered' 
   ORDER BY updated_at DESC 
   LIMIT 1;
   ```

2. **Manually trigger payout:**
   ```javascript
   POST /.netlify/functions/process-order-completion
   Body: { "orderId": "order-id-from-above" }
   ```

3. **Check response:**
   - If `success: true` → Transfer was created
   - Check Stripe Dashboard to verify transfer exists
   - If `error` → See error message for cause

---

## 🔍 Common Error Messages

### `insufficient_capabilities_for_transfer`
**Meaning:** Driver's transfers capability not active

**Fix:** Driver must complete Stripe onboarding

### `insufficient_funds`
**Meaning:** Platform doesn't have enough money

**Fix:** Wait for customer payments to settle, or check balance

### `account_invalid`
**Meaning:** Driver's Stripe account doesn't exist or is invalid

**Fix:** Driver must reconnect Stripe account

### `amount_too_large` or `amount_too_small`
**Meaning:** Transfer amount violates Stripe limits

**Fix:** Check transfer amount calculation

---

## 📊 What to Check Now

1. **Go to Netlify function logs** for `process-order-completion`
2. **Look for the most recent delivery** logs
3. **Check if you see:**
   - `✅ TRANSFER CREATED` → Working, check Stripe Dashboard
   - `❌ STRIPE TRANSFER ERROR` → Copy the error message

4. **Check Stripe Dashboard:**
   - Transfers tab → Are there any transfers to drivers?
   - If no transfers → Function is failing
   - If transfers exist → Money IS going to drivers (they see it in Stripe balance)

---

## 💡 Next Steps

1. **Review Netlify logs** for the enhanced error messages
2. **Check Stripe Dashboard** for transfers
3. **Test with a specific order** using the manual trigger
4. **Share the error message** if transfers are failing

The enhanced logging will now show EXACTLY why transfers are failing!


# 🔧 Stripe Connect Capabilities Explained

## ❓ What Are Stripe Capabilities?

When you create a Stripe Connect account for a driver, you request specific **capabilities** - these are permissions that allow the connected account to perform certain actions.

Think of capabilities as "features" that Stripe needs to approve for each driver's account.

---

## 🎯 Capabilities We Request for Drivers

### 1. **`transfers`** (CRITICAL for payouts)
**What it does:** Allows money to be transferred TO the driver's Stripe account.

**Why it's needed:** Without this capability active, the platform cannot send the driver their 70% payout. This is the #1 reason payouts fail.

**Status possibilities:**
- `not_requested` - We haven't asked for it yet (shouldn't happen)
- `pending` - We requested it, but Stripe is still reviewing/approving it
- `active` - ✅ APPROVED! Driver can receive transfers
- `inactive` - ❌ DECLINED or disabled (driver can't receive payouts)

### 2. **`card_payments`** 
**What it does:** Allows the driver's account to accept card payments directly.

**Why it's needed:** For future features, but not strictly required for receiving payouts.

---

## ⚠️ Why Capabilities Might Not Be Active

### Scenario 1: **Driver Hasn't Completed Onboarding**

**Problem:** Driver created Stripe account but didn't finish the onboarding process.

**What happens:**
```
1. Platform creates Stripe account → requests `transfers` capability
2. Capability status: `pending` 
3. Driver needs to complete onboarding:
   - Verify identity
   - Add bank account
   - Complete tax information
   - Submit required documents
4. Stripe reviews → capability becomes `active`
```

**Solution:** Driver must complete Stripe Connect onboarding fully.

---

### Scenario 2: **Stripe is Still Reviewing**

**Problem:** Driver completed onboarding, but Stripe needs time to review.

**What happens:**
```
1. Driver completes onboarding
2. Capability status: `pending` (Stripe reviewing)
3. Takes 1-3 business days for Stripe to approve
4. Once approved → capability becomes `active`
```

**Solution:** Wait for Stripe to complete review (usually 1-3 business days).

---

### Scenario 3: **Capability Was Declined**

**Problem:** Stripe declined the capability request (rare, but possible).

**What happens:**
```
1. Driver completes onboarding
2. Stripe reviews application
3. Stripe finds issue (verification failed, etc.)
4. Capability status: `inactive` (declined)
```

**Solution:** 
- Check Stripe dashboard for decline reason
- Driver may need to contact Stripe support
- May need to re-submit verification documents

---

## 🔍 How to Check Capability Status

### Method 1: Use Our Utility Function

```javascript
POST /.netlify/functions/check-driver-capabilities
Body: { "driverId": "driver-uuid" }

Response:
{
  "hasAccount": true,
  "capabilities": {
    "transfers": {
      "status": "active",  // ✅ Good!
      "enabled": true,
      "required": true
    },
    "card_payments": {
      "status": "pending",  // ⏳ Still reviewing
      "enabled": false,
      "required": true
    }
  },
  "needsAction": [],
  "recommendations": []
}
```

### Method 2: Check Stripe Dashboard

1. Go to https://dashboard.stripe.com
2. Navigate to **Connect** → **Accounts**
3. Find the driver's account
4. Click on the account
5. Go to **Capabilities** tab
6. Look for `transfers` capability status

---

## ✅ What "Active" Means

When `transfers` capability is **`active`**:
- ✅ Platform can create transfers to driver's account
- ✅ Driver will receive 70% payout
- ✅ Money will go to driver's Stripe balance
- ✅ Everything works as expected!

When `transfers` capability is **NOT active** (`pending` or `inactive`):
- ❌ Platform CANNOT create transfers
- ❌ Payout will fail with error: `insufficient_capabilities_for_transfer`
- ❌ Driver won't receive their money
- ❌ Need to fix before payouts work

---

## 🎯 What Drivers Need to Do

### Step 1: Complete Stripe Onboarding

Driver must:
1. Click the Stripe onboarding link provided
2. Complete all required steps:
   - Personal information
   - Business information (if applicable)
   - Bank account details
   - Tax information (SSN/EIN)
   - Identity verification
3. Submit all required documents

### Step 2: Wait for Stripe Review

After completing onboarding:
- Stripe automatically reviews the account
- Usually takes 1-3 business days
- Driver will receive email updates from Stripe

### Step 3: Verify Capability is Active

**Option A: Check in Stripe Dashboard**
- Driver logs into their Stripe Express dashboard
- Checks account status
- Verifies capabilities are active

**Option B: Platform checks automatically**
- Use `check-driver-capabilities` function
- Check logs when payout is attempted
- Error message will indicate if capability is missing

---

## 🚨 Common Error Messages

### Error: `insufficient_capabilities_for_transfer`

**Meaning:** The `transfers` capability is not active.

**Causes:**
- Driver hasn't completed onboarding
- Stripe is still reviewing
- Capability was declined

**Solution:**
1. Check capability status using `check-driver-capabilities`
2. If `pending`: Wait for Stripe review or ensure onboarding is complete
3. If `inactive`: Driver may need to contact Stripe or re-submit verification

---

## 📊 Capability Status Flow

```
Account Created
    ↓
Capability Requested (by platform)
    ↓
Status: "not_requested" or "pending"
    ↓
Driver Completes Onboarding
    ↓
Status: "pending" (Stripe reviewing)
    ↓
Stripe Reviews (1-3 business days)
    ↓
✅ Status: "active" → Payouts work!
OR
❌ Status: "inactive" → Need to fix issues
```

---

## 💡 Key Takeaways

1. **Capabilities are like permissions** - Stripe must approve them
2. **`transfers` capability is REQUIRED** - Without it, no payouts work
3. **Status must be `active`** - `pending` or `inactive` means it won't work
4. **Driver must complete onboarding** - This triggers Stripe's review
5. **Review takes 1-3 days** - Not instant, but usually quick

---

## 🔧 How Our Code Handles This

### When Creating Account:
```javascript
capabilities: {
  card_payments: { requested: true },
  transfers: { requested: true }  // ← We request it here
}
```

### When Checking Before Payout:
```javascript
const account = await stripe.accounts.retrieve(stripeAccountId);

// Check if transfers is active
if (account.capabilities?.transfers === 'active') {
  // ✅ Safe to create transfer
} else {
  // ❌ Will fail - capability not active
}
```

### When Payout Fails:
```javascript
if (stripeError.code === 'insufficient_capabilities_for_transfer') {
  // Tell driver: "You need to complete Stripe onboarding"
  // "Your transfers capability is not active yet"
}
```

---

## 📝 Summary

**"Driver's transfers capability isn't active yet"** means:

1. **We requested the `transfers` capability** when creating the driver's Stripe account
2. **But Stripe hasn't approved it yet** - Status is `pending` or `inactive`
3. **So we cannot send payouts** - Stripe blocks transfers until capability is active
4. **Driver needs to:** Complete onboarding and wait for Stripe review (usually 1-3 days)

**Once it's `active`:** Payouts will work perfectly! ✅


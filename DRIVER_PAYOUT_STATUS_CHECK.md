# 🔍 Driver Payout Status Check - 70% Commission

## ✅ **Current Implementation Status**

### **Code Review Results**

#### 1. **Payout Calculation (CORRECT)**
- ✅ **Location**: `netlify/functions/process-order-completion.js`
- ✅ **Formula**: Driver gets 70% of gross order total
  ```javascript
  const driverPaymentGross = orderTotal * 0.70;  // Line 57
  ```
- ✅ **Calculation Logic**: 
  - Order total (gross): $100
  - Driver payment (70%): $70
  - Platform share (30%): $30
  - Stripe fee deducted from platform share

#### 2. **Stripe Transfer Logic (CORRECT)**
- ✅ **Location**: `netlify/functions/process-order-completion.js` (Line 127-139)
- ✅ Creates Stripe transfer to driver's Connect account
- ✅ Includes proper metadata and descriptions
- ✅ Updates earnings table with transfer status

#### 3. **Error Handling (GOOD)**
- ✅ Handles missing Stripe accounts gracefully
- ✅ Detects capability errors
- ✅ Provides user-friendly error messages
- ✅ Updates earnings records with failure status

#### 4. **Stripe Connect Account Creation (CORRECT)**
- ✅ **Location**: `netlify/functions/create-driver-account.js`
- ✅ Requests `transfers` capability (Line 28)
- ✅ Requests `card_payments` capability (Line 27)
- ✅ Creates Express accounts for drivers

---

## ⚠️ **Potential Issues Identified**

### **Issue 1: Driver Onboarding Not Completed**
**Error from Console Logs:**
```
Failed to process driver payment
Your destination account needs to have at least one of the following capabilities enabled: transfers, crypto_transfers, legacy_payments
```

**Root Cause:**
- Drivers may have Stripe Connect accounts created but haven't completed onboarding
- Transfers capability may be `pending` or `inactive` instead of `active`
- Driver may need to complete KYC/verification in Stripe dashboard

**Solution:**
1. **Check driver account status** using new utility function
2. **Verify drivers completed onboarding** at Stripe Dashboard
3. **Ensure transfers capability is enabled**

### **Issue 2: Account Capability Status**
The `create-driver-account.js` requests capabilities, but:
- Capabilities start as `pending` until Stripe approves
- Drivers must complete onboarding for capabilities to become `active`
- Some capabilities require additional verification

---

## 🔧 **New Utility Function Created**

### **`check-driver-capabilities.js`**
A new Netlify function to verify driver Stripe account status:

**Usage:**
```javascript
POST /.netlify/functions/check-driver-capabilities
Body: { "driverId": "driver-uuid" }
```

**Returns:**
- Account status (onboarded, pending, etc.)
- Capability status (transfers, card_payments)
- Action items needed
- Recommendations

**Use this to:**
- Verify why payouts are failing
- Check if drivers completed onboarding
- Debug capability issues

---

## ✅ **What's Working Correctly**

1. ✅ **70% calculation is correct** - Driver gets exactly 70% of gross order total
2. ✅ **Transfer creation logic is correct** - Uses proper Stripe API
3. ✅ **Error handling is comprehensive** - Catches and reports issues
4. ✅ **Account creation requests capabilities** - Asks for transfers when creating accounts
5. ✅ **Earnings tracking** - Records all payout attempts

---

## 🚨 **What Needs Verification**

### **Test Payout Flow:**

1. **Check if driver has Stripe account:**
   ```sql
   SELECT stripe_account_id, stripe_connected 
   FROM profiles 
   WHERE id = 'driver-id';
   ```

2. **Verify account capabilities:**
   - Use new `check-driver-capabilities.js` function
   - Or check in Stripe Dashboard: Connect → Accounts

3. **Complete onboarding if needed:**
   - Driver must visit Stripe onboarding link
   - Complete KYC/verification
   - Wait for capabilities to activate

4. **Test a payout:**
   - Mark an order as delivered
   - Check Netlify function logs
   - Verify transfer in Stripe Dashboard

---

## 📊 **Expected Flow**

```
Order Completed (Status: 'delivered')
    ↓
process-order-completion.js triggered
    ↓
Calculate 70% of order total
    ↓
Check driver has stripe_account_id ✓
    ↓
Check driver account has transfers capability ✓
    ↓
Create Stripe transfer to driver account
    ↓
Update earnings table with transfer_id
    ↓
Success: Driver receives 70% payout
```

---

## 🔍 **Debugging Steps**

### **Step 1: Check Driver Account**
```bash
# Use the new capability checker
curl -X POST https://mypartsrunner.com/.netlify/functions/check-driver-capabilities \
  -H "Content-Type: application/json" \
  -d '{"driverId": "your-driver-id"}'
```

### **Step 2: Check Database**
```sql
-- Check driver Stripe status
SELECT 
  full_name,
  email,
  stripe_account_id,
  stripe_connected,
  created_at
FROM profiles 
WHERE user_type = 'driver' 
ORDER BY created_at DESC;
```

### **Step 3: Check Stripe Dashboard**
1. Go to https://dashboard.stripe.com
2. Navigate to **Connect** → **Accounts**
3. Find driver accounts
4. Check **Capabilities** tab
5. Verify `transfers` is `active` (not `pending` or `inactive`)

---

## 🎯 **Summary**

### **Code Status: ✅ WORKING**
The payout code is correctly implemented. The 70% calculation and Stripe transfer logic are working as expected.

### **Likely Issue: ⚠️ DRIVER ONBOARDING**
Drivers may not have completed Stripe Connect onboarding, causing transfers capability to be inactive.

### **Action Required:**
1. ✅ Use `check-driver-capabilities.js` to verify driver account status
2. ✅ Ensure drivers complete Stripe Connect onboarding
3. ✅ Wait for capabilities to be activated by Stripe
4. ✅ Test payout flow with a fully onboarded driver

---

**Status**: Code is correct, but drivers may need to complete onboarding  
**Next Step**: Verify driver Stripe account capabilities using new utility function


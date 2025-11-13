# Signup Requirements - MY-RUNNER.COM

## Overview
This document outlines what customers and drivers need to do when signing up for MY-RUNNER.COM.

---

## 🛒 CUSTOMER SIGNUP PROCESS

### Step 1: Create Account
**What they fill out:**
- Full Name
- Email Address
- Phone Number
- Password
- Select "Customer" as user type

**Where:** Homepage → Click "Sign Up" → Select "Customer" tab

### Step 2: Email Verification (Optional)
- System sends verification email
- User can verify email (recommended but not required)

### Step 3: Ready to Use!
**That's it!** Customers can immediately:
- Place orders
- Track orders
- View order history
- Update profile

**No additional verification required.**

---

## 🚗 DRIVER SIGNUP PROCESS

### Step 1: Create Account
**What they fill out:**
- Full Name
- Email Address
- Phone Number
- Password
- Select "Driver" as user type

**Where:** Homepage → Click "Sign Up" → Select "Driver" tab OR "Become a Driver"

### Step 2: Email Verification (Optional)
- System sends verification email
- User can verify email (recommended but not required)

### Step 3: Driver Application
**Where:** Redirected to `/driver-application` page

**What they fill out:**
- **Personal Information:**
  - Full Name (pre-filled)
  - Phone Number (pre-filled)
  - Driver's License Number
  - License State

- **Vehicle Information:**
  - Vehicle Make
  - Vehicle Model
  - Vehicle Year
  - Vehicle Color
  - License Plate Number

- **Insurance Information:**
  - Insurance Provider
  - Insurance Policy Number

- **Experience & Availability:**
  - Years of Experience
  - Transportation Type (Car, Motorcycle, Bicycle, etc.)
  - Availability

- **Additional Info:**
  - Why do you want to drive? (optional)

**Action:** Click "Submit Application"

### Step 4: Driver Verification & Onboarding
**After application submission:** Redirected to `/driver-verification`

**7-Day Deadline:** Drivers have 7 days to complete verification

**What they must complete:**

#### A. Document Uploads (Required)
1. **Driver's License (Front)**
   - Upload clear photo of front of license
   - Status: pending → uploaded → verified

2. **Driver's License (Back)**
   - Upload clear photo of back of license
   - Status: pending → uploaded → verified

3. **Insurance Documentation**
   - Upload insurance card or policy document
   - Status: pending → uploaded → verified

4. **Vehicle Registration**
   - Upload vehicle registration document
   - Status: pending → uploaded → verified

#### B. Background Check (Required)
- System initiates background check process
- Status: not_started → in_progress → approved/rejected
- Takes time (usually 1-3 business days)

#### C. Vehicle Information (Required)
**Where:** `/vehicle-settings` page

**What to provide:**
- Vehicle Make
- Vehicle Model
- Vehicle Year
- Vehicle Color
- License Plate Number
- Vehicle Type (Sedan, SUV, Truck, etc.)
- Transportation Type (if applicable)

**Document uploads:**
- Vehicle Registration (upload)
- Insurance Documentation (upload)

#### D. Stripe Payment Setup (Required)
**Why:** To receive driver payouts (70% of order total)

**What happens:**
1. Click "Create Payment Account"
2. System creates Stripe Connect account
3. Redirected to Stripe onboarding page
4. Complete Stripe's onboarding:
   - Business information
   - Tax information (SSN/EIN)
   - Bank account details
   - Identity verification

**Important:** Without Stripe setup, drivers cannot receive payouts!

### Step 5: Verification Complete
**When all requirements are met:**
- All documents verified
- Background check approved
- Vehicle info complete
- Stripe account connected

**Result:**
- Driver can start accepting orders
- Can go online and receive order notifications
- Eligible to receive payouts

---

## ⚡ AUTOMATIC PROCESSES (No User Action Required)

### For All Users (Customers & Drivers):
1. **Profile Creation**
   - Profile automatically created in database
   - User type set based on signup selection

### For Drivers Specifically:
1. **Driver Application Auto-Approval**
   - Application automatically approved upon submission
   - Driver marked as "active" status
   - Can proceed to verification immediately

2. **Stripe Account Creation**
   - Account created when driver clicks "Create Payment Account"
   - Stripe handles tax/banking verification

---

## 📋 SIGNUP COMPARISON

| Requirement | Customer | Driver |
|------------|----------|--------|
| **Signup Form** | ✅ Required | ✅ Required |
| **Email Verification** | ⚪ Optional | ⚪ Optional |
| **Application Form** | ❌ Not needed | ✅ Required |
| **Document Uploads** | ❌ Not needed | ✅ Required (4 documents) |
| **Background Check** | ❌ Not needed | ✅ Required |
| **Vehicle Information** | ❌ Not needed | ✅ Required |
| **Stripe Setup** | ❌ Not needed | ✅ Required (for payouts) |
| **Verification Deadline** | ❌ N/A | ⏰ 7 days |

---

## 🎯 SUMMARY

### Customer Signup:
1. Fill out signup form
2. Accept push notification permission
3. **Done!** Can place orders immediately

### Driver Signup:
1. Fill out signup form
2. Accept push notification permission
3. Complete driver application form
4. Upload 4 required documents
5. Complete background check (auto-processed)
6. Add vehicle information
7. Set up Stripe payment account
8. Wait for verification approval
9. **Ready!** Can accept orders and earn money

### Key Differences:
- **Customers:** Simple signup, immediate access
- **Drivers:** More extensive onboarding (documents, verification, payment setup)
- **Both:** Real-time alerts available in-app

---

## 💡 NOTES

- **Real-Time Alerts:** Users can monitor orders directly within the app
- **Driver Verification:** 7-day deadline starts after application submission
- **Stripe Setup:** Critical for drivers to receive payouts - must be completed
- **All Other Steps:** Automated by the system, users just need to provide information


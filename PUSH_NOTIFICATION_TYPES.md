# Push Notification Types - MyPartsRunner

## Overview
Push notifications are automatically enabled for all users (drivers and customers) when they log in. Notifications are sent based on order status changes and important events.

---

## 🔴 DRIVER NOTIFICATIONS

Drivers receive push notifications for:

### 1. **New Order Available** 📦
- **When:** A new order is placed and broadcast to nearby online drivers
- **Title:** "New Order Available!"
- **Body:** Order details (ID, amount, pickup location)
- **Action:** Driver can accept the order
- **Triggered by:** Order creation when drivers are online

### 2. **Order Assigned** ✅
- **When:** Driver accepts an order or order is auto-assigned to them
- **Title:** "Order Assigned!"
- **Body:** Confirmation that order is now theirs
- **Triggered by:** Driver accepts order or system auto-assignment

### 3. **Order Status Updates** (from RealTimeOrderService)
- **When:** Order status changes (picked up, in transit, delivered)
- **Triggered by:** Order status updates in database

### 4. **Queued Order Available** ⏰
- **When:** An order has been waiting and is re-broadcast to drivers
- **Title:** "Queued Order Available!"
- **Body:** Order details that needs a driver
- **Triggered by:** OrderQueueService when orders wait too long

---

## 🟢 CUSTOMER NOTIFICATIONS

Customers receive push notifications for:

### 1. **Driver Assigned** 🚗
- **When:** A driver accepts/gets assigned to their order
- **Title:** "Order Update"
- **Body:** "Your order #[ID] has been assigned to a driver!"
- **Triggered by:** Driver accepts order

### 2. **Order Status Updates** (from RealTimeOrderService)
- **When:** Order status changes
- **Status Types:**
  - **accepted:** "Your order #[ID] has been accepted by a driver!"
  - **picked_up:** "Your order #[ID] has been picked up!"
  - **in_transit:** "Your order #[ID] is on the way!"
  - **delivered:** "Your order #[ID] has been delivered!"
  - **rejected:** "Your order #[ID] is being reassigned to another driver."
- **Triggered by:** Real-time order status changes

---

## 🔒 NOTIFICATIONS PREVENTED

### Customers DO NOT Receive:
- ❌ **"New Order Available"** notifications (these are driver-only)
- ❌ Any order discovery/broadcast notifications
- ✅ System automatically filters these out

### Protection Logic:
The system checks user type before sending "New Order Available" notifications:
- Verifies user is a 'driver' before sending
- Skips notification if user is not a driver
- This prevents customers from seeing order broadcasts

---

## 📱 AUTO-ENABLEMENT

### When Notifications Are Enabled:
- **On First Login:** Automatically requests permission and subscribes
- **On Subsequent Logins:** Automatically restores subscription if browser has one
- **Requirement:** User must accept browser permission prompt (one-time)

### When Notifications Work:
- ✅ User is logged in
- ✅ Browser permission is granted
- ✅ Subscription exists in database
- ✅ User's browser supports push notifications

### When Notifications DON'T Work:
- ❌ User denied permission
- ❌ User is logged out
- ❌ Browser doesn't support push notifications
- ❌ Subscription not saved to database (auto-restore should fix this)

---

## 🔄 NOTIFICATION FLOW

### Order Creation Flow:
1. Customer places order
2. System finds nearby online drivers
3. **Drivers get:** "New Order Available!" push notification
4. Driver accepts order
5. **Customer gets:** "Order Update - Driver Assigned!" push notification
6. **Driver gets:** "Order Assigned!" confirmation

### Order Status Update Flow:
1. Driver updates order status (picked_up, in_transit, delivered)
2. **Customer gets:** Real-time status update notification
3. **Driver may get:** Confirmation or system notifications

---

## 📊 TECHNICAL DETAILS

### Notification Service:
- Uses Web Push API (VAPID keys)
- Stored in `push_subscriptions` table
- Sent via `/netlify/functions/send-push`
- Real-time updates via Supabase subscriptions

### Auto-Enable Service:
- `AutoPushNotificationService` handles automatic subscription
- Triggered on login (`SIGNED_IN`, `INITIAL_SESSION` events)
- Checks browser + database subscription status
- Auto-creates subscription if missing

---

## 🎯 SUMMARY

**Drivers get:**
- New order broadcasts
- Order assignment confirmations
- Order status updates
- Queued order notifications

**Customers get:**
- Driver assignment notifications
- Order status updates (picked up, in transit, delivered)
- NO order discovery/broadcast notifications

**Both get notifications automatically when:**
- Logged in
- Permission granted
- Subscription active


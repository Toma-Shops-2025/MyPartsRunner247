# Driver Availability Table Explained

This guide explains the difference between `id` and `driver_id` in the `driver_availability` table.

## 🔍 **The Difference**

### **`id` - Primary Key**
- **What it is:** The primary key of the `driver_availability` table itself
- **Type:** `UUID` (Universally Unique Identifier)
- **Purpose:** Uniquely identifies each **record** in the `driver_availability` table
- **Example:** `0299535d-4b76-4ebc-8b4c-eb85220db71`
- **Think of it as:** The record's own unique ID number

### **`driver_id` - Foreign Key**
- **What it is:** A reference to the driver's user ID from the `profiles` table
- **Type:** `UUID` (references `profiles.id`)
- **Purpose:** Links this availability record to a specific driver
- **Example:** `979ab63f-9f4e-4dd9-b86a-ca37a...`
- **Think of it as:** Which driver this availability record belongs to

---

## 📊 **Table Structure**

```sql
CREATE TABLE driver_availability (
  id UUID PRIMARY KEY,                    -- Unique ID for THIS record
  driver_id UUID REFERENCES profiles(id), -- Which driver this record belongs to
  is_online BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT FALSE,
  max_orders INTEGER DEFAULT 3,
  current_orders INTEGER DEFAULT 0,
  last_seen TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
);
```

### **Key Points:**
- **`id`** is UNIQUE to each availability record
- **`driver_id`** is UNIQUE per driver (one driver = one availability record)
- **`driver_id`** references `profiles.id` (foreign key relationship)

---

## 🔗 **The Relationship**

### **One-to-One Relationship:**
```
profiles table          driver_availability table
┌─────────────┐         ┌──────────────────────┐
│ id          │◄────────│ driver_id (FK)       │
│ email       │         │ id (PK)              │
│ full_name   │         │ is_online            │
│ user_type   │         │ is_available         │
│ ...         │         │ last_seen            │
└─────────────┘         └──────────────────────┘
     │                          │
     │                          │
  One driver        One availability record
```

### **Example:**
```
profiles table:
┌─────────────────────────────────────┐
│ id: 979ab63f-9f4e-4dd9-b86a-ca37a   │
│ email: driver@example.com           │
│ full_name: John Driver              │
└─────────────────────────────────────┘
                │
                │ references
                ▼
driver_availability table:
┌─────────────────────────────────────┐
│ id: 0299535d-4b76-4ebc-8b4c-eb85220 │ ← Unique record ID
│ driver_id: 979ab63f-9f4e-4dd9-...   │ ← Links to driver above
│ is_online: TRUE                      │
│ last_seen: 2025-01-13 15:30:00      │
└─────────────────────────────────────┘
```

---

## 💡 **Why Two IDs?**

### **`id` - Table Record Identifier**
- Every table needs a primary key to uniquely identify each row
- Used for database operations (updates, deletes, joins)
- Example: "Update availability record `0299535d-4b76-4ebc-8b4c-eb85220db71`"

### **`driver_id` - Relationship Link**
- Links the availability record to the actual driver
- Used to find which driver an availability record belongs to
- Example: "Find availability for driver `979ab63f-9f4e-4dd9-b86a-ca37a...`"

---

## 🔍 **How to Use Each ID**

### **Using `id` (Record ID):**
```sql
-- Find a specific availability record by its ID
SELECT * FROM driver_availability 
WHERE id = '0299535d-4b76-4ebc-8b4c-eb85220db71';

-- Delete a specific availability record
DELETE FROM driver_availability 
WHERE id = '0299535d-4b76-4ebc-8b4c-eb85220db71';
```

### **Using `driver_id` (Driver Reference):**
```sql
-- Find availability for a specific driver
SELECT * FROM driver_availability 
WHERE driver_id = '979ab63f-9f4e-4dd9-b86a-ca37a...';

-- Join with profiles to get driver info
SELECT 
  p.full_name,
  p.email,
  da.is_online,
  da.last_seen
FROM profiles p
JOIN driver_availability da ON p.id = da.driver_id
WHERE da.is_online = true;
```

---

## 📝 **Real-World Example**

### **Scenario:**
- Driver "John Doe" has user ID: `979ab63f-9f4e-4dd9-b86a-ca37a...`
- When he logs in, a record is created in `driver_availability`

### **What Happens:**
1. **Record Created:**
   - `id` = `0299535d-4b76-4ebc-8b4c-eb85220db71` (auto-generated unique ID)
   - `driver_id` = `979ab63f-9f4e-4dd9-b86a-ca37a...` (John's user ID)
   - `is_online` = `TRUE`

2. **When You Query:**
   ```sql
   -- Find John's availability by his user ID
   SELECT * FROM driver_availability 
   WHERE driver_id = '979ab63f-9f4e-4dd9-b86a-ca37a...';
   ```

3. **When You Update:**
   ```sql
   -- Update John's availability by his user ID (most common)
   UPDATE driver_availability 
   SET is_online = FALSE 
   WHERE driver_id = '979ab63f-9f4e-4dd9-b86a-ca37a...';
   
   -- Or update by record ID (less common)
   UPDATE driver_availability 
   SET is_online = FALSE 
   WHERE id = '0299535d-4b76-4ebc-8b4c-eb85220db71';
   ```

---

## 🎯 **Key Takeaways**

### **`id`:**
- ✅ Unique identifier for the **availability record**
- ✅ Primary key of the `driver_availability` table
- ✅ Used for database operations on the record itself
- ❌ Not used to identify which driver it belongs to

### **`driver_id`:**
- ✅ Links to the **driver's user ID** in `profiles` table
- ✅ Foreign key relationship
- ✅ Used to find availability for a specific driver
- ✅ Used in joins with `profiles` table
- ❌ Not the record's primary key

---

## 🔧 **Common Use Cases**

### **Most Common: Find by `driver_id`**
```sql
-- Get availability for a specific driver
SELECT * FROM driver_availability 
WHERE driver_id = 'driver-user-id-here';
```

### **Less Common: Find by `id`**
```sql
-- Get a specific availability record
SELECT * FROM driver_availability 
WHERE id = 'availability-record-id-here';
```

### **Join Query:**
```sql
-- Get driver info with their availability
SELECT 
  p.full_name,
  p.email,
  da.is_online,
  da.last_seen
FROM profiles p
LEFT JOIN driver_availability da ON p.id = da.driver_id
WHERE p.user_type = 'driver';
```

---

## ⚠️ **Important Notes**

1. **One Driver = One Record:**
   - Each driver can only have **one** availability record
   - The `driver_id` is UNIQUE (enforced by the database)

2. **Cascade Delete:**
   - If a driver is deleted from `profiles`, their availability record is automatically deleted
   - This is handled by `ON DELETE CASCADE`

3. **Always Use `driver_id`:**
   - When querying for a driver's availability, use `driver_id`
   - The `id` is mainly for internal database operations

---

## 📚 **Summary**

| Field | Purpose | Example |
|-------|---------|---------|
| `id` | Primary key of the availability record | `0299535d-4b76-4ebc-8b4c-eb85220db71` |
| `driver_id` | Foreign key linking to driver's user ID | `979ab63f-9f4e-4dd9-b86a-ca37a...` |

**Simple Answer:**
- **`id`** = The availability record's own unique ID
- **`driver_id`** = Which driver this availability record belongs to

---

**Last Updated:** 2025-01-13
**Platform:** MY-RUNNER.COM


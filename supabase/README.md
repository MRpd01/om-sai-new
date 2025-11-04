# Supabase Database Setup

This folder contains SQL schema for the Mess Management Platform (Single Mess System: **ओम साई भोजनालय**)

## 📋 Setup Order

Run these SQL files in your Supabase SQL Editor **in this exact order**:

### 1. **01_types_and_tables.sql**
   - Creates custom types (user_role, subscription_type, payment_status, etc.)
   - Creates all tables (users, messes, mess_members, payments, enquiries, notifications, menus, menu_items, mess_admins)
   - Sets up foreign key relationships

### 2. **02_security_policies.sql**
   - Creates Row Level Security (RLS) policies
   - Allows users to view/update their own data
   - Allows admins to manage members
   - Enables user self-subscription

### 3. **03_indexes_functions.sql**
   - Creates database indexes for performance
   - Adds helper functions (if any)
   - Optimizes common queries

### 4. **setup_single_mess.sql**
   - Creates the single mess: **ओम साई भोजनालय**
   - Sets up initial pricing (₹2600 full_month, ₹1300 half_month, etc.)
   - Assigns existing users to this mess

### 5. **auto_assign_mess_to_users.sql** ⭐ **CRITICAL**
   - Creates a database trigger that **automatically assigns mess_id** to every new user
   - Updates existing users without mess_id
   - Ensures all future signups are auto-assigned to ओम साई भोजनालय
   - **No manual assignment needed anymore!**

---

## 🔑 Key Tables

- **users**: Extends Supabase auth.users with profile details (name, mobile, photo_url, role, mess_id)
- **messes**: Mess businesses with pricing JSON and admin reference
- **mess_members**: Membership records with subscription_type, payment tracking, and status
- **payments**: Payment records with PhonePe integration, advance payment tracking
- **enquiries**: User enquiries to mess admins
- **mess_admins**: Additional admin assignments per mess
- **notifications**: Notifications to users
- **menus**: Daily or date-specific menus (menu_date unique per mess)
- **menu_items**: Items within a menu (name, description, is_veg, price, image_url)

---

## 🎯 Single Mess System

This platform is designed for **ONE MESS ONLY**: **ओम साई भोजनालय**

- All users are automatically assigned to this mess upon signup (via trigger)
- No multi-mess functionality
- Simplified user experience - users don't choose a mess
- Admin manages only their own mess members

---

## 📝 Migration Notes

- Apply these schemas in a **development Supabase project** first
- For production, run incremental migrations instead of wholesale apply
- Ensure `auth.users` table exists (Supabase Auth) before creating `public.users`
- Enable required extensions (e.g., pgcrypto, pgjwt) if not present
- Always backup your database before running new migrations

---

## ✅ Verification

After running all scripts, verify the setup:

```sql
-- Check if mess exists
SELECT * FROM public.messes WHERE name = 'ओम साई भोजनालय';

-- Check if trigger is created
SELECT tgname FROM pg_trigger WHERE tgname = 'trigger_auto_assign_mess';

-- Check if all users have mess_id
SELECT 
    COUNT(*) as total_users,
    COUNT(mess_id) as users_with_mess,
    COUNT(*) - COUNT(mess_id) as users_without_mess
FROM public.users;
```

Expected result: `users_with_mess` = `total_users` (all users assigned)

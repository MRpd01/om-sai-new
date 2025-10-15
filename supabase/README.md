This folder contains SQL schema for the Mess Management Platform intended for Supabase.

Key tables defined:
- users: Extends Supabase auth.users and stores profile details (name, mobile, photo_url, role, mess_id).
- messes: Mess businesses with pricing JSON and admin reference.
- mess_members: Membership records linking users to messes, subscription type and expiry.
- payments: PhonePe-related payments and statuses.
- enquiries: User enquiries to mess admins.
- mess_admins: Additional admin assignments per mess.
- notifications: Notifications to users.
- menus: Daily or date-specific menus per mess (menu_date unique per mess).
- menu_items: Items within a menu (name, description, is_veg, price, image_url).

Migration notes:
- Apply this schema in a development Supabase project. For production, run incremental migrations instead of wholesale apply.
- Ensure `auth.users` is present (Supabase Auth) before creating `public.users`.
- When deploying to Supabase, enable required extensions (e.g., pgcrypto or pgjwt) if not present.

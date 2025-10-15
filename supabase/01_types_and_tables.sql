-- Part 1: Create custom types and main tables
-- Run this first in Supabase SQL Editor

-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE subscription_type AS ENUM ('full_month', 'half_month', 'single_morning', 'single_evening', 'double_time');
CREATE TYPE payment_status AS ENUM ('success', 'due', 'pending', 'failed');
CREATE TYPE enquiry_status AS ENUM ('pending', 'responded', 'closed');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create users table (extends Supabase auth.users)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT NOT NULL,
    mobile_number TEXT NOT NULL UNIQUE,
    parent_mobile TEXT,
    photo_url TEXT,
    role user_role DEFAULT 'user',
    mess_id UUID REFERENCES public.messes(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create messes table
CREATE TABLE public.messes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    admin_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    pricing JSONB NOT NULL DEFAULT '{"full_month": 0, "half_month": 0, "single_morning": 0, "single_evening": 0, "double_time": 0}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create mess_members table
CREATE TABLE public.mess_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    subscription_type subscription_type NOT NULL,
    payment_status payment_status DEFAULT 'due',
    joining_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, mess_id)
);

-- Create payments table
CREATE TABLE public.payments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    phonepe_transaction_id TEXT NOT NULL UNIQUE,
    phonepe_merchant_transaction_id TEXT UNIQUE,
    status payment_status DEFAULT 'pending',
    subscription_type subscription_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create enquiries table
CREATE TABLE public.enquiries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    message TEXT NOT NULL,
    status enquiry_status DEFAULT 'pending',
    admin_response TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create mess_admins table
CREATE TABLE public.mess_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES public.users(id) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(mess_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_via JSONB DEFAULT '{"email": false, "whatsapp": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create menus table
CREATE TABLE public.menus (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    menu_date DATE NOT NULL,
    title TEXT,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(mess_id, menu_date)
);

-- Create menu_items table
CREATE TABLE public.menu_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_id UUID REFERENCES public.menus(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_veg BOOLEAN DEFAULT true,
    price DECIMAL(10,2) DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
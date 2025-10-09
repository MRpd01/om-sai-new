-- Create custom types
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE subscription_type AS ENUM ('full_month', 'half_month', 'single_morning', 'single_evening', 'double_time');
CREATE TYPE payment_status AS ENUM ('success', 'due', 'pending', 'failed');
CREATE TYPE enquiry_status AS ENUM ('pending', 'responded', 'closed');

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
    razorpay_order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
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

-- Create mess_admins table (for multiple admins per mess)
CREATE TABLE public.mess_admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    mess_id UUID REFERENCES public.messes(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    assigned_by UUID REFERENCES public.users(id) NOT NULL, -- The owner who assigned this admin
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(mess_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'payment_reminder', 'expiry_alert', 'welcome', etc.
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_via JSONB DEFAULT '{"email": false, "whatsapp": false}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Users policies
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view users in their mess" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.messes 
            WHERE admin_id = auth.uid() 
            AND id = users.mess_id
        )
        OR
        EXISTS (
            SELECT 1 FROM public.mess_admins 
            WHERE user_id = auth.uid() 
            AND mess_id = users.mess_id
            AND is_active = true
        )
    );

-- Messes policies
CREATE POLICY "Anyone can view active messes" ON public.messes
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage their own mess" ON public.messes
    FOR ALL USING (admin_id = auth.uid());

-- Mess admins policies
CREATE POLICY "Mess admins can view assigned messes" ON public.mess_admins
    FOR SELECT USING (user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM public.messes 
            WHERE admin_id = auth.uid() 
            AND id = mess_admins.mess_id
        )
    );

CREATE POLICY "Mess owners can manage admins" ON public.mess_admins
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.messes 
            WHERE admin_id = auth.uid() 
            AND id = mess_admins.mess_id
        )
    );

-- Mess members policies
CREATE POLICY "Users can view their own membership" ON public.mess_members
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admins can manage members in their mess" ON public.mess_members
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.messes 
            WHERE admin_id = auth.uid() 
            AND id = mess_members.mess_id
        )
        OR
        EXISTS (
            SELECT 1 FROM public.mess_admins 
            WHERE user_id = auth.uid() 
            AND mess_id = mess_members.mess_id
            AND is_active = true
        )
    );

-- Create indexes for better performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_mess_id ON public.users(mess_id);
CREATE INDEX idx_mess_members_user_id ON public.mess_members(user_id);
CREATE INDEX idx_mess_members_mess_id ON public.mess_members(mess_id);
CREATE INDEX idx_mess_members_expiry_date ON public.mess_members(expiry_date);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_mess_id ON public.payments(mess_id);
CREATE INDEX idx_payments_status ON public.payments(status);

-- Create menus table (daily or date-specific menus per mess)
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

-- Enable Row Level Security on menus
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

-- Menus policies
CREATE POLICY "Anyone can view active menus for a mess" ON public.menus
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage menus for their mess" ON public.menus
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.messes
            WHERE admin_id = auth.uid()
            AND id = menus.mess_id
        )
        OR
        EXISTS (
            SELECT 1 FROM public.mess_admins
            WHERE user_id = auth.uid()
            AND mess_id = menus.mess_id
            AND is_active = true
        )
    );

-- Menu items policies
CREATE POLICY "Anyone can view menu items for active menus" ON public.menu_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.menus WHERE id = menu_items.menu_id AND is_active = true
        )
    );

CREATE POLICY "Admins can manage menu items for their mess" ON public.menu_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.menus m
            JOIN public.messes mm ON mm.id = m.mess_id
            WHERE m.id = menu_items.menu_id
            AND mm.admin_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.mess_admins ma
            JOIN public.menus m2 ON m2.mess_id = ma.mess_id
            WHERE ma.user_id = auth.uid()
            AND m2.id = menu_items.menu_id
            AND ma.is_active = true
        )
    );

-- Indexes for menus
CREATE INDEX idx_menus_mess_id ON public.menus(mess_id);
CREATE INDEX idx_menus_menu_date ON public.menus(menu_date);
CREATE INDEX idx_menu_items_menu_id ON public.menu_items(menu_id);

-- Triggers for updated_at on menus and menu_items
CREATE TRIGGER set_timestamp_menus
    BEFORE UPDATE ON public.menus
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_menu_items
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

-- =====================
-- RPC functions for menus
-- =====================

/*
    create_menu(mess_id, menu_date, title, notes) -> creates a menu for the mess if caller is owner or assigned admin
*/
CREATE OR REPLACE FUNCTION public.create_menu(
    p_mess_id UUID,
    p_menu_date DATE,
    p_title TEXT,
    p_notes TEXT
) RETURNS public.menus AS $$
DECLARE
    v_exists BOOLEAN;
    v_row public.menus;
BEGIN
    -- ensure caller is owner or assigned admin for the target mess
    SELECT EXISTS(
        SELECT 1 FROM public.messes WHERE id = p_mess_id AND admin_id = auth.uid()
    ) OR EXISTS(
        SELECT 1 FROM public.mess_admins WHERE mess_id = p_mess_id AND user_id = auth.uid() AND is_active = true
    ) INTO v_exists;

    IF NOT v_exists THEN
        RAISE EXCEPTION 'permission denied';
    END IF;

    INSERT INTO public.menus(mess_id, menu_date, title, notes)
    VALUES (p_mess_id, p_menu_date, p_title, p_notes)
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
    update_menu(menu_id, title, notes, is_active) -> updates a menu if caller has rights
*/
CREATE OR REPLACE FUNCTION public.update_menu(
    p_menu_id UUID,
    p_title TEXT,
    p_notes TEXT,
    p_is_active BOOLEAN
) RETURNS public.menus AS $$
DECLARE
    v_exists BOOLEAN;
    v_row public.menus;
    v_mess_id UUID;
BEGIN
    SELECT mess_id INTO v_mess_id FROM public.menus WHERE id = p_menu_id;
    IF v_mess_id IS NULL THEN
        RAISE EXCEPTION 'menu not found';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.messes WHERE id = v_mess_id AND admin_id = auth.uid()
    ) OR EXISTS(
        SELECT 1 FROM public.mess_admins WHERE mess_id = v_mess_id AND user_id = auth.uid() AND is_active = true
    ) INTO v_exists;

    IF NOT v_exists THEN
        RAISE EXCEPTION 'permission denied';
    END IF;

    UPDATE public.menus SET title = p_title, notes = p_notes, is_active = p_is_active, updated_at = NOW()
    WHERE id = p_menu_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
    delete_menu(menu_id) -> deletes a menu if caller has rights
*/
CREATE OR REPLACE FUNCTION public.delete_menu(p_menu_id UUID) RETURNS void AS $$
DECLARE
    v_mess_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT mess_id INTO v_mess_id FROM public.menus WHERE id = p_menu_id;
    IF v_mess_id IS NULL THEN
        RAISE EXCEPTION 'menu not found';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.messes WHERE id = v_mess_id AND admin_id = auth.uid()
    ) OR EXISTS(
        SELECT 1 FROM public.mess_admins WHERE mess_id = v_mess_id AND user_id = auth.uid() AND is_active = true
    ) INTO v_exists;

    IF NOT v_exists THEN
        RAISE EXCEPTION 'permission denied';
    END IF;

    DELETE FROM public.menus WHERE id = p_menu_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- RPC functions for menu_items
-- =====================

/*
    create_menu_item(menu_id, name, description, is_veg, price, image_url)
*/
CREATE OR REPLACE FUNCTION public.create_menu_item(
    p_menu_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_is_veg BOOLEAN DEFAULT true,
    p_price NUMERIC DEFAULT 0,
    p_image_url TEXT DEFAULT NULL
) RETURNS public.menu_items AS $$
DECLARE
    v_mess_id UUID;
    v_exists BOOLEAN;
    v_row public.menu_items;
BEGIN
    SELECT mess_id INTO v_mess_id FROM public.menus WHERE id = p_menu_id;
    IF v_mess_id IS NULL THEN
        RAISE EXCEPTION 'menu not found';
    END IF;

    SELECT EXISTS(
        SELECT 1 FROM public.messes WHERE id = v_mess_id AND admin_id = auth.uid()
    ) OR EXISTS(
        SELECT 1 FROM public.mess_admins WHERE mess_id = v_mess_id AND user_id = auth.uid() AND is_active = true
    ) INTO v_exists;

    IF NOT v_exists THEN
        RAISE EXCEPTION 'permission denied';
    END IF;

    INSERT INTO public.menu_items(menu_id, name, description, is_veg, price, image_url)
    VALUES (p_menu_id, p_name, p_description, p_is_veg, p_price, p_image_url)
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
    update_menu_item(item_id, name, description, is_veg, price, image_url)
*/
CREATE OR REPLACE FUNCTION public.update_menu_item(
    p_item_id UUID,
    p_name TEXT,
    p_description TEXT,
    p_is_veg BOOLEAN,
    p_price NUMERIC,
    p_image_url TEXT
) RETURNS public.menu_items AS $$
DECLARE
    v_menu_id UUID;
    v_mess_id UUID;
    v_exists BOOLEAN;
    v_row public.menu_items;
BEGIN
    SELECT menu_id INTO v_menu_id FROM public.menu_items WHERE id = p_item_id;
    IF v_menu_id IS NULL THEN
        RAISE EXCEPTION 'menu item not found';
    END IF;

    SELECT mess_id INTO v_mess_id FROM public.menus WHERE id = v_menu_id;

    SELECT EXISTS(
        SELECT 1 FROM public.messes WHERE id = v_mess_id AND admin_id = auth.uid()
    ) OR EXISTS(
        SELECT 1 FROM public.mess_admins WHERE mess_id = v_mess_id AND user_id = auth.uid() AND is_active = true
    ) INTO v_exists;

    IF NOT v_exists THEN
        RAISE EXCEPTION 'permission denied';
    END IF;

    UPDATE public.menu_items SET name = p_name, description = p_description, is_veg = p_is_veg, price = p_price, image_url = p_image_url, updated_at = NOW()
    WHERE id = p_item_id
    RETURNING * INTO v_row;

    RETURN v_row;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

/*
    delete_menu_item(item_id)
*/
CREATE OR REPLACE FUNCTION public.delete_menu_item(p_item_id UUID) RETURNS void AS $$
DECLARE
    v_menu_id UUID;
    v_mess_id UUID;
    v_exists BOOLEAN;
BEGIN
    SELECT menu_id INTO v_menu_id FROM public.menu_items WHERE id = p_item_id;
    IF v_menu_id IS NULL THEN
        RAISE EXCEPTION 'menu item not found';
    END IF;

    SELECT mess_id INTO v_mess_id FROM public.menus WHERE id = v_menu_id;

    SELECT EXISTS(
        SELECT 1 FROM public.messes WHERE id = v_mess_id AND admin_id = auth.uid()
    ) OR EXISTS(
        SELECT 1 FROM public.mess_admins WHERE mess_id = v_mess_id AND user_id = auth.uid() AND is_active = true
    ) INTO v_exists;

    IF NOT v_exists THEN
        RAISE EXCEPTION 'permission denied';
    END IF;

    DELETE FROM public.menu_items WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission so authenticated users can call these RPCs (RLS and checks inside functions still apply)
GRANT EXECUTE ON FUNCTION public.create_menu(UUID, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_menu(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_menu(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_menu_item(UUID, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_menu_item(UUID, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_menu_item(UUID) TO authenticated;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_timestamp_users
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_messes
    BEFORE UPDATE ON public.messes
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_mess_members
    BEFORE UPDATE ON public.mess_members
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_payments
    BEFORE UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_enquiries
    BEFORE UPDATE ON public.enquiries
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
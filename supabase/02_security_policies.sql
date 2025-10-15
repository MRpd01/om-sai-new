-- Part 2: Enable RLS and Create Security Policies
-- Run this after Part 1 is successful

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mess_admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;

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
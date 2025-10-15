-- Part 3: Create Indexes, Triggers, and RPC Functions
-- Run this after Part 2 is successful

-- Create indexes for better performance
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_mess_id ON public.users(mess_id);
CREATE INDEX idx_mess_members_user_id ON public.mess_members(user_id);
CREATE INDEX idx_mess_members_mess_id ON public.mess_members(mess_id);
CREATE INDEX idx_mess_members_expiry_date ON public.mess_members(expiry_date);
CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_mess_id ON public.payments(mess_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_menus_mess_id ON public.menus(mess_id);
CREATE INDEX idx_menus_menu_date ON public.menus(menu_date);
CREATE INDEX idx_menu_items_menu_id ON public.menu_items(menu_id);

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

CREATE TRIGGER set_timestamp_menus
    BEFORE UPDATE ON public.menus
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_menu_items
    BEFORE UPDATE ON public.menu_items
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

-- RPC Functions for menu management
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_menu(UUID, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_menu(UUID, TEXT, TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_menu(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_menu_item(UUID, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_menu_item(UUID, TEXT, TEXT, BOOLEAN, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_menu_item(UUID) TO authenticated;
-- ============================================
-- DuitFlow - Dummy Data Seeder
-- Run this in the Supabase SQL Editor AFTER you register an account in the app.
--
-- INSTRUCTIONS:
-- 1. Register a new account normally via your DuitFlow app (e.g. email "test@test.com")
-- 2. Change the 'test@test.com' below to the email you just registered.
-- 3. Run this script.
-- ============================================

DO $$
DECLARE
    target_email TEXT := 'test@test.com'; -- <<< GANTI DENGAN EMAIL ANDA
    target_user_id UUID;
    default_wallet UUID;
    cat_food UUID;
    cat_transport UUID;
    cat_bills UUID;
    proj_bali UUID;
BEGIN
    SELECT id INTO target_user_id FROM auth.users WHERE email = target_email LIMIT 1;

    IF target_user_id IS NULL THEN
        RAISE EXCEPTION 'User dengan email % tidak ditemukan. Silakan register dulu di aplikasi.', target_email;
    END IF;

    DELETE FROM transactions WHERE user_id = target_user_id;
    DELETE FROM projects WHERE user_id = target_user_id;
    DELETE FROM wishlist WHERE user_id = target_user_id;
    DELETE FROM subscriptions WHERE user_id = target_user_id;

    SELECT id INTO default_wallet
    FROM wallets
    WHERE user_id = target_user_id
    ORDER BY created_at
    LIMIT 1;

    IF default_wallet IS NULL THEN
        INSERT INTO wallets (user_id, name, type, color, icon, balance, initial_balance)
        VALUES (target_user_id, 'Cash', 'cash', 'hsl(145, 65%, 50%)', 'cash', 0, 0)
        RETURNING id INTO default_wallet;
    END IF;

    SELECT id INTO cat_food FROM categories WHERE user_id = target_user_id AND name = 'Food' LIMIT 1;
    SELECT id INTO cat_transport FROM categories WHERE user_id = target_user_id AND name = 'Transportation' LIMIT 1;
    SELECT id INTO cat_bills FROM categories WHERE user_id = target_user_id AND name = 'Bills' LIMIT 1;

    IF cat_food IS NULL THEN
        INSERT INTO categories (user_id, name, icon, color, is_default, type) VALUES
            (target_user_id, 'Food', 'food', '#FF6B6B', true, 'expense'),
            (target_user_id, 'Transportation', 'transport', '#4ECDC4', true, 'expense'),
            (target_user_id, 'Bills', 'bill', '#45B7D1', true, 'expense')
        RETURNING id INTO cat_food;

        SELECT id INTO cat_transport FROM categories WHERE user_id = target_user_id AND name = 'Transportation' LIMIT 1;
        SELECT id INTO cat_bills FROM categories WHERE user_id = target_user_id AND name = 'Bills' LIMIT 1;
    END IF;

    INSERT INTO transactions (
        user_id,
        wallet_id,
        amount,
        type,
        title,
        category_id,
        note,
        source,
        transaction_date,
        date
    ) VALUES
        (target_user_id, default_wallet, 15000000, 'income', 'Monthly Salary', null, 'Monthly Salary', 'manual', current_date - interval '5 days', current_date - interval '5 days'),
        (target_user_id, default_wallet, 35000, 'expense', 'Nasi Goreng', cat_food, 'Nasi Goreng', 'manual', current_date - interval '4 days', current_date - interval '4 days'),
        (target_user_id, default_wallet, 150000, 'expense', 'Isi Bensin', cat_transport, 'Isi Bensin', 'manual', current_date - interval '4 days', current_date - interval '4 days'),
        (target_user_id, default_wallet, 500000, 'expense', 'Listrik PLN', cat_bills, 'Listrik PLN', 'manual', current_date - interval '3 days', current_date - interval '3 days'),
        (target_user_id, default_wallet, 45000, 'expense', 'Kopi Susu', cat_food, 'Kopi Susu', 'manual', current_date - interval '2 days', current_date - interval '2 days'),
        (target_user_id, default_wallet, 120000, 'expense', 'Makan Malam Seafood', cat_food, 'Makan Malam Seafood', 'manual', current_date - interval '1 days', current_date - interval '1 days'),
        (target_user_id, default_wallet, 25000, 'expense', 'Gojek ke Kantor', cat_transport, 'Gojek ke Kantor', 'manual', current_date, current_date),
        (target_user_id, default_wallet, 500000, 'income', 'Cashback Promo', null, 'Cashback Promo', 'manual', current_date, current_date);

    INSERT INTO projects (user_id, name, budget_target, status)
    VALUES (target_user_id, 'Liburan ke Bali', 5000000, 'active')
    RETURNING id INTO proj_bali;

    INSERT INTO project_categories (project_id, name, budget_allocated) VALUES
        (proj_bali, 'Tiket Pesawat', 1500000),
        (proj_bali, 'Hotel', 2000000),
        (proj_bali, 'Makan & Jajan', 1000000),
        (proj_bali, 'Transportasi Lokal', 500000);

    INSERT INTO wishlist (
        user_id,
        item_name,
        url,
        price,
        target_price,
        reason,
        priority,
        cooling_days,
        start_date,
        review_date,
        status
    ) VALUES
        (target_user_id, 'PS5 Pro', 'https://tokopedia.com', 8500000, 8500000, 'Masih mahal dan belum urgent', 'high', 7, current_date, current_date + interval '7 days', 'pending_review'),
        (target_user_id, 'Mechanical Keyboard', 'https://shopee.co.id', 1200000, 1200000, 'Mau upgrade setup kerja', 'medium', 5, current_date - interval '6 days', current_date - interval '1 days', 'pending_review'),
        (target_user_id, 'Smartwatch', null, 2500000, 2500000, 'Sudah jadi pembelian rutin olahraga', 'medium', 3, current_date - interval '10 days', current_date - interval '7 days', 'purchased');

    INSERT INTO subscriptions (user_id, name, amount, billing_day, is_active) VALUES
        (target_user_id, 'Netflix Premium', 186000, 15, true),
        (target_user_id, 'Spotify Family', 86900, 2, true),
        (target_user_id, 'Gym Membership', 350000, extract(day from now() + interval '2 days')::int, true);
END $$;

-- ============================================
-- DuitFlow - Notifications sync RPC
-- Moves system notification generation from the
-- client into a single database-side function.
-- ============================================

CREATE OR REPLACE FUNCTION public.sync_system_notifications()
RETURNS JSONB AS $$
DECLARE
  current_user_id UUID := auth.uid();
  profile_timezone TEXT := 'Asia/Jakarta';
  preferred_language TEXT := 'id';
  notification_preferences JSONB := '{"wishlist_due": true, "budget_warning": true, "budget_exceeded": true}'::jsonb;
  local_now TIMESTAMP := now();
  local_today DATE;
  current_month_key TEXT;
  current_month_start DATE;
  current_month_end DATE;
  has_global_budget BOOLEAN := false;
  overall_limit INTEGER := 0;
  overall_spent INTEGER := 0;
  budget_ratio NUMERIC := 0;
  desired_count INTEGER := 0;
  deleted_count INTEGER := 0;
BEGIN
  IF current_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'synced', false,
      'reason', 'unauthenticated'
    );
  END IF;

  SELECT
    COALESCE(profiles.timezone, 'Asia/Jakarta'),
    COALESCE(profiles.preferred_language, 'id'),
    COALESCE(
      profiles.notification_preferences,
      '{"wishlist_due": true, "budget_warning": true, "budget_exceeded": true}'::jsonb
    )
  INTO profile_timezone, preferred_language, notification_preferences
  FROM public.profiles
  WHERE profiles.id = current_user_id;

  profile_timezone := COALESCE(profile_timezone, 'Asia/Jakarta');
  preferred_language := COALESCE(preferred_language, 'id');
  notification_preferences := COALESCE(
    notification_preferences,
    '{"wishlist_due": true, "budget_warning": true, "budget_exceeded": true}'::jsonb
  );

  local_now := timezone(profile_timezone, now());
  local_today := local_now::date;
  current_month_key := to_char(local_now, 'YYYY-MM');
  current_month_start := date_trunc('month', local_now)::date;
  current_month_end := (date_trunc('month', local_now) + interval '1 month - 1 day')::date;

  CREATE TEMP TABLE IF NOT EXISTS temp_desired_notifications (
    user_id UUID NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    priority TEXT NOT NULL,
    action_url TEXT,
    dedupe_key TEXT NOT NULL
  ) ON COMMIT DROP;

  TRUNCATE temp_desired_notifications;

  IF COALESCE((notification_preferences ->> 'wishlist_due')::BOOLEAN, true) THEN
    INSERT INTO temp_desired_notifications (user_id, type, title, body, priority, action_url, dedupe_key)
    SELECT
      current_user_id,
      'wishlist_due',
      CASE
        WHEN preferred_language = 'id' THEN 'Review wishlist jatuh tempo'
        ELSE 'Wishlist review due'
      END,
      CASE
        WHEN preferred_language = 'id' THEN FORMAT('"%s" sudah siap untuk ditinjau.', wishlist.item_name)
        ELSE FORMAT('"%s" is ready for review.', wishlist.item_name)
      END,
      'important',
      '/wishlist',
      FORMAT('wishlist_due:%s:%s', wishlist.id, wishlist.review_date)
    FROM public.wishlist
    WHERE wishlist.user_id = current_user_id
      AND wishlist.status IN ('pending_review', 'postponed')
      AND wishlist.review_date <= local_today;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.budgets
    WHERE budgets.user_id = current_user_id
      AND budgets.month_key = current_month_key
      AND budgets.category_id IS NULL
      AND budgets.total_limit IS NOT NULL
  )
  INTO has_global_budget;

  IF has_global_budget THEN
    SELECT COALESCE(budgets.total_limit, 0)
    INTO overall_limit
    FROM public.budgets
    WHERE budgets.user_id = current_user_id
      AND budgets.month_key = current_month_key
      AND budgets.category_id IS NULL
      AND budgets.total_limit IS NOT NULL
    ORDER BY budgets.created_at DESC
    LIMIT 1;

    SELECT COALESCE(SUM(transactions.amount), 0)
    INTO overall_spent
    FROM public.transactions
    WHERE transactions.user_id = current_user_id
      AND transactions.type = 'expense'
      AND transactions.source <> 'system_transfer'
      AND transactions.deleted_at IS NULL
      AND transactions.transaction_date BETWEEN current_month_start AND current_month_end;
  ELSE
    SELECT COALESCE(SUM(budgets.amount_limit), 0)
    INTO overall_limit
    FROM public.budgets
    WHERE budgets.user_id = current_user_id
      AND budgets.month_key = current_month_key
      AND budgets.category_id IS NOT NULL
      AND budgets.amount_limit IS NOT NULL;

    SELECT COALESCE(SUM(transactions.amount), 0)
    INTO overall_spent
    FROM public.transactions
    INNER JOIN public.budgets
      ON budgets.user_id = current_user_id
      AND budgets.month_key = current_month_key
      AND budgets.category_id = transactions.category_id
      AND budgets.category_id IS NOT NULL
      AND budgets.amount_limit IS NOT NULL
    WHERE transactions.user_id = current_user_id
      AND transactions.type = 'expense'
      AND transactions.source <> 'system_transfer'
      AND transactions.deleted_at IS NULL
      AND transactions.transaction_date BETWEEN current_month_start AND current_month_end;
  END IF;

  budget_ratio := CASE
    WHEN overall_limit > 0 THEN overall_spent::NUMERIC / overall_limit::NUMERIC
    ELSE 0
  END;

  IF overall_limit > 0 AND budget_ratio >= 1 AND COALESCE((notification_preferences ->> 'budget_exceeded')::BOOLEAN, true) THEN
    INSERT INTO temp_desired_notifications (user_id, type, title, body, priority, action_url, dedupe_key)
    VALUES (
      current_user_id,
      'budget_exceeded',
      CASE
        WHEN preferred_language = 'id' THEN 'Budget bulanan terlampaui'
        ELSE 'Monthly budget exceeded'
      END,
      CASE
        WHEN preferred_language = 'id' THEN FORMAT('Pengeluaran untuk %s sudah melewati batas yang direncanakan.', current_month_key)
        ELSE FORMAT('Spending for %s has passed the planned limit.', current_month_key)
      END,
      'critical',
      '/budgets',
      FORMAT('budget_exceeded:%s', current_month_key)
    );
  ELSIF overall_limit > 0 AND budget_ratio >= 0.8 AND COALESCE((notification_preferences ->> 'budget_warning')::BOOLEAN, true) THEN
    INSERT INTO temp_desired_notifications (user_id, type, title, body, priority, action_url, dedupe_key)
    VALUES (
      current_user_id,
      'budget_warning',
      CASE
        WHEN preferred_language = 'id' THEN 'Budget bulanan hampir penuh'
        ELSE 'Monthly budget is almost full'
      END,
      CASE
        WHEN preferred_language = 'id' THEN FORMAT('Pengeluaran untuk %s sudah mendekati batas bulanan.', current_month_key)
        ELSE FORMAT('Spending for %s is approaching the monthly limit.', current_month_key)
      END,
      'important',
      '/budgets',
      FORMAT('budget_warning:%s', current_month_key)
    );
  END IF;

  SELECT COUNT(*)
  INTO desired_count
  FROM temp_desired_notifications;

  INSERT INTO public.notifications (user_id, type, title, body, priority, action_url, dedupe_key)
  SELECT
    temp_desired_notifications.user_id,
    temp_desired_notifications.type,
    temp_desired_notifications.title,
    temp_desired_notifications.body,
    temp_desired_notifications.priority,
    temp_desired_notifications.action_url,
    temp_desired_notifications.dedupe_key
  FROM temp_desired_notifications
  ON CONFLICT (user_id, dedupe_key)
  DO UPDATE SET
    title = EXCLUDED.title,
    body = EXCLUDED.body,
    priority = EXCLUDED.priority,
    action_url = EXCLUDED.action_url;

  DELETE FROM public.notifications
  WHERE notifications.user_id = current_user_id
    AND notifications.type IN ('wishlist_due', 'budget_warning', 'budget_exceeded')
    AND notifications.dedupe_key IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM temp_desired_notifications
      WHERE temp_desired_notifications.user_id = notifications.user_id
        AND temp_desired_notifications.dedupe_key = notifications.dedupe_key
    );

  GET DIAGNOSTICS deleted_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'synced', true,
    'month_key', current_month_key,
    'desired_count', desired_count,
    'deleted_count', deleted_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.sync_system_notifications() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sync_system_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION public.sync_system_notifications() TO service_role;

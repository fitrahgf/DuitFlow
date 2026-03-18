-- ============================================
-- DuitFlow - Atomic project creation
-- Prevents half-created projects when related categories fail.
-- ============================================

CREATE OR REPLACE FUNCTION public.create_project_with_categories(
  p_name TEXT,
  p_budget_target INTEGER,
  p_category_names TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS UUID AS $$
DECLARE
  actor UUID;
  new_project_id UUID;
  normalized_names TEXT[];
BEGIN
  actor := auth.uid();

  IF actor IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  IF NULLIF(BTRIM(p_name), '') IS NULL THEN
    RAISE EXCEPTION 'Project name is required.';
  END IF;

  IF p_budget_target IS NULL OR p_budget_target <= 0 THEN
    RAISE EXCEPTION 'Project budget target must be greater than zero.';
  END IF;

  normalized_names := ARRAY(
    SELECT DISTINCT trimmed_name
    FROM (
      SELECT NULLIF(BTRIM(category_name), '') AS trimmed_name
      FROM unnest(COALESCE(p_category_names, ARRAY[]::TEXT[])) AS category_name
    ) AS normalized
    WHERE trimmed_name IS NOT NULL
  );

  INSERT INTO public.projects (user_id, name, budget_target, status)
  VALUES (actor, BTRIM(p_name), p_budget_target, 'active')
  RETURNING id INTO new_project_id;

  IF array_length(normalized_names, 1) IS NOT NULL THEN
    INSERT INTO public.project_categories (project_id, name, budget_allocated)
    SELECT new_project_id, category_name, 0
    FROM unnest(normalized_names) AS category_name;
  END IF;

  RETURN new_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

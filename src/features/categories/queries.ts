import { createClient } from "@/lib/supabase/client";

export interface CategoryRecord {
  id: string;
  name: string;
  icon: string;
  color: string;
  is_default: boolean;
}

export interface SaveCategoryInput {
  id?: string;
  name: string;
  icon: string;
  color: string;
}

export async function fetchCategoriesPageData() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("is_default", { ascending: false })
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as CategoryRecord[];
}

export async function saveCategory(input: SaveCategoryInput) {
  const supabase = createClient();
  const trimmedName = input.name.trim();

  if (input.id) {
    const { error } = await supabase
      .from("categories")
      .update({
        name: trimmedName,
        icon: input.icon,
        color: input.color,
      })
      .eq("id", input.id);

    if (error) {
      throw error;
    }

    return;
  }

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { error } = await supabase.from("categories").insert({
    user_id: user.id,
    name: trimmedName,
    icon: input.icon,
    color: input.color,
  });

  if (error) {
    throw error;
  }
}

export async function deleteCategory(categoryId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId);

  if (error) {
    throw error;
  }
}

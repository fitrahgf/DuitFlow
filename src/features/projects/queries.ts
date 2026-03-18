import { createClient } from "@/lib/supabase/client";
import { projectFormSchema, type ProjectFormValues } from "@/lib/validators/project";

export interface ProjectCategoryRecord {
  id: string;
  name: string;
  budget_allocated: number;
}

export interface ProjectRecord {
  id: string;
  name: string;
  budget_target: number;
  status: "active" | "completed" | "archived";
  project_categories: ProjectCategoryRecord[];
}

export interface CreateProjectInput {
  name: string;
  budgetTarget: number;
  categoryNames: string[];
}

export interface UpdateProjectStatusInput {
  id: string;
  status: ProjectRecord["status"];
}

export async function fetchProjects() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("projects")
    .select(
      "id, name, budget_target, status, project_categories(id, name, budget_allocated)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProjectRecord[];
}

export async function createProject(input: CreateProjectInput) {
  const supabase = createClient();
  const parsed = projectFormSchema.parse(input) as ProjectFormValues;
  const { error } = await supabase.rpc("create_project_with_categories", {
    p_name: parsed.name,
    p_budget_target: parsed.budgetTarget,
    p_category_names: parsed.categoryNames,
  });

  if (error) {
    throw error;
  }
}

export async function updateProjectStatus(input: UpdateProjectStatusInput) {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .update({ status: input.status })
    .eq("id", input.id);

  if (error) {
    throw error;
  }
}

export async function deleteProject(projectId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", projectId);

  if (error) {
    throw error;
  }
}

import { createClient } from "@/lib/supabase/client";

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
    .select("*, project_categories(*)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []) as ProjectRecord[];
}

export async function createProject(input: CreateProjectInput) {
  const supabase = createClient();
  const { data: createdProject, error: projectError } = await supabase
    .from("projects")
    .insert({
      name: input.name.trim(),
      budget_target: input.budgetTarget,
      status: "active",
    })
    .select()
    .single();

  if (projectError) {
    throw projectError;
  }

  const { error: categoryError } = await supabase
    .from("project_categories")
    .insert(
      input.categoryNames.map((name) => ({
        project_id: createdProject.id,
        name,
        budget_allocated: 0,
      })),
    );

  if (categoryError) {
    throw categoryError;
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

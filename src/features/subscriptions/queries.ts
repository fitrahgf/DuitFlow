import { createClient } from "@/lib/supabase/client";

export interface SubscriptionRecord {
  id: string;
  name: string;
  amount: number;
  billing_day: number;
  is_active: boolean;
}

export interface CreateSubscriptionInput {
  name: string;
  amount: number;
  billingDay: number;
}

export interface UpdateSubscriptionStatusInput {
  id: string;
  isActive: boolean;
}

export async function fetchSubscriptions() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("subscriptions")
    .select("*")
    .order("is_active", { ascending: false })
    .order("billing_day", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []) as SubscriptionRecord[];
}

export async function createSubscription(input: CreateSubscriptionInput) {
  const supabase = createClient();
  const { error } = await supabase.from("subscriptions").insert({
    name: input.name.trim(),
    amount: input.amount,
    billing_day: input.billingDay,
    is_active: true,
  });

  if (error) {
    throw error;
  }
}

export async function updateSubscriptionStatus(
  input: UpdateSubscriptionStatusInput,
) {
  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .update({ is_active: !input.isActive })
    .eq("id", input.id);

  if (error) {
    throw error;
  }
}

export async function deleteSubscription(subscriptionId: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("subscriptions")
    .delete()
    .eq("id", subscriptionId);

  if (error) {
    throw error;
  }
}

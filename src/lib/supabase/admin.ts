import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type LooseRow = Record<string, unknown>;

type LooseDatabase = {
  public: {
    Tables: Record<
      string,
      {
        Row: LooseRow;
        Insert: LooseRow;
        Update: LooseRow;
        Relationships: [];
      }
    >;
    Views: Record<string, never>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

let adminClient: SupabaseClient<LooseDatabase> | undefined;

export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not configured.');
  }

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured.');
  }

  if (!adminClient) {
    adminClient = createClient<LooseDatabase>(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

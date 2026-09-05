// ============================================================================
// Supabase client — the single place we connect to the backend.
//
// Reads the URL + anon key from environment variables (.env). If they're not
// set, `supabase` is null and the community features degrade gracefully (the
// rest of the tool — table, estimates, alternatives — is all local and keeps
// working). This is the "the tool must work even if the backend is down" rule,
// enforced in one place.
// ============================================================================

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

// null if not configured — callers check for this and degrade gracefully.
export const supabase: SupabaseClient | null =
  url && anonKey ? createClient(url, anonKey) : null;

export const isBackendConfigured = Boolean(supabase);

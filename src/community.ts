// ============================================================================
// Community store — REAL backend (Supabase).
//
// Same three functions the app already calls (getApprovedSubmissions,
// countApprovedForProduct, submit) — but now they talk to Supabase over the
// network, so they're ASYNC. Because we programmed to this interface from the
// start, the rest of the app only needed small "await + loading state" tweaks.
//
// TRUST BOUNDARY (now enforced by the DATABASE, not just code):
//   - anyone can INSERT a submission, but it defaults to approved=false
//   - the public can only SELECT rows where approved=true
// (See the RLS policies in the SQL we ran in Supabase.)
//
// GRACEFUL DEGRADATION: if the backend isn't configured or a call fails, the
// community functions fail SOFTLY (empty list / thrown error the UI catches).
// The rest of the tool is local and keeps working.
// ============================================================================

import { supabase } from "./supabaseClient";
import type { CommunitySubmission, SubmissionKind } from "./types";

// The DB stores snake_case columns; map a row to our camelCase type.
interface SubmissionRow {
  id: string;
  category_id: string;
  product_id: string | null;
  kind: SubmissionKind;
  text: string;
  location: string | null;
  created_at: string;
  approved: boolean;
}

function fromRow(r: SubmissionRow): CommunitySubmission {
  return {
    id: r.id,
    categoryId: r.category_id,
    productId: r.product_id ?? undefined,
    kind: r.kind,
    text: r.text,
    location: r.location ?? undefined,
    createdAt: r.created_at,
    approved: r.approved,
  };
}

/**
 * Return APPROVED submissions for a category (RLS ensures only approved rows
 * come back anyway). Returns [] if the backend is down/unconfigured.
 */
export async function getApprovedSubmissions(
  categoryId: string
): Promise<CommunitySubmission[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("submissions")
    .select("*")
    .eq("category_id", categoryId)
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return (data as SubmissionRow[]).map(fromRow);
}

/**
 * Count approved reports attached to a specific product (for the table badge).
 * Returns 0 if the backend is down/unconfigured.
 */
export async function countApprovedForProduct(productId: string): Promise<number> {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from("submissions")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId);
  if (error || count == null) return 0;
  return count;
}

/**
 * Insert a new submission. It's stored with approved=false (the DB default +
 * RLS enforce this), so it won't appear publicly until reviewed. Throws on
 * failure so the UI can show an error.
 */
export async function submit(input: {
  categoryId: string;
  productId?: string;
  kind: SubmissionKind;
  text: string;
  location?: string;
}): Promise<void> {
  if (!supabase) {
    throw new Error("Community backend is not configured.");
  }
  const { error } = await supabase.from("submissions").insert({
    category_id: input.categoryId,
    product_id: input.productId ?? null,
    kind: input.kind,
    text: input.text.trim(),
    location: input.location?.trim() || null,
    // approved is NOT set here — the DB default (false) + RLS are the gate.
  });
  if (error) throw error;
}

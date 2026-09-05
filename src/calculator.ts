// ============================================================================
// Tariff Lens — the deterministic calculator.
//
// This is the trust-critical core, and it is deliberately BORING:
//   - a PURE function: same inputs always produce the same outputs, no
//     randomness, no network, no AI, no side effects.
//   - it can be read, checked, and re-run by anyone.
//
// This is the exact opposite of asking an LLM "what will tariffs do to my
// grocery bill?" — which gives a confident, unverifiable, different-every-time
// number. The honesty of the tool lives in the fact that this function is
// auditable and its inputs are all sourced.
// ============================================================================

import type { CategoryRecord, Estimate } from "./types";

// The model, stated plainly:
//
//   monthlyIncrease = monthlySpend  ×  usImportShare  ×  tariffRate  ×  passThrough
//
//   - monthlySpend   : turns a percentage into dollars (StatsCan category spend)
//   - usImportShare  : only the US-sourced fraction is directly tariff-exposed
//   - tariffRate     : the policy fact (from the official tariff notice)
//   - passThrough    : how much of the border cost reaches the shelf (RESEARCH-
//                      backed range; retailers absorb some). This is the term
//                      we vary low/mid/high because the research spans ~20%–86%.
//
// IMPORTANT HONESTY LIMITATION (see methodologyCaveat): multiplying by
// usImportShare ignores the fact that tariffs can also raise DOMESTIC prices
// under reduced competition. So this model tends to be CONSERVATIVE (estimates
// on the low side). We disclose this rather than hide it.

/**
 * Derive the monthly dollar impact range for one category from its raw,
 * sourced inputs. Nothing here is stored — the UI shows what this returns.
 */
export function estimate(category: CategoryRecord): Estimate {
  const { inputs } = category;

  // The part of monthly spend that is actually exposed to the tariff, in $.
  const exposedSpend = inputs.monthlySpendCad * inputs.usImportShare;

  // The extra border cost on that exposed spend, in $ (before retail absorption).
  const borderCost = exposedSpend * inputs.tariffRate;

  // Apply the three pass-through assumptions to get the low/mid/high band.
  // We round to cents so we never imply more precision than we have.
  const round = (n: number) => Math.round(n * 100) / 100;

  return {
    lowCad: round(borderCost * inputs.passThroughLow),
    midCad: round(borderCost * inputs.passThroughMid),
    highCad: round(borderCost * inputs.passThroughHigh),
    confidence: category.confidence,
    assumptions: category.assumptions,
  };
}

// Pass-through assumption used for the headline estimate. Research spans widely
// (~20–80% depending on method), so for a clean, useful consumer estimate we use
// a single defensible midpoint (~50%) rather than a very wide band. The "it
// varies / only part reaches the shelf" caveat stays in the footnote.
export const PASS_THROUGH_ESTIMATE = 0.5;

// Compute the ESTIMATED PERCENTAGE price increase for a product, from the tariff
// rate, the (rough) US-sourced share, and the ~50% pass-through estimate. This is
// what the table shows (we don't show a dollar figure). Because import share
// varies by category, the % varies too — it's not just the tariff rate.
//
//   %increase ≈ tariffRate × usImportShare × 50% pass-through
//
// Rounded to whole percents — no fake precision. Import share is a ROUGH
// assumption, disclosed as such.
export function percentRange(tariffRate: number, usImportShare: number): string {
  const est = tariffRate * usImportShare * PASS_THROUGH_ESTIMATE;
  const pct = Math.max(0, Math.round(est * 100));
  return `~${pct}%`;
}

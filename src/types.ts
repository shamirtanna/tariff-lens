// ============================================================================
// Tariff Lens — the shape of an honest tariff record.
//
// The core idea (option A): we store the RAW INPUTS behind every estimate, not
// a final dollar figure. The calculator DERIVES the dollar range from these
// inputs. That means:
//   - every number on screen can be traced to a visible input + a source
//   - changing an assumption re-derives the estimate automatically
//   - the "How did we get this?" panel is just showing these fields
//
// The systems point: the SHAPE of this data IS the integrity of the product.
// If a field can't hold a source, the tool can't be honest about that number.
// TypeScript then FORCES every category to fill all of this in — forget a
// source and the compiler complains. That's the honesty layer, enforced.
// ============================================================================

// A single citation. Every number a user sees must trace back to one of these.
// If you can't cite it, the field it supports shouldn't exist.
export interface Source {
  label: string;      // e.g. "Canada Dept. of Finance — tariff notice"
  url: string;        // link a stranger can click to check us
  note?: string;      // optional: what exactly this source backs up
}

// How sure are we about this category's estimate? Deliberately coarse and
// honest — not a fake percentage.
export type Confidence = "low" | "medium" | "high";

// The raw, auditable inputs the calculator uses to derive a dollar range.
// NOTE: we model ranges by carrying low/mid/high assumptions, not a single
// point — because pretending to a single precise number is the exact failure
// we're avoiding.
export interface EstimateInputs {
  // The tariff rate applied to this category, e.g. 0.25 for 25%.
  tariffRate: number;

  // Fraction of this category that is actually US-sourced (and thus exposed to
  // the tariff), 0..1. This is the factor that stops us over-scaring people:
  // a 25% tariff on a category that's only 20% US-sourced is not a 25% hit.
  usImportShare: number;

  // How much of the tariff actually reaches the shelf price, as a range.
  // Retailers absorb some; competition eats some. 0..1 each.
  passThroughLow: number;
  passThroughMid: number;
  passThroughHigh: number;

  // Average monthly household spend on this category, in CAD. Turns a
  // percentage into dollars. Sourced from spending data (e.g. StatsCan).
  monthlySpendCad: number;
}

// The plain-language "why", i.e. the Connection layer: the tariff is only ONE
// input into your final price. This is content, curated by a human.
export interface ConnectionChain {
  // Ordered steps from the policy to your bill, in plain language.
  // e.g. ["A tariff raises what importers pay for US goods",
  //       "Importers pass some of that to retailers",
  //       "Retailers decide how much to put on the shelf price",
  //       "You see it 6-8 weeks later"]
  steps: string[];

  // The honest caveat: what else moves this price that has nothing to do with
  // the tariff (fuel, season, exchange rate, competition).
  otherFactors: string[];

  // The lead-time note — the core insight. e.g. "Expect this ~6-8 weeks out."
  timingNote: string;
}

// The Agency layer: what you can actually do. Made-in-Canada options.
//
// HONESTY NOTE 1 (origin, not ownership): what dodges the tariff is COUNTRY OF
// ORIGIN — where the product is MADE — not who owns the brand. So we steer on
// "Made in Canada", and each named option should be verifiable as such.
// Nuance: "Made in Canada" can include imported content; "Product of Canada" is
// essentially all-Canadian. A strong signal for tariff-safe, not a guarantee.
//
// HONESTY NOTE 2 (not cheaper): options are NOT presented as "cheaper." The
// tariff is often a small slice of the shelf price, so dodging it doesn't make a
// product cheap — a Canadian option may cost MORE. The honest reasons to switch:
// less exposure to tariff-affected supply, and non-price reasons — never a false
// savings promise.
// How sure are we that this alternative is genuinely made in Canada? This is a
// TRUST TIER shown to the user — the verification learning made visible.
// The user-facing labels are:
//   - "verified":  "Verified" — confirmed against the manufacturer's own site
//   - "reported":  "Reported" — supported by secondary sources; check the label
//   - "community": "User submission" — shared by a person (describe it as what it
//                  IS, not as "unverified" — that framing casts doubt unnecessarily)
// Showing the tier IS the product: it lets people weight each claim honestly
// instead of trusting everything equally.
export type OriginConfidence = "verified" | "reported" | "community";

export interface Alternative {
  name: string;          // the specific made-in-Canada option
  madeIn?: string;       // where it's made, e.g. "Québec", "Ontario" (shown small)
  website?: string;      // the product/company site (the name links here)
  description: string;
  whereToFind: string;
  honestNote: string;    // e.g. "Look for 'Made in Canada' on the label. Often pricier."
  originConfidence: OriginConfidence; // the trust tier, shown to the user
  source?: Source;       // citation (required in practice for verified/reported)
}

// ----------------------------------------------------------------------------
// A SPECIFIC hit product (e.g. "paper towels"), mapped to the government list.
//
// Why this exists: the official tariff list is organized by HS CODE, not by
// consumer category. So a category like "paper products" is actually several
// specific items, each with its own code + rate. Modelling the specific item
// (a) matches the grain of the source data, (b) gives an EXACT rate instead of
// an average, and (c) makes made-in-Canada alternatives make sense (you can't
// offer an alternative to an abstract category, but you can to "paper towels").
//
// HONESTY: the plain-language `whatItIs` is our TRANSLATION of the legal HS-code
// description — that translation is the core value, so we keep the raw `hsCode`
// and `officialDescription` too, so anyone can check our translation.
// ----------------------------------------------------------------------------
export interface HitProduct {
  id: string;                  // stable slug, e.g. "paper-towels" — lets community input attach to THIS row
  whatItIs: string;            // plain language, e.g. "Paper towels"
  hsCode: string;              // the exact code, e.g. "4818.20.00"
  officialDescription: string; // the raw legal text we translated FROM
  tariffRate: number;          // exact rate for THIS code, e.g. 0.25
  // Illustrative % impact for this item — a percentage, NOT a dollar price
  // (we don't invent a quantity/price). e.g. "roughly 2-4% more if US-made".
  illustrativePercentNote: string;
  // (d) Which items TEND to be US-sourced. Framed softly on purpose: this varies
  // by SKU/store/month, so it's "likely US-sourced," NOT "this IS American."
  // This is one of the uncertain parts the community helps validate.
  usSourcedNote?: string;

  exampleUsProduct?: string;         // e.g. "Bounty (verify country of origin)"

  // The made-in-Canada option for THIS specific product (per-product, not
  // per-category — different products need different alternatives). Undefined =
  // "awaiting input" in the table.
  alternative?: Alternative;
}

// ============================================================================
// The full record for ONE consumer category. This is the unit we curate.
// Every category we ship must satisfy this whole shape — TypeScript guarantees
// nothing is half-filled.
// ============================================================================
export interface CategoryRecord {
  id: string;                 // stable slug, e.g. "paper-products"
  name: string;               // display name, e.g. "Paper products"
  affectedProducts: string;   // plain-English: what's actually hit

  // The specific items in this category that are actually on the tariff list,
  // each with its exact HS code + rate. This is the "specific product" level.
  hitProducts: HitProduct[];

  inputs: EstimateInputs;     // the raw numbers the calculator derives from (category-level)
  assumptions: string[];      // stated openly, in plain language
  confidence: Confidence;
  sources: Source[];          // must be non-empty in practice (see note below)

  connection: ConnectionChain; // the "why / what else drives it" layer
  alternatives: Alternative[]; // the "what you can do" layer

  // Two required honesty notes, made structural so we can't forget them:

  // The wallet-reality note: switching to a Canadian alternative avoids the
  // tariff exposure but is NOT necessarily cheaper (the tariff is often a small
  // slice of the price; alternatives may cost more). State this plainly.
  walletRealityNote: string;

  // The methodology caveat for THIS estimate: e.g. that it's a simplified model
  // and likely conservative because it doesn't capture domestic-price spillover.
  methodologyCaveat: string;
}

// The output the calculator produces from a CategoryRecord's inputs.
// This is DERIVED, never stored — it's what the UI displays.
export interface Estimate {
  lowCad: number;
  midCad: number;
  highCad: number;
  confidence: Confidence;
  assumptions: string[];
}

// ----------------------------------------------------------------------------
// Community input — the VALIDATION LOOP for the uncertain parts (c/d/e).
//
// Not a generic comment box. Each submission targets a specific uncertain part:
//   - "origin"   : "I saw this marked Made in USA / Made in Canada" (validates d)
//   - "price"    : "I noticed a price change" (validates c)
//   - "alternative": "I know a made-in-Canada option you missed" (validates e)
//
// TRUST BOUNDARY: anything a stranger submits is UNTRUSTED. Every submission
// carries `approved: false` until a human reviews it. The public view shows only
// approved rows. "Stored" and "shown" are deliberately different things.
// ----------------------------------------------------------------------------
export type SubmissionKind = "origin" | "price" | "alternative";

export interface CommunitySubmission {
  id: string;
  categoryId: string;      // which category this is about
  productId?: string;      // OPTIONAL: which specific product row this attaches to
                           // (v1: the person picks it on submit; v2: a human routes it)
  kind: SubmissionKind;    // which uncertain part it validates
  text: string;            // the person's observation (untrusted free text)
  location?: string;       // optional province/city
  createdAt: string;       // ISO timestamp
  approved: boolean;       // gate: false until a human reviews it
}

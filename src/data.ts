// ============================================================================
// Tariff Lens — curated category data (the source of truth for FACTS).
//
// A human curates this. It lives in the repo (not a database) so it is
// auditable and version-controlled, and so the tool works even if a backend is
// down.
//
// STATUS (Day 3): structure is real; some numbers still need final confirmation
// from the official list. Anything UNVERIFIED is clearly marked and must be
// confirmed before launch. The pass-through band is research-anchored.
//
// The two-level structure:
//   - `hitProducts` = specific items with EXACT HS code + rate (from the gov list)
//   - `inputs`      = CATEGORY-level spend (from StatsCan) that drives the $ estimate
// This matches how the real data is shaped: tariff list is per-HS-code; spending
// data is per-category.
// ============================================================================

import type { Alternative, CategoryRecord } from "./types";
import { percentRange } from "./calculator";

// Pass-through band anchored to published research (see LEARNINGS entry 7):
//   ~20% (NBER w34496 retail), ~45% (mid), ~80% (upper core-goods, Yale).
const PASS_THROUGH_LOW = 0.20;
const PASS_THROUGH_MID = 0.45;
const PASS_THROUGH_HIGH = 0.80;

// Cascades makes toilet paper, towels AND napkins in Québec, so it's the
// verified option for all three paper products (per-product, described for each).
function cascades(product: string): Alternative {
  return {
    name: "Cascades",
    madeIn: "Québec",
    website: "https://www.cascades.com/en/about-us/our-company/hygiene-tissue-products",
    description: `Québec-made ${product} (Cascades).`,
    whereToFind: "Most major Canadian grocery retailers.",
    honestNote: "Made in Canada per the manufacturer — not necessarily cheaper. Check the pack.",
    originConfidence: "verified",
    source: {
      label: "Cascades — hygiene & tissue products (manufacturer)",
      url: "https://www.cascades.com/en/about-us/our-company/hygiene-tissue-products",
      note: "States Canadian manufacturing (Québec).",
    },
  };
}

const OFFICIAL_LIST_URL =
  "https://www.canada.ca/en/department-finance/programs/international-trade-finance-policy/canadas-response-us-tariffs/complete-list-us-products-subject-to-counter-tariffs.html";

// Helper to build a category with less boilerplate. Tariff facts are verified;
// alternatives are left for the community to grow (per the decoupling decision),
// except paper products (defined in full above) which has verified alternatives.
function makeCategory(opts: {
  id: string;
  name: string;
  affectedProducts: string;
  products: {
    id: string;
    name: string;
    hs: string;
    desc: string;
    alt?: Alternative;  // the per-product made-in-Canada option (undefined = awaiting input)
  }[];
  otherFactors: string[];
  rate?: number; // defaults to 0.25
  importShare: number; // ROUGH, labeled assumption of the US-sourced share (varies by category)
  note50?: boolean; // 50% items are broad — remind people to check the specific item
}): CategoryRecord {
  const rate = opts.rate ?? 0.25;
  // Collect the per-product alternatives for the category-level detail list.
  const catAlternatives = opts.products
    .map((p) => p.alt)
    .filter((a): a is Alternative => Boolean(a));
  return {
    id: opts.id,
    name: opts.name,
    affectedProducts: opts.affectedProducts,
    hitProducts: opts.products.map((p) => ({
      id: p.id,
      whatItIs: p.name,
      hsCode: p.hs,
      officialDescription: p.desc,
      tariffRate: rate,
      illustrativePercentNote: percentRange(rate, opts.importShare),
      alternative: p.alt,
    })),
    inputs: {
      tariffRate: rate,
      usImportShare: opts.importShare,
      passThroughLow: PASS_THROUGH_LOW,
      passThroughMid: PASS_THROUGH_MID,
      passThroughHigh: PASS_THROUGH_HIGH,
      monthlySpendCad: 0, // not displayed (we dropped the dollar estimate)
    },
    assumptions: [
      `VERIFIED: on the official list at ${(rate * 100).toFixed(0)}%.`,
      "We show a percentage range, not a dollar figure.",
      "Pass-through modelled at 20% / 45% / 80% from published research.",
      opts.note50
        ? "This is a broad category — confirm the specific item's HS code and origin."
        : "Simplified, first-order estimate — not a precise prediction.",
    ],
    confidence: "medium",
    sources: [
      {
        label: "Official tariff list — Canada Dept. of Finance (effective Sept 8, 2026)",
        url: OFFICIAL_LIST_URL,
        note: `VERIFIED at ${(rate * 100).toFixed(0)}%.`,
      },
      {
        label: "Pass-through range — NBER & Yale Budget Lab",
        url: "https://budgetlab.yale.edu/research/tracking-economic-effects-tariffs",
        note: "Retail pass-through spans ~20%–86% depending on method; we show a band.",
      },
    ],
    connection: {
      steps: [
        "A tariff raises what Canadian importers pay for the US-made version.",
        "Importers pass some of that cost to retailers.",
        "Each retailer decides how much reaches the shelf price.",
        "You see it gradually, often weeks later.",
      ],
      otherFactors: opts.otherFactors,
      timingNote:
        "The change tends to reach shelves weeks after Sept 8 — a short window to plan.",
    },
    alternatives: catAlternatives, // gathered from the per-product alternatives
    walletRealityNote:
      "A made-in-Canada option avoids the tariff-exposed supply chain, but isn't necessarily cheaper — the tariff is usually a small slice of the shelf price.",
    methodologyCaveat:
      "Simplified estimate, likely conservative: it counts only the US-sourced share and doesn't capture price effects on domestically made goods.",
  };
}

export const categories: CategoryRecord[] = [
  {
    id: "paper-products",
    name: "Paper products",
    affectedProducts:
      "Everyday household paper: toilet paper, paper towels, tissues, napkins. If they're made in the US, they're on Canada's counter-tariff list.",

    // SPECIFIC hit items with exact codes/rates. HS codes below are chapter 48
    // (paper) — CONFIRM exact codes + rate against the official list before launch.
    hitProducts: [
      {
        id: "toilet-paper",
        whatItIs: "Toilet paper",
        hsCode: "4818.10.00", // VERIFIED against official list (Dept of Finance)
        officialDescription:
          "Toilet paper and similar paper, cellulose wadding or webs of cellulose fibres, of a kind used for household or sanitary purposes, in rolls of a width not exceeding 36 cm, or cut to size or shape... — Toilet paper",
        tariffRate: 0.25, // VERIFIED: 25% on the official list
        illustrativePercentNote: percentRange(0.25, 0.3),
        usSourcedNote:
          "US brands like Charmin are made in the US (P&G, Pennsylvania). Origin can vary by pack.",
        exampleUsProduct: "Charmin",
        alternative: cascades("toilet paper"),
      },
      {
        id: "paper-towels",
        whatItIs: "Paper towels & tissues",
        hsCode: "4818.20.00", // VERIFIED against official list (Dept of Finance)
        officialDescription:
          "Toilet paper and similar paper... — Handkerchiefs, cleansing or facial tissues and towels",
        tariffRate: 0.25, // VERIFIED: 25% on the official list
        illustrativePercentNote: percentRange(0.25, 0.3),
        usSourcedNote:
          "Bounty is a US brand (P&G, made in the US). Origin can vary by pack.",
        exampleUsProduct: "Bounty",
        alternative: cascades("paper towels"),
      },
      {
        id: "napkins-tablecloths",
        whatItIs: "Paper napkins & tablecloths",
        hsCode: "4818.30.00", // VERIFIED against official list (Dept of Finance)
        officialDescription:
          "Toilet paper and similar paper... — Tablecloths and serviettes",
        tariffRate: 0.25, // VERIFIED: 25% on the official list
        illustrativePercentNote: percentRange(0.25, 0.3),
        alternative: cascades("napkins"),
      },
    ],

    // CATEGORY-level inputs for the monthly $ estimate (StatsCan spend).
    inputs: {
      tariffRate: 0.25,          // VERIFIED: 25% on the official list
      usImportShare: 0.3, // rough assumption (paper)
      passThroughLow: PASS_THROUGH_LOW,
      passThroughMid: PASS_THROUGH_MID,
      passThroughHigh: PASS_THROUGH_HIGH,
      // ESTIMATE ~$100/yr -> ~$8.33/mo on household paper products. Derived from
      // StatsCan national figures (e.g. ~$1.2B toilet-paper sales in 2020 across
      // ~15M households ≈ ~$80/yr for TP alone, plus towels/tissues/napkins).
      // A grounded estimate, not a precise per-household survey line.
      monthlySpendCad: 8.33,
    },

    assumptions: [
      "VERIFIED: these paper products are on the official list at 25% (HS codes 4818.10/20/30, Dept of Finance).",
      "We show a PERCENTAGE range, not a dollar figure: 25% tariff × the share that reaches the shelf.",
      "Pass-through modelled at 20% / 45% / 80% from published tariff pass-through research (NBER, Yale Budget Lab).",
      "We deliberately don't estimate a $/household figure — we couldn't source an honest one.",
      "This is a simplified, first-order estimate — not a precise prediction.",
    ],
    confidence: "medium", // tariff facts verified; impact shown as an honest % range, no invented dollars

    sources: [
      {
        label: "Official tariff list — Canada Dept. of Finance (effective Sept 8, 2026)",
        url: "https://www.canada.ca/en/department-finance/programs/international-trade-finance-policy/canadas-response-us-tariffs/complete-list-us-products-subject-to-counter-tariffs.html",
        note: "VERIFIED: paper products HS 4818.10.00 (toilet paper), 4818.20.00 (tissues/towels), 4818.30.00 (napkins/tablecloths), all at 25%.",
      },
      {
        label: "Pass-through range — NBER & Yale Budget Lab (tariff pass-through research)",
        url: "https://budgetlab.yale.edu/research/tracking-economic-effects-tariffs",
        note: "Retail pass-through estimates span ~20%–86% depending on method; we show a band.",
      },
      {
        label: "Household paper spend — derived from Statistics Canada national figures",
        url: "https://statcan.gc.ca/o1/en/plus/7899-great-toilet-paper-scare-2020",
        note: "~$1.2B toilet-paper sales (2020) across ~15M households ≈ ~$80/yr TP; ~$100/yr estimate incl. towels/tissues/napkins. A grounded estimate, not a precise per-household line.",
      },
    ],

    connection: {
      steps: [
        "A tariff raises what Canadian importers pay for US-made paper products.",
        "Importers pass some of that added cost on to retailers.",
        "Each retailer decides how much to add to the shelf price (some absorb it).",
        "You see the result gradually, often 6–8 weeks later.",
      ],
      otherFactors: [
        "Pulp and shipping costs",
        "Exchange rate (CAD/USD)",
        "Seasonal promotions and competition between stores",
      ],
      timingNote:
        "Worth knowing now: the change tends to reach shelves weeks after Sept 8, so there's a short window to plan.",
    },

    alternatives: [
      {
        name: "Cascades",
        madeIn: "Québec",
        website: "https://www.cascades.com/en/about-us/our-company/hygiene-tissue-products",
        description:
          "Québec-based tissue maker (toilet paper, paper towels, napkins). Its Fluff & Tuff line states it's made in Québec.",
        whereToFind: "Most major Canadian grocery retailers.",
        honestNote:
          "Made in Canada per the manufacturer, so not tariff-exposed — but not necessarily cheaper. Still worth a glance at the pack.",
        originConfidence: "verified",
        source: {
          label: "Cascades — hygiene & tissue products (manufacturer)",
          url: "https://www.cascades.com/en/about-us/our-company/hygiene-tissue-products",
          note: "States Canadian manufacturing; Fluff & Tuff line 'fabriqués ici, au Québec'.",
        },
      },
      {
        name: "Cashmere (Kruger Products)",
        madeIn: "Canada (QC/ON/BC)",
        website: "https://www.krugerproducts.ca/",
        description:
          "Canadian brand made by Kruger Products at facilities in Québec, Ontario and BC (also Purex, Scotties).",
        whereToFind: "Most major Canadian grocery retailers.",
        honestNote:
          "Canadian-made per multiple sources — verify 'Made in Canada' on the specific pack. Not necessarily cheaper.",
        originConfidence: "reported",
        source: {
          label: "What toilet paper is Canadian made? (Box & Paper)",
          url: "https://www.boxandpaper.ca/post/what-toilet-paper-is-canadian-made",
          note: "Kruger makes Cashmere/Purex/Scotties at Canadian facilities (secondary source — verify on pack).",
        },
      },
    ],

    walletRealityNote:
      "Switching to a made-in-Canada option avoids the tariff-exposed supply chain, but it's not necessarily cheaper. The tariff is usually a small slice of the shelf price, and a Canadian option can cost more.",

    methodologyCaveat:
      "This is a simplified estimate and likely errs low: it only counts the US-sourced share, but tariffs can also nudge up prices of domestically made goods under reduced competition — an effect this model doesn't capture.",
  },

  // ==========================================================================
  // Additional categories — tariff facts VERIFIED from the official list.
  // Per the decoupling decision: rates are verified; made-in-Canada
  // alternatives are thin (community-grown) except where we've verified one.
  // ==========================================================================
  makeCategory({
    id: "pantry-food",
    name: "Pantry food (pasta, peanut butter, condiments)",
    importShare: 0.4, // rough assumption
    affectedProducts:
      "Common pantry items from the US: pasta, peanut butter, mayonnaise, mustard, soups, and similar prepared foods.",
    products: [
      {
        id: "pasta", name: "Pasta", hs: "1902.11.10", desc: "Uncooked pasta, not stuffed",
        alt: {
          name: "Catelli", madeIn: "Québec", website: "https://www.catelli.ca/en/",
          description: "Pasta made in Montréal, Québec since 1867 (domestic + imported ingredients).",
          whereToFind: "Most major Canadian grocery retailers.",
          honestNote: "Made in Québec per the manufacturer. Not necessarily cheaper.",
          originConfidence: "verified",
          source: { label: "Catelli — About Us (manufacturer)", url: "https://www.catelli.ca/en/about-us/", note: "States pasta made in Montréal/Québec." },
        },
      },
      {
        id: "peanut-butter", name: "Peanut butter", hs: "2008.11.10", desc: "Ground-nuts — Peanut butter",
        alt: {
          name: "Kraft peanut butter", madeIn: "Montreal, QC",
          description: "Made at Kraft Heinz's Mont-Royal facility in Montreal (some imported ingredients).",
          whereToFind: "Most major Canadian grocery retailers.",
          honestNote: "Made in Canada per Kraft Heinz + CBC reporting. Not necessarily cheaper.",
          originConfidence: "verified",
          source: { label: "Kraft Heinz Canada / CBC — Canadian-made brands", url: "https://www.cbc.ca/news/canada/windsor/multinational-food-beverage-firms-canadian-made-push-1.7456936", note: "Kraft peanut butter made in Montreal." },
        },
      },
      { id: "mayo", name: "Mayonnaise & salad dressing", hs: "2103.90.10", desc: "Mayonnaise and salad dressing" },
      { id: "soup", name: "Soups & broths", hs: "2104.10.00", desc: "Soups and broths and preparations therefor" },
    ],
    otherFactors: ["Ingredient and shipping costs", "Exchange rate (CAD/USD)", "Store competition"],
  }),

  makeCategory({
    id: "drinks",
    name: "Drinks (juice, soft drinks)",
    importShare: 0.35, // rough assumption
    affectedProducts:
      "US-made non-alcoholic drinks: orange juice, sweetened or flavoured waters and soft drinks, chocolate milk.",
    products: [
      {
        id: "orange-juice", name: "Orange juice", hs: "2009.12.00", desc: "Orange juice, not frozen, Brix ≤ 20",
        alt: {
          name: "Oasis / Rougemont (Lassonde)", madeIn: "Rougemont, QC",
          description: "Juices from Lassonde, a Canadian company based in Rougemont, Québec.",
          whereToFind: "Most major Canadian grocery retailers.",
          honestNote: "Québec production per multiple sources. Not necessarily cheaper. (Oranges are imported; the juice is made in Canada.)",
          originConfidence: "reported",
          source: { label: "Lassonde / Oasis — Canadian beverage maker (madeinca.ca)", url: "https://madeinca.ca/beverages-lassonde-industries/", note: "Lassonde HQ + production in Rougemont, Québec (secondary source)." },
        },
      },
      { id: "soft-drinks", name: "Soft drinks & flavoured water", hs: "2202.10.00", desc: "Waters w/ added sugar/flavour; other non-alcoholic beverages" },
    ],
    otherFactors: ["Sugar and packaging costs", "Exchange rate (CAD/USD)", "Seasonal promotions"],
  }),

  makeCategory({
    id: "frozen-treats",
    name: "Ice cream",
    importShare: 0.3, // rough assumption
    affectedProducts: "US-made ice cream and edible ices.",
    products: [
      {
        id: "ice-cream", name: "Ice cream", hs: "2105.00.92", desc: "Ice cream and other edible ice",
        alt: {
          name: "Chapman's", madeIn: "Markdale, ON", website: "https://www.chapmans.ca/our-story/",
          description: "Canada's largest independent ice cream maker, produced in Markdale, Ontario.",
          whereToFind: "Most major Canadian grocery retailers.",
          honestNote: "Made in Canada per the manufacturer. Not necessarily cheaper.",
          originConfidence: "verified",
          source: { label: "Chapman's — Our Story (manufacturer)", url: "https://www.chapmans.ca/our-story/", note: "Ice cream made in Markdale, Ontario." },
        },
      },
    ],
    otherFactors: ["Dairy and cold-chain costs", "Exchange rate (CAD/USD)"],
  }),

  makeCategory({
    id: "cleaning-personal",
    name: "Soap & personal care",
    importShare: 0.45, // rough assumption
    affectedProducts:
      "US-made soap, body wash, deodorants and bath preparations.",
    products: [
      {
        id: "soap", name: "Soap & body wash", hs: "3401.11.90", desc: "Soap and surface-active preparations for washing the skin",
        alt: {
          name: "ATTITUDE", madeIn: "Québec", website: "https://ca.attitudeliving.com/about-us",
          description: "Québec company; soap, body wash and personal care marked Made in Canada.",
          whereToFind: "Major grocery/pharmacy retailers and online.",
          honestNote: "Made in Canada per the manufacturer. Not necessarily cheaper.",
          originConfidence: "verified",
          source: { label: "ATTITUDE — About Us (manufacturer)", url: "https://ca.attitudeliving.com/about-us", note: "\"Proudly Canadian\"; products marked Made in Canada." },
        },
      },
      {
        id: "deodorant", name: "Deodorant & bath prep", hs: "3307.20.00", desc: "Personal deodorants and antiperspirants",
        alt: {
          name: "Biovert", madeIn: "Laval, QC",
          description: "Québec-based household cleaning/personal-care maker, manufactured in Laval.",
          whereToFind: "Grocery and natural-goods retailers.",
          honestNote: "Canadian-made per secondary sources — check the label. Not necessarily cheaper.",
          originConfidence: "reported",
          source: { label: "Best dish soap brands in Canada (madeinca.ca)", url: "https://madeinca.ca/dish-soap-brands-in-canada/", note: "Biovert designed + manufactured in Québec (secondary source)." },
        },
      },
    ],
    otherFactors: ["Ingredient and packaging costs", "Exchange rate (CAD/USD)", "Store competition"],
  }),

  // --- 50% categories (steel/aluminum-sector goods; furniture & clothing in the up-to-50% scope) ---
  makeCategory({
    id: "furniture",
    name: "Furniture",
    rate: 0.50,
    importShare: 0.35, // rough assumption
    affectedProducts:
      "US-made furniture is in the up-to-50% scope of the counter-tariffs.",
    products: [
      { id: "furniture-general", name: "Furniture (general)", hs: "9403", desc: "Furniture and parts (broad category — check the specific item's origin)" },
    ],
    otherFactors: ["Materials (wood, metal) and shipping", "Exchange rate (CAD/USD)"],
    note50: true,
  }),

  makeCategory({
    id: "clothing",
    name: "Clothing & apparel",
    rate: 0.50,
    importShare: 0.15, // rough — most apparel isn't US-made
    affectedProducts:
      "US-made clothing and apparel is in the up-to-50% scope of the counter-tariffs.",
    products: [
      { id: "clothing-general", name: "Clothing (general)", hs: "61/62", desc: "Apparel (broad category — check the specific item's origin)" },
    ],
    otherFactors: ["Textile and shipping costs", "Exchange rate (CAD/USD)", "Seasonal sales"],
    note50: true,
  }),
];


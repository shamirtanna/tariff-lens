# Tariff Lens

**What Canada's September 8, 2026 counter-tariffs mean for consumers — find your products, what's affected, and made-in-Canada options.**

Tariff Lens turns the government's tariff list (written in HS codes and legal language for customs brokers) into a plain-language shopping guide: search a product, see if it's affected and by how much, and find made-in-Canada options. It's a proof of concept for a bigger idea — making complex systems legible to the people they affect.

[Live site →](#) <!-- add your deployed URL here -->

---

## Why this exists

Government and institutional documents publish the truth, but in a form almost no one can use. The tariff list is real and public — but it's thousands of HS-code line items, not "will my paper towels cost more." This tool does the translation, and it's deliberately honest about the limits of what it can know.

It's also a small experiment in a question I keep coming back to: as AI gets more capable, what does it actually make possible for a regular person, and where does human judgment still carry the weight?

## What it does

- **Find a product** — a searchable, sortable table of consumer products on the tariff list, with the verified tariff rate for each.
- **Estimated price impact** — a rough, clearly-labeled percentage estimate (not a fake-precise dollar figure), with the formula shown inline.
- **Made-in-Canada options** — verified alternatives with a source link and a confidence tier (verified / reported / user submission).
- **Community input** — people can report prices they're seeing and Canadian options they know. This fills gaps that don't exist in any database. Submissions are reviewed before they appear.
- **How this works** — a transparency page: the method, honest limitations, and what's deliberately not included.

## The honesty layer (the actual point)

This tool is built to *hand responsibility back to the human*, not to be a confident black box:

- **Every claim has a source.** Tariff rates trace to the official Department of Finance list; alternatives to manufacturer or secondary sources.
- **No fake precision.** We show a percentage range, not a dollar figure, because we couldn't source an honest per-household number — so we don't pretend to.
- **Confidence is visible.** Each Canadian option is tagged verified / reported / user submission, so you can weight it yourself.
- **Gaps are shown, not hidden.** Products without a verified alternative say "awaiting input" rather than filler.
- **The estimate is labeled a rough model,** not a proven formula.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React + TypeScript |
| Build / dev server | Vite |
| Backend (community submissions) | Supabase (Postgres + Row-Level Security) |
| Hosting | Vercel (auto-deploy from GitHub) |
| Tariff + alternatives data | Hand-curated, in-repo (see `src/data.ts`) |

The tariff facts and estimates are **static, in-repo data** — auditable and version-controlled. The only live backend is one Supabase table for community submissions, wired so the whole tool still works if the backend is down (graceful degradation).

## How the code is organized

```
src/
  types.ts          the shape of the data (what every product/category/submission must have)
  data.ts           the curated facts (tariff rates, products, alternatives, sources)
  calculator.ts     the deterministic % estimate (pure function — no AI in the number path)
  community.ts      the community store (Supabase read/insert; the only networked part)
  supabaseClient.ts the backend connection (null-safe for graceful degradation)
  ProductTable.tsx  the searchable "find a product" table
  App.tsx           screens + navigation + category detail + community form
  ReportPage.tsx    the "share your input" page
  HowThisWorks.tsx  the transparency / methodology page
```

Core principle: **the UI holds no facts of its own** — it only renders what `data.ts` and `calculator.ts` produce. A wrong number is a one-field edit in `data.ts`, and anyone can audit the tool by reading the data and the calculator.

## Running locally

```bash
npm install
# create a .env with your Supabase values (see .env.example)
npm run dev
```

Community submissions need a Supabase project with a `submissions` table and Row-Level Security allowing anonymous insert + read-of-approved-only. Without it, the tool still runs — community features just degrade gracefully.

## Honest limitations

This is a first version. It can't tell you the exact price of a specific item, can't confirm a specific pack is US-made (origin varies by SKU), and its impact estimates are a simplified model. It's a starting point for your own decisions, not financial advice. Corrections welcome — that's the tool working.

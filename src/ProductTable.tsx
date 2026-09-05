// ============================================================================
// Product table — the FINDABILITY view.
//
// Solves the OTHER government-site problem: thousands of entries across many
// pages, no way to find MY thing. This flattens all products into one
// searchable, column-sortable table.
//
// HONESTY: the impact column is a PERCENTAGE, not a dollar price. Numbered
// footnotes below the table carry the caveats (verify on pack, the formula/
// assumptions, timing).
// ============================================================================

import { useEffect, useMemo, useState } from "react";
import { categories } from "./data";
import { countApprovedForProduct } from "./community";
import type { Alternative } from "./types";

interface Row {
  productId: string;
  product: string;
  categoryId: string;
  category: string;
  tariffRate: number;
  usImportShare: number;
  impactNote: string;
  alternative?: Alternative; // the per-product Canadian option, if any
}

// Build the static rows from local data (no network). Community counts are
// loaded separately (async) and merged in at render time.
function buildRows(): Row[] {
  const rows: Row[] = [];
  for (const cat of categories) {
    for (const p of cat.hitProducts) {
      rows.push({
        productId: p.id,
        product: p.whatItIs,
        categoryId: cat.id,
        category: cat.name,
        tariffRate: p.tariffRate,
        usImportShare: cat.inputs.usImportShare,
        impactNote: p.illustrativePercentNote,
        alternative: p.alternative,
      });
    }
  }
  return rows;
}

// The label for the source-type link on line 2 of the Made-in-Canada cell.
function sourceTypeLabel(alt: Alternative): string {
  if (alt.originConfidence === "verified") return "Company website";
  if (alt.originConfidence === "reported") return "Secondary source";
  return "User submission";
}

type SortKey = "product" | "category" | "tariffRate" | "reports";
type SortDir = "asc" | "desc";

function ProductTable({
  onOpenCategory,
  onReportSighting,
}: {
  onOpenCategory: (id: string) => void;
  onReportSighting: () => void;
}) {
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("product");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  // Community report counts per product, loaded async from the backend.
  const [reportCounts, setReportCounts] = useState<Record<string, number>>({});

  // Load approved-report counts once, after mount. If the backend is down these
  // stay 0 and the table just shows no badges — graceful degradation.
  useEffect(() => {
    let cancelled = false;
    async function loadCounts() {
      const entries = await Promise.all(
        categories.flatMap((c) =>
          c.hitProducts.map(async (p) => {
            const n = await countApprovedForProduct(p.id);
            return [p.id, n] as const;
          })
        )
      );
      if (!cancelled) setReportCounts(Object.fromEntries(entries));
    }
    loadCounts();
    return () => {
      cancelled = true;
    };
  }, []);

  // Click a column header to sort by it; click again to flip direction.
  function toggleSort(key: SortKey) {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  // The little arrow shown on the active sort column.
  function arrow(key: SortKey) {
    if (key !== sortKey) return " ↕";
    return sortDir === "asc" ? " ↑" : " ↓";
  }

  const rows = useMemo(() => {
    const all = buildRows();
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter(
          (r) =>
            r.product.toLowerCase().includes(q) ||
            r.category.toLowerCase().includes(q)
        )
      : all;
    const sorted = [...filtered].sort((a, b) => {
      let cmp: number;
      if (sortKey === "tariffRate") {
        cmp = a.tariffRate - b.tariffRate;
      } else if (sortKey === "reports") {
        cmp = (reportCounts[a.productId] ?? 0) - (reportCounts[b.productId] ?? 0);
      } else {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return sortDir === "asc" ? cmp : -cmp;
    });
    return sorted;
  }, [query, sortKey, sortDir, reportCounts]);

  return (
    <div className="product-table">
      <div className="table-controls">
        <input
          className="big-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search a product or category…"
        />
      </div>

      {/* Concise context + the invaluable-input framing, then the button. */}
      <p className="input-callout">
        The price increases are based on best, historical estimates (share of a
        product made in the US, and the % of a tariff a retailer adds to the
        price). The Canadian options are based on what's reported on their
        website and secondary sources.
        <br />
        <br />
        <strong>
          Your input (prices you see in stores, Canadian options you know) is
          invaluable to check these estimates and add information that doesn't
          exist online.
        </strong>
      </p>
      <button type="button" className="report-button" onClick={onReportSighting}>
        + Share your input
      </button>

      {rows.length === 0 ? (
        <p>No products match your search.</p>
      ) : (
        <table>
          <thead>
            {/* #5: clickable, sortable column headers with arrows. */}
            <tr>
              <th onClick={() => toggleSort("product")}>Product{arrow("product")}</th>
              <th onClick={() => toggleSort("category")}>
                Category
                <span className="th-sub">from Government of Canada</span>
                {arrow("category")}
              </th>
              <th onClick={() => toggleSort("tariffRate")}>Tariff{arrow("tariffRate")}</th>
              <th>
                Estimated percentage price increase
                <sup className="fn-marker">[1]</sup>
              </th>
              <th>
                Made in Canada option<sup className="fn-marker">[2]</sup>
              </th>
              <th onClick={() => toggleSort("reports")}>
                Community input
                <span className="th-sub">price changes, Canadian alternatives</span>
                {arrow("reports")}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.productId} onClick={() => onOpenCategory(r.categoryId)}>
                <td>{r.product}</td>
                <td>{r.category}</td>
                <td>{(r.tariffRate * 100).toFixed(0)}%</td>
                <td className="impact">
                  {r.impactNote}
                  <span className="formula">
                    {(r.tariffRate * 100).toFixed(0)}% ×{" "}
                    {(r.usImportShare * 100).toFixed(0)}% US-made × ~50% to shelf
                  </span>
                </td>
                <td>
                  {r.alternative ? (
                    <>
                      {r.alternative.name}
                      <span className="alt-sub">
                        {r.alternative.madeIn ? `Made in ${r.alternative.madeIn} · ` : ""}
                        {r.alternative.source ? (
                          <a
                            href={r.alternative.source.url}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {sourceTypeLabel(r.alternative)}
                          </a>
                        ) : (
                          sourceTypeLabel(r.alternative)
                        )}
                      </span>
                    </>
                  ) : (
                    <span className="awaiting">awaiting input</span>
                  )}
                </td>
                <td>
                  {(reportCounts[r.productId] ?? 0) > 0 ? (
                    <span className="report-badge">
                      {reportCounts[r.productId]} report
                      {reportCounts[r.productId] > 1 ? "s" : ""}
                    </span>
                  ) : (
                    <span className="report-none">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Footnotes below the table, keyed to the [1]/[2] markers in the headers. */}
      <div className="footnotes">
        <p>
          <span className="fn-num">[1]</span> A 25% (or 50%) tariff applies at the
          border, but it only applies to the part of the product sourced in the
          US, and research suggests only some of that cost reaches the shelf (we
          use ~50% as an estimate; studies range widely), and it can take weeks to
          appear. So the shelf-price effect is smaller than the full tariff.
        </p>
        <p>
          <span className="fn-num">[2]</span> Could still be affected if a
          particular pack isn't actually made in Canada — origin varies by product
          line and even by pack. Check "Made in Canada" / "Product of Canada" on
          the label.
        </p>
      </div>

      <p className="table-note">
        Tip: click any row for the full breakdown and community reports.
      </p>
      <p className="verified-stamp">
        Tariff rates verified against the official Canada Dept. of Finance list ·
        Last verified: Aug 30, 2026
      </p>
    </div>
  );
}

export default ProductTable;

import { useEffect, useState } from "react";
import { categories } from "./data";
import { estimate } from "./calculator";
import { getApprovedSubmissions, submit } from "./community";
import HowThisWorks from "./HowThisWorks";
import ProductTable from "./ProductTable";
import ReportPage from "./ReportPage";
import type { CategoryRecord, CommunitySubmission, HitProduct, OriginConfidence, SubmissionKind } from "./types";
import "./App.css";

// Shows the trust tier for a made-in-Canada claim. This IS the verification
// learning made visible: users can weight each claim instead of trusting all
// equally. "community" is labelled "User submission" (describe what it is, not
// "unverified" — that framing casts doubt unnecessarily).
function ConfidenceTag({ level }: { level: OriginConfidence }) {
  const label =
    level === "verified"
      ? "Verified"
      : level === "reported"
      ? "Reported"
      : "User submission";
  return <span className={`origin-tag origin-${level}`}>{label}</span>;
}

// One specific hit product. Shows our PLAIN-LANGUAGE translation up front, with
// a toggle to reveal the raw HS code + official legal text we translated FROM.
// That "show the original" option is the honesty of the translation: anyone can
// check that our plain words match the government's words.
function HitProductItem({ product }: { product: HitProduct }) {
  const [showOfficial, setShowOfficial] = useState(false);
  return (
    <li className="hit-product">
      <strong>{product.whatItIs}</strong> — {(product.tariffRate * 100).toFixed(0)}% tariff
      <br />
      <span className="illustrative">{product.illustrativePercentNote}</span>
      {product.usSourcedNote && (
        <>
          <br />
          <span className="us-sourced">{product.usSourcedNote}</span>
        </>
      )}
      <br />
      <button
        type="button"
        className="link-button"
        onClick={() => setShowOfficial((v) => !v)}
      >
        {showOfficial ? "Hide official wording" : "See the official wording"}
      </button>
      {showOfficial && (
        <p className="official">
          <code>{product.hsCode}</code>: {product.officialDescription}
        </p>
      )}
    </li>
  );
}

// ----------------------------------------------------------------------------
// Community section — the VALIDATION LOOP for the uncertain parts (c/d/e).
// A person can report: origin sightings (d), price changes (c), or a Canadian
// option we missed (e). Submissions are stored UNAPPROVED and don't show until
// reviewed — so the public list only ever shows approved rows.
// ----------------------------------------------------------------------------
function CommunitySection({ category }: { category: CategoryRecord }) {
  const [kind, setKind] = useState<SubmissionKind>("origin");
  const [productId, setProductId] = useState<string>(""); // which product row it attaches to
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const [approved, setApproved] = useState<CommunitySubmission[]>([]);

  // Load approved submissions for this category (async, from the backend).
  useEffect(() => {
    let cancelled = false;
    getApprovedSubmissions(category.id).then((rows) => {
      if (!cancelled) setApproved(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [category.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); // stop the browser's default page reload on submit
    if (!text.trim()) return; // basic validation: don't submit empty
    setSubmitError(false);
    try {
      await submit({
        categoryId: category.id,
        productId: productId || undefined, // attach to a specific row if chosen
        kind,
        text,
        location,
      });
      // Clear the form and show a thank-you. The submission does NOT appear in
      // the list below, because it's unapproved — that's the gate working.
      setText("");
      setLocation("");
      setProductId("");
      setJustSubmitted(true);
    } catch {
      setSubmitError(true);
    }
  }

  return (
    <section className="community" id="community-section">
      <h3>What are you seeing in stores?</h3>
      <p className="community-intro">
        The parts we're least sure about — the price impact, which products are
        really US-made, which alternatives are genuinely Canadian — are exactly
        what you can check on the shelf. Seen something? Add it below.
      </p>

      <form onSubmit={handleSubmit}>
        {/* Controlled inputs: React state IS the value. Typing updates state,
            state updates the input. The form is a projection of state. */}
        <label>
          Which product?
          <select value={productId} onChange={(e) => setProductId(e.target.value)}>
            <option value="">(the category in general)</option>
            {category.hitProducts.map((p) => (
              <option key={p.id} value={p.id}>
                {p.whatItIs}
              </option>
            ))}
          </select>
        </label>

        <label>
          What are you reporting?
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as SubmissionKind)}
          >
            <option value="origin">I saw where a product is made</option>
            <option value="price">I noticed a price change</option>
            <option value="alternative">I know a made-in-Canada option</option>
          </select>
        </label>

        <label>
          What did you see?
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Store-brand paper towels marked 'Made in USA'"
          />
        </label>

        <label>
          Where? (optional)
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Ontario"
          />
        </label>

        <p className="privacy-note">Please don't include personal information.</p>
        <button type="submit">Submit</button>
      </form>

      {justSubmitted && (
        <p className="submit-thanks">
          Thanks, your report was received. It'll appear after a quick review.
        </p>
      )}
      {submitError && (
        <p className="submit-error">
          Sorry, that didn't go through. Please try again later.
        </p>
      )}

      <h4>What people are seeing</h4>
      {approved.length === 0 ? (
        <p>No reports yet for this category.</p>
      ) : (
        <ul className="community-list">
          {approved.map((s) => (
            <li key={s.id}>
              <span className={`tag tag-${s.kind}`}>{s.kind}</span> {s.text}
              {s.location ? <em> — {s.location}</em> : ""}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// ----------------------------------------------------------------------------
// One category, rendered as the three Systemic Intelligence layers:
//   Comprehension (what/how much) -> Connection (why/what else) -> Agency (what you can do)
//
// NOTE: this component holds NO facts of its own. Every number comes from
// `estimate(category)`, which comes from the sourced inputs in data.ts.
// The UI is a *projection* of the data — never a source of truth.
// ----------------------------------------------------------------------------
function CategoryView({ category }: { category: CategoryRecord }) {
  // useState: React remembers this value between re-renders. When we flip it,
  // React re-runs this function and updates only what changed on screen.
  // Here it controls whether the "How did we get this?" panel is open.
  const [showWork, setShowWork] = useState(false);

  // Derive the estimate from data. This runs every render — it's cheap and pure.
  const result = estimate(category);

  return (
    <article className="category">
      {/* Bucket label — the category is the organizing bucket, not the headline. */}
      <header>
        <h2>{category.name}</h2>
        <p className="affected">{category.affectedProducts}</p>
      </header>

      {/* ---------- (a)(b)(d) What's actually hit: products first, per the consumer journey ---------- */}
      <section className="hit-products">
        <h3>What's actually hit</h3>
        <ul>
          {category.hitProducts.map((p, i) => (
            <HitProductItem key={i} product={p} />
          ))}
        </ul>
      </section>

      {/* ---------- (c) What this could mean — PERCENTAGE only, no invented dollar figure ----------
          We deliberately DON'T show a $/month number: we couldn't source an honest
          per-household spend figure, and a clean dollar amount would fake a precision
          we don't have. We lead with what's defensible: the verified tariff rate and a
          percentage range from published pass-through research. */}
      <section className="estimate">
        <p className="estimate-label">What this could mean for the price</p>
        <p className="estimate-range">
          On the US-made versions, expect roughly <strong>2–5% more</strong> at
          the shelf.
        </p>
        <p className="no-dollar-note">
          A tariff doesn't hit the shelf all at once — it can take weeks to work
          its way through. And we show a percentage, not a dollar figure, because
          we'd rather give a range we can stand behind than a precise number we
          can't.
        </p>

        {/* Toggle the "show your work" panel. onClick flips the state. */}
        <button type="button" onClick={() => setShowWork((v) => !v)}>
          {showWork ? "Hide" : "How did we get this?"}
        </button>

        {/* React renders this block only when showWork is true. */}
        {showWork && (
          <div className="work">
            <h4>How we got this</h4>
            <ul>
              {result.assumptions.map((a, i) => (
                <li key={i}>{a}</li>
              ))}
            </ul>
            <p className="caveat">
              <strong>Caveat:</strong> {category.methodologyCaveat}
            </p>
            <h5>Sources</h5>
            <ul>
              {category.sources.map((s, i) => (
                <li key={i}>
                  <a href={s.url} target="_blank" rel="noreferrer">
                    {s.label}
                  </a>
                  {s.note ? ` — ${s.note}` : ""}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      {/* ---------- Connection: why, and what else drives the price ---------- */}
      <section className="connection">
        <h3>Why this happens</h3>
        <ol>
          {category.connection.steps.map((step, i) => (
            <li key={i}>{step}</li>
          ))}
        </ol>
        <p className="timing">{category.connection.timingNote}</p>
        <p className="other-factors">
          <strong>The tariff is only one input.</strong> Other things also move
          this price: {category.connection.otherFactors.join(", ")}.
        </p>
      </section>

      {/* ---------- Agency: made-in-Canada options (prominent), honest about savings + origin ---------- */}
      <section className="agency">
        <h3>Made-in-Canada options</h3>
        <p className="wallet-reality">{category.walletRealityNote}</p>
        <ul>
          {category.alternatives.map((alt, i) => (
            <li key={i}>
              <strong>{alt.name}</strong> <ConfidenceTag level={alt.originConfidence} />
              {" "}— {alt.description} <em>({alt.whereToFind})</em>
              <br />
              <span className="honest-note">{alt.honestNote}</span>
              {alt.source && (
                <>
                  {" "}
                  <a href={alt.source.url} target="_blank" rel="noreferrer">
                    (source)
                  </a>
                </>
              )}
            </li>
          ))}
        </ul>
        <p className="no-dollar-note">
          Origin can vary by product line and even by pack. A brand can be
          Canadian and still make some items abroad — so the safe move is to
          check "Made in Canada" / "Product of Canada" on the specific pack.
        </p>
      </section>

      {/* ---------- Community: validate the uncertain parts (c/d/e) ---------- */}
      <CommunitySection category={category} />
    </article>
  );
}

function App() {
  // Three views: the findability TABLE (entry point), a CATEGORY detail (depth),
  // and HOW-this-works. `openCategoryId` remembers which category to show when
  // you click a table row. No routing library needed for this.
  const [page, setPage] = useState<"table" | "category" | "how" | "report">("table");
  const [openCategoryId, setOpenCategoryId] = useState<string | null>(null);
  const [focusCommunity, setFocusCommunity] = useState(false);

  function openCategory(id: string, community = false) {
    setOpenCategoryId(id);
    setFocusCommunity(community);
    setPage("category");
  }

  // On navigation: if we were asked to focus the community section, scroll to
  // it; otherwise scroll to top.
  useEffect(() => {
    if (page === "category" && focusCommunity) {
      // Wait a tick for the category to render, then scroll to the community section.
      const el = document.getElementById("community-section");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [page, openCategoryId, focusCommunity]);

  const openCategory_ = categories.find((c) => c.id === openCategoryId);

  return (
    <main className="app">
      <h1>Tariff Lens</h1>
      <p className="tagline">
        How do Canada's September 8 tariffs impact Canadian consumers? Find your
        products, what's affected, and made-in-Canada options.
      </p>

      {page === "how" && (
        <>
          <button
            type="button"
            className="link-button back"
            onClick={() => setPage("table")}
          >
            ← Back
          </button>
          <HowThisWorks />
        </>
      )}

      {page === "table" && (
        <>
          <ProductTable
            onOpenCategory={openCategory}
            onReportSighting={() => setPage("report")}
          />
          <p className="feedback-row">
            <a
              className="feedback-button"
              href="mailto:shamir.tanna@gmail.com?subject=Tariff%20Lens%20feedback"
            >
              Send me feedback and ideas
            </a>
          </p>
        </>
      )}

      {page === "report" && (
        <>
          <button
            type="button"
            className="link-button back"
            onClick={() => setPage("table")}
          >
            ← Back to all products
          </button>
          <ReportPage />
        </>
      )}

      {page === "category" && openCategory_ && (
        <>
          <button
            type="button"
            className="link-button back"
            onClick={() => setPage("table")}
          >
            ← Back to all products
          </button>
          <CategoryView category={openCategory_} />
        </>
      )}

      <footer className="footer">
        <button
          type="button"
          className="link-button"
          onClick={() => setPage("how")}
        >
          How this works · methodology · what this can't do · what's next
        </button>
      </footer>
    </main>
  );
}

export default App;

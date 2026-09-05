// ============================================================================
// Report page — a DEDICATED page for "what are you seeing in stores?"
//
// Separate from the methodology page (they're different jobs: one is
// contributing data, the other is explaining our method). This is the input
// surface. Submissions are stored UNAPPROVED and only appear after review.
// ============================================================================

import { useState } from "react";
import { categories } from "./data";
import { submit } from "./community";
import type { SubmissionKind } from "./types";

function ReportPage() {
  const [categoryId, setCategoryId] = useState(categories[0].id);
  const [productId, setProductId] = useState("");
  const [kind, setKind] = useState<SubmissionKind>("price");
  const [text, setText] = useState("");
  const [location, setLocation] = useState("");
  const [done, setDone] = useState(false);
  const [failed, setFailed] = useState(false);

  const category = categories.find((c) => c.id === categoryId) ?? categories[0];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setFailed(false);
    try {
      await submit({ categoryId, productId: productId || undefined, kind, text, location });
      setText("");
      setLocation("");
      setProductId("");
      setDone(true);
    } catch {
      setFailed(true);
    }
  }

  return (
    <div className="report-page">
      <h2>Report what you're seeing in stores</h2>
      <p className="community-intro">
        The parts we're least sure about — actual price changes, which products
        are really US-made, which alternatives are genuinely Canadian — are
        exactly what you can check on the shelf. What have you noticed?
      </p>

      <form className="community" onSubmit={handleSubmit}>
        <label>
          Category
          <select
            value={categoryId}
            onChange={(e) => {
              setCategoryId(e.target.value);
              setProductId("");
            }}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Product (optional)
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
          <select value={kind} onChange={(e) => setKind(e.target.value as SubmissionKind)}>
            <option value="price">A price change I noticed</option>
            <option value="origin">Where a product is made (US or Canada)</option>
            <option value="alternative">A made-in-Canada option</option>
          </select>
        </label>

        <label>
          What did you see?
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="e.g. Store-brand paper towels up about $1 at my grocery this week"
          />
        </label>

        <label>
          Where? (optional)
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Ottawa, ON"
          />
        </label>

        <p className="privacy-note">Please don't include personal information.</p>
        <button type="submit">Submit</button>
      </form>

      {done && (
        <p className="submit-thanks">
          Thanks, your report was received. It'll appear after a quick review.
          Please don't include personal information.
        </p>
      )}
      {failed && (
        <p className="submit-error">
          Sorry, that didn't go through. Please try again later.
        </p>
      )}
    </div>
  );
}

export default ReportPage;

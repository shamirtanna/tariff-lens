// ============================================================================
// "How this works" — the transparency + credibility page.
//
// Cheapest page to build, highest leverage: it's where the honesty lives and
// where we invite people to prove us wrong. Leads with the REAL value (the
// document-translation thesis), then methodology, honest limits, what's not
// included, a plain "how tariffs actually work" note, and the feedback ask.
//
// This is content, not logic — no calculations, no data dependencies.
// ============================================================================

function HowThisWorks() {
  return (
    <div className="how-this-works">
      <h2>How this works</h2>

      {/* THE CORE VALUE — the document-translation thesis, up top. */}
      <section>
        <h3>What this really is</h3>
        <p>
          Governments and institutions publish the truth, but in a language you
          can't use. The tariff list is written in HS codes and legal text, for
          customs brokers and trade lawyers. It was never meant for the person
          standing in the store.
        </p>
        <p>
          <strong>
            This tool takes that document and translates it into something that
            applies to your actual life:
          </strong>{" "}
          what's hit, roughly what it means for the price, and what
          made-in-Canada options exist. The tariff is just the first example; the
          real idea is making complex systems legible to the people they affect.
        </p>
      </section>

      {/* HOW WE ESTIMATE — the model, stated plainly. */}
      <section>
        <h3>How we estimate the price impact</h3>
        <p>
          The percentage is a simplified estimate, not a proven formula. We
          combine three things:
        </p>
        <ul>
          <li>the tariff rate on the product (from the official list)</li>
          <li>
            a rough estimate of how much of that product is US-sourced (only the
            imported share is directly affected)
          </li>
          <li>
            how much of a tariff actually reaches the shelf, "pass-through," which
            published research puts anywhere from about 20% to 80% (we use ~50% as
            a middle estimate)
          </li>
        </ul>
        <p>
          It likely errs on the low side, because it doesn't capture the way
          tariffs can also nudge up the price of domestically made goods.
        </p>
      </section>

      {/* A plain "how tariffs work" note. */}
      <section>
        <h3>How tariffs work (may be a surprise)</h3>
        <p>
          A tariff isn't a percentage slapped on a whole country. It's a specific
          rate on specific products, based on where they're <em>made</em>, the
          country of origin. That's why "Made in Canada" matters: it's the origin,
          not the brand, that avoids the tariff. And the genuinely hard part, the
          part that's invisible to shoppers, is figuring out which products are
          actually imported and which alternatives are actually Canadian. That's
          the work this tool tries to do for you.
        </p>
      </section>

      {/* HONEST LIMITS. */}
      <section>
        <h3>What this tool can't do</h3>
        <ul>
          <li>
            It can't tell you the exact price of a specific product — prices vary
            by store, region, brand, and week.
          </li>
          <li>
            It can't confirm that a specific item on the shelf is US-made — origin
            varies by SKU. It can only tell you what's likely.
          </li>
          <li>
            It's not financial or purchasing advice — it's a starting point for
            your own decisions.
          </li>
        </ul>
      </section>

      {/* WHAT'S NOT INCLUDED (and why) — transparency about the seams. */}
      <section>
        <h3>What's not in this version (and why)</h3>
        <ul>
          <li>
            <strong>No chatbot.</strong> The numbers come from a fixed calculation
            you can inspect, not an AI that answers freely — because an AI could
            invent a confident wrong figure, and this tool is about trust.
          </li>
          <li>
            <strong>No live prices.</strong> These are estimates of what tariffs
            could do, not scraped shelf prices. What people report seeing is the
            closest thing to real — which is why the community input exists.
          </li>
          <li>
            <strong>Submissions are reviewed before they show.</strong> Not
            censorship — just keeping bad data and spam off a page people are
            trusting.
          </li>
        </ul>
      </section>

      {/* POTENTIAL FUTURE IMPROVEMENTS. */}
      <section>
        <h3>Potential future improvements</h3>
        <ul>
          <li>Alerts when the tariff list or a category changes</li>
          <li>Checks against popular retailer websites that publish prices</li>
          <li>
            Estimates of how much specific retailers are passing tariff costs on
            to customers
          </li>
        </ul>
      </section>

      {/* THE FEEDBACK ASK — a feature, not a footnote. */}
      <section className="feedback-ask">
        <h3>Tell me where I'm wrong</h3>
        <p>
          This is a first version, and the estimates are ranges, not gospel. If
          you know a category better than I do, or you start seeing real prices
          move, I want to hear it. That correction is the tool working.
        </p>
        <p>
          <a className="feedback-button" href="mailto:shamir.tanna@gmail.com?subject=Tariff%20Lens%20feedback">
            Send me feedback and ideas
          </a>
        </p>
      </section>
    </div>
  );
}

export default HowThisWorks;

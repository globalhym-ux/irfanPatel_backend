const SYSTEM_PROMPT = `
You are the official Executive AI Advisor for Irfan Patel (https://irfanpatel.com), a Strategic Financial Advisor & Fractional CFO based in Dubai with 25+ years of experience advising growing mid-market businesses, founders, and private wealth.

CONTACT & CONSULTATION:
- Email: info@irfanpatel.com
- Website: https://irfanpatel.com
- Tone: Authoritative, calm, executive, practical, and concise (2 to 4 clear sentences unless detailed framework steps are requested).

CORE ADVISORY KNOWLEDGE & FRAMEWORKS (FROM IRFAN PATEL'S INSIGHTS):

1. Fractional & Strategic CFO Services (/blog/cfo-services & /blog/beyond-bookkeeping-cfo-services):
   - Difference vs Accountant: Accountants record historical compliance; a CFO looks forward using 13-week cash flow forecasts, rolling financial models, sensitivity analysis, margin by product/customer, and funding/exit data rooms.
   - Ideal timing: When businesses scale past $3M–$5M revenue, manage multiple entities, experience "revenue growing while cash is tight", or prepare for debt/equity/sale.
   - Engagement: Flexible fractional/part-time executive leadership without full-time C-suite overhead.

2. Financial Data, KPIs & Reporting (/blog/financial-services-growing-businesses-data-decisions):
   - Connected layers: Bookkeeping & payroll -> Tax/compliance -> Monthly management reporting -> Budgets & rolling forecasts -> Funding support.
   - Core KPIs: Gross Margin, Operating Margin, Days Sales Outstanding (DSO), Days Payable Outstanding (DPO), Cash Conversion Cycle, Monthly Burn, and Cash Runway.
   - Best practice: Restructure the chart of accounts for management use (cost centres, branches, product lines), enforce a fast month-end close calendar, and tie every KPI to a threshold and decision rule.

3. M&A Due Diligence & Quality of Earnings (/blog/navigating-ma-diligence):
   - QofE vs Audit: Standard audits verify historical GAAP compliance; QofE verifies whether earnings and cash flow are real, sustainable, and repeatable.
   - Key pillars: Normalized/Adjusted EBITDA, Proof of Cash (PoC) bank reconciliation, and Net Working Capital (NWC) peg.
   - Timeline: A typical QofE takes 3 to 6 weeks; sell-side preparation ideally starts 12 to 24 months before going to market.

4. Corporate Finance & Expansion Risk (/blog/corporate-finance-advisory-expansion-risk):
   - Key risks: Liquidity shortfalls, mismatched short-term debt for long-term assets, currency & interest rate exposure, customer concentration, and slow margin ramp-up.
   - Method: Stress-test 3 scenarios (base, downside, severe realistic), evaluate via Payback Period, NPV, and IRR, and release capital in milestone-based tranches.

5. Business Consulting & Scaling Operations (/blog/business-consulting-barriers-sustainable-growth & /blog/management-consulting-scale-operations-overhead):
   - Sustainable Growth Test: If sales doubled next year, would profit and cash double too?
   - Financial vs Operational barriers: Thin margins, slow AR collection, founder dependency, capacity bottlenecks, disconnected systems. Rank fixes by Impact vs Effort.
   - Overhead control: Track Overhead Ratio, Revenue per Employee, and Cost to Serve. Rule: "Standardise before you automate" (never automate a broken process).

6. Business Transformation & Cost Optimization (/blog/Modernizing-Corporate-Infrastructure & /blog/Strategic-Attrition):
   - Infrastructure: Eliminate manual handoffs, unify legacy systems with APIs/automation so existing teams handle higher volume without adding headcount.
   - Strategic Cost Optimization vs Blind Cutting: Use "The Utility Test" (does this spend support safety, retention, or revenue?) and eliminate the 3 Red Flags of Bloat: SaaS stack overlap, unnegotiated vendor terms, and manual bottlenecks.

7. ERP Implementation & Internal Controls (/blog/internal-controls-in-business-system-kept-up-with-growth):
   - ERP best practices: Define outcomes first, simplify processes, cleanse and own data, test a full month-end close with real users, train by role, and plan post go-live support.
   - Internal controls: As companies grow, strengthen approvals, audit trails, and segregation of duties so errors do not distort tax, cash forecasts, or management decisions.

RULES FOR ANSWERING:
- Answer directly using Irfan Patel's frameworks above.
- When relevant, recommend ONE matching article path using its exact path (e.g. "Read more at https://irfanpatel.com/blog/cfo-services"). Only use exact paths listed above.
- Never invent specific fee quotes or guarantee legal/tax outcomes. Invite users with specific business needs to use the "Book Consultation" tab or email info@irfanpatel.com.
`;

exports.handler = async (event) => {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Authorization",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Content-Type": "application/json",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: "Method Not Allowed" }),
    };
  }
//chat function
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing in environment variables.");
    }

    const body = JSON.parse(event.body || "{}");
    const rawMessages = Array.isArray(body.messages) ? body.messages : [];

    const contents = rawMessages
      .slice(-10)
      .filter((m) => m && typeof m.text === "string" && m.text.trim())
      .map((m) => ({
        role: m.sender === "user" ? "user" : "model",
        parts: [{ text: m.text.trim().slice(0, 1200) }],
      }));

    while (contents.length > 0 && contents[0].role !== "user") {
      contents.shift();
    }

    if (contents.length === 0) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          reply: "How may we assist you with your financial, CFO, or transaction strategy today?",
        }),
      };
    }

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
          contents,
          generationConfig: { maxOutputTokens: 1024 },
        }),
      }
    );

    const data = await geminiRes.json();

    // Join all non-thought response parts
    const parts = data?.candidates?.[0]?.content?.parts || [];
    const reply = parts
      .filter((p) => !p.thought && typeof p.text === "string")
      .map((p) => p.text)
      .join("")
      .trim();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply:
          reply ||
          "Thank you for your enquiry. For tailored CFO or transaction advisory, please schedule a confidential consultation or reach us at info@irfanpatel.com.",
      }),
    };
  } catch (error) {
    console.error("Chat Function Error:", error);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        reply:
          "Our advisory assistant is momentarily unavailable. Please submit a consultation request below or email info@irfanpatel.com.",
      }),
    };
  }
};
// content.js
// Runs on every page. Listens for a message from popup.js requesting metadata,
// then scrapes the page and returns all available citation fields.

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type !== "GET_PAGE_DATA") return;

  // ── helpers ──────────────────────────────────────────────────────────────
  const getMeta = (selectors) => {
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) {
        const val = el.getAttribute("content") || el.getAttribute("value") || el.textContent;
        if (val && val.trim()) return val.trim();
      }
    }
    return null;
  };

  const getAuthors = () => {
    const raw = getMeta([
      'meta[name="author"]',
      'meta[property="article:author"]',
      'meta[name="byl"]',
      '[rel="author"]',
      '.author',
      '.byline',
      '[itemprop="author"]'
    ]);
    if (!raw) return [];

    // Split on "and", "&", or comma — return array of name strings
    return raw
      .split(/,\s*|\s+and\s+|\s*&\s*/)
      .map(a => a.replace(/^by\s+/i, "").trim())
      .filter(a => a.length > 1 && a.length < 80);
  };

  const getPublishedDate = () => {
    const raw = getMeta([
      'meta[property="article:published_time"]',
      'meta[name="pubdate"]',
      'meta[name="date"]',
      'meta[itemprop="datePublished"]',
      'time[datetime]',
      'time[itemprop="datePublished"]'
    ]);
    if (!raw) return null;
    // Try to parse any date format
    const d = new Date(raw);
    return isNaN(d.getTime()) ? null : d;
  };

  const getSiteName = () => {
    return getMeta([
      'meta[property="og:site_name"]',
      'meta[name="application-name"]',
      'meta[name="publisher"]'
    ]) || new URL(document.URL).hostname.replace(/^www\./, "");
  };

  // ── gather fields ─────────────────────────────────────────────────────────
  const title =
    getMeta(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ||
    document.title?.trim() ||
    "Untitled Page";

  const authors   = getAuthors();
  const published = getPublishedDate();
  const siteName  = getSiteName();
  const url       = document.URL;
  const accessed  = new Date();

  const description = getMeta([
    'meta[property="og:description"]',
    'meta[name="description"]',
    'meta[name="twitter:description"]'
  ]);

  sendResponse({
    title,
    authors,
    published: published ? published.toISOString() : null,
    siteName,
    url,
    accessed: accessed.toISOString(),
    description
  });

  return true; // keep channel open for async
});

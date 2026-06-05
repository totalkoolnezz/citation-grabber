// citations.js
// Pure formatting functions — no DOM access.
// Each function takes a data object and returns a formatted citation string.

// ── name helpers ────────────────────────────────────────────────────────────

/**
 * Splits "First Last" into { first, last }.
 * Handles "Last, First" format too.
 */
function parseName(name) {
  if (!name) return { first: "", last: "" };
  name = name.trim();
  if (name.includes(",")) {
    const [last, first] = name.split(",").map(s => s.trim());
    return { first, last };
  }
  const parts = name.split(/\s+/);
  const last  = parts.pop();
  const first = parts.join(" ");
  return { first, last };
}

/** "First Last" → "Last, First" */
function invertName(name) {
  const { first, last } = parseName(name);
  return first ? `${last}, ${first}` : last;
}

/** "First Last" → "F. Last" (APA style for second+ authors) */
function initialsName(name) {
  const { first, last } = parseName(name);
  if (!first) return last;
  const initials = first.split(/\s+/).map(p => p[0].toUpperCase() + ".").join(" ");
  return `${last}, ${initials}`;
}

/** Format author list for MLA */
function mlaAuthors(authors) {
  if (!authors || authors.length === 0) return null;
  if (authors.length === 1) return invertName(authors[0]);
  if (authors.length === 2) return `${invertName(authors[0])}, and ${authors[1]}`;
  return `${invertName(authors[0])}, et al`;
}

/** Format author list for APA */
function apaAuthors(authors) {
  if (!authors || authors.length === 0) return null;
  if (authors.length <= 20) {
    const names = authors.map((a, i) => initialsName(a));
    if (names.length === 1) return names[0];
    const last = names.pop();
    return names.join(", ") + ", & " + last;
  }
  // 21+ authors: first 19, ellipsis, last
  const first19 = authors.slice(0, 19).map(a => initialsName(a)).join(", ");
  const lastAuth = initialsName(authors[authors.length - 1]);
  return `${first19}, . . . ${lastAuth}`;
}

/** Format author list for Chicago */
function chicagoAuthors(authors) {
  if (!authors || authors.length === 0) return null;
  if (authors.length === 1) return invertName(authors[0]);
  if (authors.length <= 3) {
    const inverted = invertName(authors[0]);
    const rest     = authors.slice(1).join(", and ");
    return `${inverted}, and ${rest}`;
  }
  return `${invertName(authors[0])}, et al`;
}

// ── date helpers ────────────────────────────────────────────────────────────

const MONTHS_LONG  = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
const MONTHS_SHORT = ["Jan.","Feb.","Mar.","Apr.","May","June",
                      "July","Aug.","Sep.","Oct.","Nov.","Dec."];

function mlaDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return `${d.getUTCDate()} ${MONTHS_SHORT[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function mlaAccessDate(date) {
  const d = new Date(date);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
}

function apaDate(date) {
  if (!date) return "n.d.";
  const d = new Date(date);
  return `${d.getUTCFullYear()}, ${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

function apaYear(date) {
  if (!date) return "n.d.";
  return new Date(date).getUTCFullYear().toString();
}

function chicagoDate(date) {
  if (!date) return null;
  const d = new Date(date);
  return `${MONTHS_LONG[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function chicagoAccessDate(date) {
  const d = new Date(date);
  return `${MONTHS_LONG[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── formatters ───────────────────────────────────────────────────────────────

/**
 * MLA 9th edition — website citation
 * Format:
 * LastName, FirstName. "Title of Page." Site Name, Day Mon. Year, URL. Accessed Day Mon. Year.
 */
function formatMLA(data) {
  const { title, authors, published, siteName, url, accessed } = data;
  const parts = [];

  const authorStr = mlaAuthors(authors);
  if (authorStr) parts.push(authorStr + ".");

  parts.push(`"${title}."`);
  parts.push(`*${siteName}*,`);

  const pubDate = mlaDate(published);
  if (pubDate) parts.push(pubDate + ",");

  parts.push(url + ".");
  parts.push("Accessed " + mlaAccessDate(accessed) + ".");

  return parts.join(" ");
}

/**
 * APA 7th edition — webpage citation
 * Format:
 * Last, F. (Year, Month Day). Title of page. Site Name. URL
 */
function formatAPA(data) {
  const { title, authors, published, siteName, url } = data;
  const parts = [];

  const authorStr = apaAuthors(authors);
  if (authorStr) parts.push(authorStr + ".");

  const year = apaYear(published);
  const fullDate = published ? `(${apaDate(published)}).` : `(${year}).`;
  parts.push(fullDate);

  // Title: sentence case, no italics in plain text
  parts.push(title + ".");

  parts.push(`*${siteName}*.`);
  parts.push(url);

  return parts.join(" ");
}

/**
 * Chicago 17th edition — website (notes-bibliography style)
 * Format:
 * Last, First. "Title." Site Name. Month Day, Year. URL.
 */
function formatChicago(data) {
  const { title, authors, published, siteName, url, accessed } = data;
  const parts = [];

  const authorStr = chicagoAuthors(authors);
  if (authorStr) parts.push(authorStr + ".");

  parts.push(`"${title}."`);
  parts.push(`${siteName}.`);

  const pubDate = chicagoDate(published);
  if (pubDate) parts.push(pubDate + ".");

  parts.push(url + ".");

  return parts.join(" ");
}

// ── in-text / footnote helpers ───────────────────────────────────────────────

function mlaInText(data) {
  const { authors, siteName } = data;
  const name = authors && authors.length
    ? parseName(authors[0]).last
    : `"${data.title.substring(0, 25)}${data.title.length > 25 ? '…' : ''}"`;
  return `(${name})`;
}

function apaInText(data) {
  const { authors, published, siteName } = data;
  const year = apaYear(published);
  if (!authors || authors.length === 0) {
    const short = data.title.substring(0, 30) + (data.title.length > 30 ? "…" : "");
    return `("${short}", ${year})`;
  }
  if (authors.length === 1) return `(${parseName(authors[0]).last}, ${year})`;
  if (authors.length === 2) {
    return `(${parseName(authors[0]).last} & ${parseName(authors[1]).last}, ${year})`;
  }
  return `(${parseName(authors[0]).last} et al., ${year})`;
}

function chicagoFootnote(data) {
  const { title, authors, published, siteName, url } = data;
  const parts = [];
  if (authors && authors.length) parts.push(authors[0] + ",");
  parts.push(`"${title},"`, `${siteName},`);
  const pd = chicagoDate(published);
  if (pd) parts.push(pd + ",");
  parts.push(url + ".");
  return parts.join(" ");
}

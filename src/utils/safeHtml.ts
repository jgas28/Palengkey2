/**
 * Minimal rich text for admin-written copy (pop-up ad body): keeps only
 * bold / italic / underline / line breaks, drops every attribute, and turns
 * anything else into plain text. Output is safe for dangerouslySetInnerHTML.
 *
 *   "Use <b><i>SUKI100</i></b> today" → bold italic voucher code
 */
const ALLOWED = new Set(["B", "STRONG", "I", "EM", "U", "BR"]);

function escapeText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function walk(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) {
    // Plain line breaks typed in the textarea still show as new lines.
    return escapeText(node.textContent ?? "").replace(/\n/g, "<br>");
  }
  if (node.nodeType !== Node.ELEMENT_NODE) return "";

  const element = node as Element;
  const tag = element.tagName.toUpperCase();
  // Scripts, styles etc. are dropped entirely — not even their text survives.
  if (["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "TEMPLATE"].includes(tag))
    return "";

  const inner = Array.from(element.childNodes).map(walk).join("");
  if (!ALLOWED.has(tag)) return inner;
  if (tag === "BR") return "<br>";
  const name = tag.toLowerCase();
  return `<${name}>${inner}</${name}>`;
}

export function sanitizeRichText(input: string | null | undefined): string {
  if (!input) return "";
  const doc = new DOMParser().parseFromString(`<body>${input}</body>`, "text/html");
  return Array.from(doc.body.childNodes).map(walk).join("");
}

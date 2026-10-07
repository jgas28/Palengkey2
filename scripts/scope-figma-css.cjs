// Ports the Figma Make stylesheet into the app, scoped to the customer app.
// Every selector gets a `:where(body.pk)` prefix — zero added specificity, so the
// design's own cascade is preserved exactly, but none of it leaks into /admin.
const fs = require("fs");
const postcss = require("postcss");

const [, , src, out] = process.argv;
const root = postcss.parse(fs.readFileSync(src, "utf8"));
const SCOPE = ":where(body.pk)";

root.walkAtRules("import", (rule) => rule.remove()); // fonts are linked in index.html

root.walkRules((rule) => {
  if (rule.parent.type === "atrule" && /keyframes$/.test(rule.parent.name)) return;
  rule.selectors = rule.selectors.flatMap((sel) => {
    const s = sel.trim();
    // Root/body need real specificity to beat Tailwind's base `body` rule.
    if (s === ":root" || s === "body") return ["body.pk"];
    if (s === "html") return [`html:has(${SCOPE})`];
    if (s === "*") return [`${SCOPE} *`, `${SCOPE} *::before`, `${SCOPE} *::after`];
    // Global element resets (footer, h1, img, …) and class selectors alike.
    return [`${SCOPE} ${s}`];
  });
});

const header =
  "/* Generated from the Figma Make export (Filipino Grocery Delivery App/src/index.css).\n" +
  " * Scoped to the customer app via body.pk — see scripts/scope-figma-css.cjs. */\n";
fs.writeFileSync(out, header + root.toString());
console.log("wrote", out);

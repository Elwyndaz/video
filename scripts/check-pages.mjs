// Verdict for a /video/ page: no console errors, no horizontal overflow at four widths, the video can play, no axe WCAG 2.2 AA violations, link preview tags and image in place. Screenshots to out/.
// Usage: npm run preview (in another terminal), then npm run check:pages. Against live: node scripts/check-pages.mjs https://orgutveckling.se
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const axeSource = await readFile(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

const base = process.argv[2] ?? "http://127.0.0.1:4391";
// CHROMIUM points at a browser binary when the installed playwright has none of its own.
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let failed = 0;
// Add each new film page here.
for (const path of ["/video/myter/", "/video/"]) {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    page.on("pageerror", (e) => errors.push(String(e)));
    // The browser aborts and re-requests media while seeking; that is not a failure.
    page.on("requestfailed", (r) => r.failure()?.errorText !== "net::ERR_ABORTED" && errors.push(`failed ${r.url()}`));
    const res = await page.goto(base + path, { waitUntil: "networkidle" });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    const video = await page.evaluate(async () => {
      const v = document.querySelector("video");
      if (!v) return "none";
      v.muted = true;
      await v.play().catch(() => {});
      await new Promise((r) => setTimeout(r, 1200));
      return v.currentTime > 0.3 ? "plays" : `stuck (readyState ${v.readyState})`;
    });
    // evaluate() is not subject to the page's CSP, so axe runs without loosening it. preload: false stops axe fetching the font stylesheet, which connect-src blocks.
    await page.evaluate(axeSource);
    const axe = await page.evaluate(async () => {
      const r = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"], preload: false });
      return r.violations.map((v) => `${v.id} (${v.nodes.length})`);
    });
    // Link preview: og/twitter tags present, og:url is the canonical, the image is served at its stated size. Checked against base, not live.
    const meta = await page.evaluate(() => {
      const m = (k) => document.querySelector(`meta[property="${k}"], meta[name="${k}"]`)?.content ?? "";
      return { url: m("og:url"), canonical: document.querySelector('link[rel="canonical"]')?.href ?? "", image: m("og:image"), w: m("og:image:width"), h: m("og:image:height"), need: ["og:title", "og:description", "og:image:alt", "twitter:card", "twitter:image"].filter((k) => !m(k)) };
    });
    const og = [...meta.need.map((k) => `no ${k}`)];
    if (!meta.url || meta.url !== meta.canonical) og.push(`og:url ${meta.url} is not canonical ${meta.canonical}`);
    if (!meta.image.startsWith("https://")) og.push("og:image not absolute");
    else {
      const img = await page.evaluate(async (src) => new Promise((done) => { const i = new Image(); i.onload = () => done(`${i.naturalWidth}x${i.naturalHeight}`); i.onerror = () => done("missing"); i.src = src; }), new URL(meta.image).pathname);
      if (img !== `${meta.w}x${meta.h}`) og.push(`og:image ${img}, tags say ${meta.w}x${meta.h}`);
    }
    if (og.length) errors.push(...og);
    const bad = res.status() !== 200 || over > 0 || errors.length || video.startsWith("stuck") || axe.length;
    if (bad) failed++;
    console.log(`${bad ? "FAIL" : "ok  "} ${path} @${width}: status ${res.status()}, overflow ${over}, video ${video}, axe ${axe.length ? axe.join(" ") : 0}${errors.length ? ", errors: " + errors.slice(0, 3).join(" | ") : ""}`);
    if (width === 390 || width === 1440) {
      await page.evaluate(() => document.querySelector("video")?.pause());
      await page.screenshot({ path: `out/page${path.replace(/\W+/g, "-")}${width}.png`, fullPage: true });
    }
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);

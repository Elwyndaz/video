// Verdict for a /video/ page: header, menus, footer links and the borrowed CSS/JS versions match the main site, claim counts match /forskning/, no console errors, no horizontal overflow at four widths, the video can play, no axe WCAG 2.2 AA violations, link preview tags and image in place. Screenshots to out/.
// Usage: npm run preview (in another terminal), then npm run check:pages. Against live: node scripts/check-pages.mjs https://orgutveckling.se
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { chromium } from "playwright";

const axeSource = await readFile(createRequire(import.meta.url).resolve("axe-core/axe.min.js"), "utf8");

const base = process.argv[2] ?? "http://127.0.0.1:4391";
// CHROMIUM points at a browser binary when the installed playwright has none of its own.
const browser = await chromium.launch(process.env.CHROMIUM ? { executablePath: process.env.CHROMIUM } : {});
let failed = 0;
// Header, menus and footer are copied from the main site; a nav change there must reach these pages. Compared as href + text of every link.
// The borrowed /style.css and /site.js are compared too: the main site busts caches with ?v=, and an unversioned copy is served stale from the edge for hours.
const chrome = (p) => p.evaluate(() => [
  ...[...document.querySelectorAll(".site-header a, .mobile-nav a, .site-footer a")].map((a) => `${a.getAttribute("href")} ${a.textContent.trim()}`),
  ...[...document.querySelectorAll('link[href^="/style.css"], script[src^="/site.js"]')].map((e) => `asset ${e.getAttribute("href") ?? e.getAttribute("src")}`),
]);
const home = await browser.newPage();
await home.goto(base + "/", { waitUntil: "domcontentloaded" });
const mainChrome = await chrome(home);
// "N påståenden" on a film page must be the count the research summary states in its ingress.
await home.goto(base + "/forskning/", { waitUntil: "domcontentloaded" });
const claims = await home.evaluate(() => document.querySelector(".ingress")?.textContent.match(/^([\d\s]+) påståenden/)?.[1].replace(/\s/g, "") ?? "none");
await home.close();
// Add each new film page here. A mistyped shared link lands on docs/404.html: Swedish, the site chrome, status 404, no link preview.
for (const [path, status] of [["/video/myter/", 200], ["/video/", 200], ["/video/finns-inte/", 404]]) {
  for (const width of [320, 390, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    // On the 404 page the browser logs the page's own 404 status; that one is expected.
    page.on("console", (m) => m.type() === "error" && !(status === 404 && m.location().url === base + path) && errors.push(m.text()));
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
    const og = [];
    // The 404 page is never shared, so it carries no link preview; it must still say in Swedish what happened.
    if (status === 404) {
      const title = await page.title();
      if (!title.startsWith("Sidan finns inte")) og.push(`title ${title}`);
      // Everyone on a 404 under /video/ came for a film (a link pasted with a trailing ")", a retyped "Myter").
      if (!(await page.locator("main a[href='/video/']").count())) og.push("no link to /video/");
    } else {
      og.push(...meta.need.map((k) => `no ${k}`));
      if (!meta.url || meta.url !== meta.canonical) og.push(`og:url ${meta.url} is not canonical ${meta.canonical}`);
      if (!meta.image.startsWith("https://")) og.push("og:image not absolute");
      else {
        const img = await page.evaluate(async (src) => new Promise((done) => { const i = new Image(); i.onload = () => done(`${i.naturalWidth}x${i.naturalHeight}`); i.onerror = () => done("missing"); i.src = src; }), new URL(meta.image).pathname);
        if (img !== `${meta.w}x${meta.h}`) og.push(`og:image ${img}, tags say ${meta.w}x${meta.h}`);
      }
    }
    if (og.length) errors.push(...og);
    const counts = await page.evaluate(() => [...(document.querySelector("main")?.textContent ?? "").matchAll(/(\d[\d\s]*?) påståenden/g)].map((m) => m[1].replace(/\s/g, "")));
    for (const n of new Set(counts)) if (n !== claims) errors.push(`says ${n} påståenden, /forskning/ says ${claims}`);
    if (width === 320) {
      const mine = await chrome(page);
      const missing = mainChrome.filter((l) => !mine.includes(l)), extra = mine.filter((l) => !mainChrome.includes(l));
      if (missing.length || extra.length) errors.push(`chrome differs from main site: ${[...missing.map((l) => "missing " + l), ...extra.map((l) => "extra " + l)].join(", ")}`);
    }
    const bad = res.status() !== status || over > 0 || errors.length || video.startsWith("stuck") || axe.length;
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

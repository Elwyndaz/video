// Verdict for a /video/ page: no console errors, no horizontal overflow at four widths, the video can play. Screenshots to out/.
// Usage: npm run preview (in another terminal), then npm run check:pages. Against live: node scripts/check-pages.mjs https://orgutveckling.se
import { chromium } from "playwright";

const base = process.argv[2] ?? "http://127.0.0.1:4391";
const browser = await chromium.launch();
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
    const bad = res.status() !== 200 || over > 0 || errors.length || video.startsWith("stuck");
    if (bad) failed++;
    console.log(`${bad ? "FAIL" : "ok  "} ${path} @${width}: status ${res.status()}, overflow ${over}, video ${video}${errors.length ? ", errors: " + errors.slice(0, 3).join(" | ") : ""}`);
    if (width === 390 || width === 1440) {
      await page.evaluate(() => document.querySelector("video")?.pause());
      await page.screenshot({ path: `out/page${path.replace(/\W+/g, "-")}${width}.png`, fullPage: true });
    }
    await page.close();
  }
}
await browser.close();
process.exit(failed ? 1 : 0);

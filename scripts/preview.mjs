// Local preview: /video/* from docs/, everything else from the main site repo, with the zone's CSP.
// The main site is read from MAIN_SITE, else a sibling elwyndaz.github.io checkout; without one it is fetched from orgutveckling.se.
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";

const docs = fileURLToPath(new URL("../docs", import.meta.url));
const sibling = fileURLToPath(new URL("../../elwyndaz.github.io", import.meta.url));
const mainSite = process.env.MAIN_SITE ?? (existsSync(sibling) ? sibling : null);
const live = "https://orgutveckling.se";

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webp": "image/webp" };
// Copied from the Cloudflare zone (curl -sI https://orgutveckling.se/video/). Keep it identical, or the check passes things production blocks.
const csp = "default-src 'self'; script-src 'self' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

async function load(path) {
  if (path.startsWith("/video/")) return readFile(join(docs, normalize(path.slice(6))));
  if (mainSite) return readFile(join(mainSite, normalize(path)));
  const r = await fetch(live + path);
  if (!r.ok) throw new Error(String(r.status));
  return Buffer.from(await r.arrayBuffer());
}

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path === "/video") path = "/video/";
  if (path.endsWith("/")) path += "index.html";
  try {
    const data = await load(path);
    const head = { "content-type": types[extname(path)] ?? "application/octet-stream", "content-security-policy": csp, "accept-ranges": "bytes" };
    // Byte ranges, so the video can seek like it does on Pages.
    const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? "");
    if (range && (range[1] || range[2])) {
      const start = range[1] ? Number(range[1]) : Math.max(0, data.length - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), data.length - 1) : data.length - 1;
      if (start > end) return res.writeHead(416, { "content-range": `bytes */${data.length}` }).end();
      res.writeHead(206, { ...head, "content-range": `bytes ${start}-${end}/${data.length}`, "content-length": end - start + 1 });
      return res.end(data.subarray(start, end + 1));
    }
    res.writeHead(200, { ...head, "content-length": data.length });
    res.end(data);
  } catch {
    res.writeHead(404).end("404");
  }
}).listen(4391, "127.0.0.1", () => console.log(`preview on http://127.0.0.1:4391/video/myter/ (main site: ${mainSite ?? live})`));

// Local preview: /video/* from docs/, everything else from the main site repo, with the zone's CSP.
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const types = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webp": "image/webp" };
const csp = "default-src 'self'; script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' https://cloudflareinsights.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'";

createServer(async (req, res) => {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (path.endsWith("/")) path += "index.html";
  const file = path.startsWith("/video/") ? join("C:/dev/video/docs", normalize(path.slice(6))) : join("C:/dev/elwyndaz.github.io", normalize(path));
  try {
    const data = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream", "content-security-policy": csp });
    res.end(data);
  } catch {
    res.writeHead(404).end("404");
  }
}).listen(4391, "127.0.0.1", () => console.log("preview on http://127.0.0.1:4391/video/myter/"));

// The local preview server (scripts/preview.mjs): what it serves, from where, with which headers, and byte ranges. Run: npm test
// The live fallback (no MAIN_SITE, no sibling checkout) needs the network and is not tested here.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const tmp = mkdtempSync(join(tmpdir(), "preview-"));
const site = join(tmp, "site");
mkdirSync(join(site, "fonts"), { recursive: true });
writeFileSync(join(tmp, "secret.txt"), "outside");
for (const ext of ["css", "js", "png", "jpg", "svg", "webp", "mp4", "bin"]) writeFileSync(join(site, `a.${ext}`), ext);
writeFileSync(join(site, "index.html"), "main home");
writeFileSync(join(site, "fonts", "ten.txt"), "0123456789");
const docs = (p) => readFileSync(new URL(`../docs/${p}`, import.meta.url));

let server, base;
before(async () => {
  server = spawn(process.execPath, [fileURLToPath(new URL("preview.mjs", import.meta.url))], { env: { ...process.env, PORT: "0", MAIN_SITE: site } });
  base = await new Promise((done, fail) => {
    let out = "";
    server.stdout.on("data", (d) => {
      out += d;
      const m = /http:\/\/127\.0\.0\.1:(\d+)\//.exec(out);
      if (m) done(`http://127.0.0.1:${m[1]}`);
    });
    server.on("exit", (code) => fail(new Error(`preview exited ${code}`)));
  });
});
after(() => server.kill());

const get = (path, headers = {}) => fetch(base + path, { headers });

test("film pages come from docs/, /video and folders resolve to index.html", async () => {
  for (const [path, file] of [["/video", "index.html"], ["/video/", "index.html"], ["/video/myter/", "myter/index.html"], ["/video/myter/poster.jpg", "myter/poster.jpg"]]) {
    const r = await get(path);
    assert.equal(r.status, 200, path);
    assert.deepEqual(Buffer.from(await r.arrayBuffer()), docs(file), path);
  }
  assert.equal((await get("/video/")).headers.get("content-type"), "text/html; charset=utf-8");
});

test("everything outside /video/ comes from MAIN_SITE", async () => {
  assert.equal(await (await get("/")).text(), "main home");
  assert.equal(await (await get("/a.css")).text(), "css");
  assert.equal((await get("/videos.css")).status, 404, "/videos is not /video/");
});

test("content types by extension, unknown ones as octet-stream", async () => {
  const want = { css: "text/css", js: "text/javascript", png: "image/png", jpg: "image/jpeg", svg: "image/svg+xml", mp4: "video/mp4", webp: "image/webp", bin: "application/octet-stream" };
  for (const [ext, type] of Object.entries(want)) assert.equal((await get(`/a.${ext}`)).headers.get("content-type"), type, ext);
});

test("every response carries the zone's CSP: self only, no inline scripts, no framing", async () => {
  const csp = (await get("/video/")).headers.get("content-security-policy");
  const d = Object.fromEntries(csp.split("; ").map((p) => [p.split(" ")[0], p.split(" ").slice(1)]));
  assert.deepEqual(d["default-src"], ["'self'"]);
  assert.ok(d["script-src"].includes("'self'") && !d["script-src"].includes("'unsafe-inline'"), csp);
  assert.deepEqual(d["frame-ancestors"], ["'none'"]);
  assert.deepEqual(d["object-src"], ["'none'"]);
  assert.equal((await get("/a.css")).headers.get("content-security-policy"), csp, "main site files too");
});

test("missing files and paths that climb out of the roots are 404", async () => {
  for (const path of ["/nope.css", "/video/nope/", "/..%2Fsecret.txt", "/video/..%2F..%2Fpackage.json"]) assert.equal((await get(path)).status, 404, path);
});

test("a malformed URL is a 400, and the server keeps running", async () => {
  assert.equal((await get("/%E0%A4%A")).status, 400);
  assert.equal((await get("/a.css")).status, 200);
});

test("byte ranges, so the video can seek", async () => {
  const range = async (r) => {
    const res = await get("/fonts/ten.txt", r === undefined ? {} : { range: r });
    return [res.status, res.headers.get("content-range"), res.headers.get("content-length"), await res.text()];
  };
  assert.deepEqual(await range(undefined), [200, null, "10", "0123456789"]);
  assert.equal((await get("/fonts/ten.txt")).headers.get("accept-ranges"), "bytes");
  assert.deepEqual(await range("bytes=2-5"), [206, "bytes 2-5/10", "4", "2345"]);
  assert.deepEqual(await range("bytes=0-0"), [206, "bytes 0-0/10", "1", "0"]);
  assert.deepEqual(await range("bytes=7-"), [206, "bytes 7-9/10", "3", "789"]);
  assert.deepEqual(await range("bytes=-3"), [206, "bytes 7-9/10", "3", "789"]);
  assert.deepEqual(await range("bytes=-30"), [206, "bytes 0-9/10", "10", "0123456789"], "suffix longer than the file");
  assert.deepEqual(await range("bytes=5-100"), [206, "bytes 5-9/10", "5", "56789"], "end past the file");
  assert.deepEqual(await range("bytes=9-9"), [206, "bytes 9-9/10", "1", "9"]);
  assert.deepEqual(await range("bytes=8-3"), [416, "bytes */10", null, ""]);
  assert.deepEqual(await range("bytes=10-"), [416, "bytes */10", null, ""], "start past the end");
  assert.deepEqual(await range("bytes=-"), [200, null, "10", "0123456789"], "no numbers: whole file");
  assert.deepEqual(await range("items=1-2"), [200, null, "10", "0123456789"], "other units: whole file");
  assert.deepEqual(await range("bytes=1-2,4-5"), [200, null, "10", "0123456789"], "multipart: whole file");
});

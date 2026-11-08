// Minimal static file server (no dependencies). Usage: node scripts/serve.js [port] [rootDir]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".svg": "image/svg+xml" };

export function startServer({ port = 0, root } = {}) {
  const base = resolve(root ?? join(fileURLToPath(new URL(".", import.meta.url)), ".."));
  const server = createServer(async (req, res) => {
    const urlPath = decodeURIComponent(new URL(req.url, "http://x").pathname);
    const file = normalize(join(base, urlPath.endsWith("/") ? urlPath + "index.html" : urlPath));
    if (file !== base && !file.startsWith(base + sep)) { res.writeHead(403).end(); return; }
    try {
      const body = await readFile(file);
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" }).end(body);
    } catch {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise((ok) => server.listen(port, "127.0.0.1", () => ok({ server, url: `http://127.0.0.1:${server.address().port}` })));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { url } = await startServer({ port: Number(process.argv[2] ?? 8080), root: process.argv[3] });
  console.log(`Serving on ${url}/  (Ctrl+C to stop)`);
}

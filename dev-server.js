"use strict";
/**
 * Servidor local (Node 18+, sem dependências): serve o site e executa /api/reviews.
 * Uso:  1) copie .env.example para .env.local e preencha;  2) node dev-server.js
 *       3) abra http://localhost:3000
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

// Carrega .env.local / .env (sem sobrescrever variáveis já definidas)
for (const arquivo of [".env.local", ".env"]) {
  const p = path.join(__dirname, arquivo);
  if (!fs.existsSync(p)) continue;
  for (const linha of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}

const handler = require("./api/reviews.js");
const TIPOS = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".json": "application/json" };
const PORTA = Number(process.env.PORT) || 3000;

http.createServer(async (req, res) => {
  const { pathname } = new URL(req.url, "http://localhost");

  if (pathname === "/api/reviews") {
    res.status = (c) => { res.statusCode = c; return res; };
    res.json = (b) => { res.setHeader("Content-Type", "application/json; charset=utf-8"); res.end(JSON.stringify(b)); return res; };
    return handler(req, res);
  }

  const rel = pathname === "/" ? "index.html" : decodeURIComponent(pathname).replace(/^\/+/, "");
  const arquivo = path.resolve(__dirname, rel);
  const bloqueado = /(^|[\\/])(api|\.env[^\\/]*|\.git[^\\/]*|dev-server\.js)([\\/]|$)/.test(path.relative(__dirname, arquivo));
  if (!arquivo.startsWith(__dirname + path.sep) || bloqueado || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    res.statusCode = 404; return res.end("Não encontrado");
  }
  res.setHeader("Content-Type", TIPOS[path.extname(arquivo).toLowerCase()] || "application/octet-stream");
  fs.createReadStream(arquivo).pipe(res);
}).listen(PORTA, () => {
  const ok = process.env.GOOGLE_PLACES_API_KEY && process.env.GOOGLE_PLACE_ID;
  console.log(`Site: http://localhost:${PORTA}`);
  console.log(ok ? "Variáveis do Google carregadas." : "ATENÇÃO: GOOGLE_PLACES_API_KEY / GOOGLE_PLACE_ID não definidas (veja .env.example).");
});

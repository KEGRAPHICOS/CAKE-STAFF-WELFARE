const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");

app.use(helmet());
const PORT = process.env.PORT || 3000;

const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

if (!ADMIN_USERNAME || !ADMIN_PASSWORD) {
  throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must be configured.");
}


const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data.json");
const sessions = new Set();

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname, { extensions: ["html"] }));

function readDB() {
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}
function writeDB(data) {
  const tmp = DATA_FILE + ".tmp";
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, DATA_FILE);
}
function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !sessions.has(token)) return res.status(401).json({ error: "Unauthorized" });
  next();
}

app.post("/api/login", loginLimiter, (req, res) => {
  const { username, password } = req.body || {};
  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD)
    return res.status(401).json({ error: "Wrong username or password" });
  const token = crypto.randomBytes(32).toString("hex");
  sessions.add(token);
  res.json({ token });
});

app.post("/api/logout", auth, (req, res) => {
  const token = req.headers.authorization.replace(/^Bearer\s+/i, "");
  sessions.delete(token);
  res.json({ ok: true });
});

app.get("/health", (req, res) => res.json({ ok: true, service: "cake-staff-welfare" }));

app.get("/api/data", (req, res) => {
  try { res.json(readDB()); }
  catch { res.status(500).json({ error: "Could not read database" }); }
});

app.get("/api/data/:year", (req, res) => {
  try {
    const db = readDB();
    res.json(db[req.params.year] || []);
  } catch {
    res.status(500).json({ error: "Could not read database" });
  }
});

app.put("/api/data/:year", auth, (req, res) => {
  const year = String(req.params.year);
  if (!/^\d{4}$/.test(year)) return res.status(400).json({ error: "Invalid year" });
  if (!Array.isArray(req.body)) return res.status(400).json({ error: "Database must be an array" });

  const months = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  const cleaned = req.body
    .filter(m => m && typeof m.name === "string")
    .map(m => {
      const c = {};
      months.forEach(mon => {
        const n = Number(m.c?.[mon] ?? 0);
        c[mon] = Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : 0;
      });
      return { name: m.name.trim().replace(/\s+/g, " ").toUpperCase(), c };
    })
    .filter((m, i, a) => m.name && a.findIndex(x => x.name === m.name) === i)
    .sort((a,b) => a.name.localeCompare(b.name));

  const db = readDB();
  db[year] = cleaned;
  writeDB(db);
  res.json({ ok: true, year, members: cleaned.length });
});

app.get(/.*/, (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => console.log(`CAKE STAFFS WELFARE running on http://localhost:${PORT}`));


const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many login attempts. Please try again later."
  }
});

const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "ck1";
const SEED_FILE = process.env.SEED_FILE || path.join(__dirname, "data.json");

if (!process.env.DATABASE_URL) {
  console.warn("WARNING: DATABASE_URL is not set. PostgreSQL is required for online use.");
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && !/localhost|127\.0\.0\.1/.test(process.env.DATABASE_URL)
    ? { rejectUnauthorized: false }
    : false,
});

const sessions = new Set();

app.use(express.json({ limit: "2mb" }));

// Never expose the local JSON seed/database file through the public website.
app.use((req, res, next) => {
  if (req.path === "/data.json" || req.path === "/db-seed.json") {
    return res.status(404).end();
  }
  next();
});

app.use(express.static(__dirname, { extensions: ["html"] }));

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
];

function cleanRecords(records) {
  return (Array.isArray(records) ? records : [])
    .filter(member => member && typeof member.name === "string")
    .map(member => {
      const c = {};
      MONTHS.forEach(month => {
        const n = Number(member.c?.[month] ?? 0);
        c[month] = Number.isFinite(n) && n >= 0
          ? Math.round(n * 100) / 100
          : 0;
      });
      return {
        name: member.name.trim().replace(/\s+/g, " ").toUpperCase(),
        c,
      };
    })
    .filter((member, index, array) =>
      member.name && array.findIndex(x => x.name === member.name) === index
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function initializeDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS welfare_data (
      year VARCHAR(4) PRIMARY KEY,
      members JSONB NOT NULL DEFAULT '[]'::jsonb,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const countResult = await pool.query("SELECT COUNT(*)::int AS count FROM welfare_data");
  const count = countResult.rows[0].count;

  // One-time migration: copy the existing data.json into PostgreSQL.
  if (count === 0 && fs.existsSync(SEED_FILE)) {
    try {
      const seed = JSON.parse(fs.readFileSync(SEED_FILE, "utf8"));
      const years = Object.keys(seed || {});

      for (const year of years) {
        if (!/^\d{4}$/.test(String(year))) continue;
        const members = cleanRecords(seed[year]);
        await pool.query(
          `INSERT INTO welfare_data (year, members) VALUES ($1, $2::jsonb)
           ON CONFLICT (year) DO NOTHING`,
          [String(year), JSON.stringify(members)]
        );
      }

      console.log(`Migrated ${years.length} year(s) from data.json to PostgreSQL.`);
    } catch (error) {
      console.error("Could not migrate data.json:", error);
    }
  }
}

function auth(req, res, next) {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token || !sessions.has(token)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

app.post("/api/login", (req, res) => {
  const { username, password } = req.body || {};

  if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Wrong username or password" });
  }

  const token = crypto.randomBytes(32).toString("hex");
  sessions.add(token);
  res.json({ token });
});

app.post("/api/logout", auth, (req, res) => {
  const token = req.headers.authorization.replace(/^Bearer\s+/i, "");
  sessions.delete(token);
  res.json({ ok: true });
});

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ ok: true, service: "cake-staff-welfare", database: "postgresql" });
  } catch {
    res.status(503).json({ ok: false, service: "cake-staff-welfare", database: "unavailable" });
  }
});

app.get("/api/data", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT year, members FROM welfare_data ORDER BY year"
    );

    const db = {};
    result.rows.forEach(row => {
      db[row.year] = row.members;
    });

    res.json(db);
  } catch (error) {
    console.error("Read database error:", error);
    res.status(500).json({ error: "Could not read database" });
  }
});

app.get("/api/data/:year", async (req, res) => {
  const year = String(req.params.year);

  if (!/^\d{4}$/.test(year)) {
    return res.status(400).json({ error: "Invalid year" });
  }

  try {
    const result = await pool.query(
      "SELECT members FROM welfare_data WHERE year = $1",
      [year]
    );

    res.json(result.rows[0]?.members || []);
  } catch (error) {
    console.error("Read year error:", error);
    res.status(500).json({ error: "Could not read database" });
  }
});

app.put("/api/data/:year", auth, async (req, res) => {
  const year = String(req.params.year);

  if (!/^\d{4}$/.test(year)) {
    return res.status(400).json({ error: "Invalid year" });
  }

  if (!Array.isArray(req.body)) {
    return res.status(400).json({ error: "Database must be an array" });
  }

  const cleaned = cleanRecords(req.body);

  try {
    await pool.query(
      `INSERT INTO welfare_data (year, members, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (year)
       DO UPDATE SET members = EXCLUDED.members, updated_at = NOW()`,
      [year, JSON.stringify(cleaned)]
    );

    res.json({ ok: true, year, members: cleaned.length });
  } catch (error) {
    console.error("Save database error:", error);
    res.status(500).json({ error: "Could not save database" });
  }
});

app.get(/.*/, (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  res.sendFile(path.join(__dirname, "index.html"));
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, HOST, () => {
      console.log(`CAKE STAFFS WELFARE running on port ${PORT}`);
      console.log("Contribution data storage: PostgreSQL");
    });
  })
  .catch(error => {
    console.error("Could not initialize PostgreSQL:", error);
    process.exit(1);
  });

process.on("SIGTERM", async () => {
  await pool.end();
  process.exit(0);
});

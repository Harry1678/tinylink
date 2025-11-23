const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production"
       ? { rejectUnauthorized: false }
       : false
});

// Generate random short code
const generateId = () => Math.random().toString(36).substring(2, 8);

// Health check
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// List all links
app.get("/api/links", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT code, target_url, clicks, last_clicked FROM links WHERE deleted = false ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Create short URL
app.post("/api/shorten", async (req, res) => {
  const { originalUrl } = req.body;
  if (!originalUrl) return res.status(400).json({ error: "originalUrl is required" });

  const code = generateId();
  try {
    await pool.query(
      "INSERT INTO links(code, target_url) VALUES($1, $2)",
      [code, originalUrl]
    );

    const BASE_URL = (process.env.BASE_URL || "https://tinylink-77ax.onrender.com").trim();

    res.json({
      originalUrl,
      shortUrl: `${BASE_URL}/${code}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Redirect short URL
app.get("/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query(
      "SELECT target_url, clicks FROM links WHERE code = $1 AND deleted = false",
      [code]
    );

    if (result.rows.length === 0) return res.status(404).send("Short URL not found");

    const link = result.rows[0];

    await pool.query(
      "UPDATE links SET clicks = clicks + 1, last_clicked = now() WHERE code = $1",
      [code]
    );

    res.redirect(link.target_url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("🚀 TinyLink backend loaded successfully");
});

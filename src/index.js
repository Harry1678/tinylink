const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");

const app = express();

app.use(cors());
app.use(express.json());

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false
});

// Serve frontend
app.use(express.static(path.join(__dirname, "../public")));

// Generate random code
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

// Stats for one code
app.get("/api/links/:code", async (req, res) => {
  const { code } = req.params;
  try {
    const result = await pool.query(
      "SELECT code, target_url, clicks, last_clicked FROM links WHERE code = $1 AND deleted = false",
      [code]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Link not found" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Create link
app.post("/api/links", async (req, res) => {
  const { target_url, code } = req.body;

  if (!target_url) return res.status(400).json({ error: "target_url is required" });

  let finalCode = code || generateId();

  // Validate custom code
  if (code) {
    const codeRegex = /^[A-Za-z0-9]{6,8}$/;
    if (!codeRegex.test(code)) {
      return res.status(400).json({ error: "Custom code must be 6-8 alphanumeric characters" });
    }
  }

  try {
    const exists = await pool.query("SELECT 1 FROM links WHERE code = $1", [finalCode]);
    if (exists.rows.length > 0) return res.status(409).json({ error: "Code already exists" });

    await pool.query("INSERT INTO links(code, target_url) VALUES($1, $2)", [
      finalCode,
      target_url
    ]);

    const BASE_URL = process.env.BASE_URL || "https://tinylink-77ax.onrender.com";

    res.json({
      code: finalCode,
      target_url,
      shortUrl: `${BASE_URL}/${finalCode}`
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Delete link
app.delete("/api/links/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      "UPDATE links SET deleted = true WHERE code = $1 AND deleted = false RETURNING *",
      [code]
    );

    if (result.rows.length === 0)
      return res.status(404).json({ error: "Link not found" });

    res.json({ message: "Link deleted successfully", code });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database error" });
  }
});

// Redirect
app.get("/:code", async (req, res) => {
  const { code } = req.params;

  try {
    const result = await pool.query(
      "SELECT target_url FROM links WHERE code = $1 AND deleted = false",
      [code]
    );

    if (result.rows.length === 0) return res.status(404).send("Short URL not found");

    await pool.query("UPDATE links SET clicks = clicks + 1, last_clicked = now() WHERE code = $1", [
      code
    ]);

    res.redirect(result.rows[0].target_url);
  } catch (err) {
    console.error(err);
    res.status(500).send("Database error");
  }
});

// Start
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("🚀 TinyLink backend loaded successfully");
});

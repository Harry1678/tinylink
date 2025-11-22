// src/index.js

const express = require("express");
const cors = require("cors"); // to allow frontend from other origins
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// In-memory store for URLs
// Structure: { id: { originalUrl, clicks, last_clicked } }
const urls = {};
const generateId = () => Math.random().toString(36).substring(2, 8);

// Health check
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// List all short URLs
app.get("/api/links", (req, res) => {
  const allLinks = Object.keys(urls).map(id => ({
    code: id,
    target_url: urls[id].originalUrl,
    clicks: urls[id].clicks,
    last_clicked: urls[id].last_clicked
  }));
  res.json(allLinks);
});

// Create short URL
app.post("/api/shorten", (req, res) => {
  const { originalUrl } = req.body;
  if (!originalUrl) return res.status(400).json({ error: "originalUrl is required" });

  const id = generateId();
  urls[id] = { originalUrl, clicks: 0, last_clicked: null };

  const BASE_URL = (process.env.BASE_URL || "https://tinylink-77ax.onrender.com").trim();

  res.json({
    originalUrl,
    shortUrl: `${BASE_URL}/${id}`
  });
});

// Redirect short URL
app.get("/:id", (req, res) => {
  const { id } = req.params;
  const link = urls[id];
  if (!link) return res.status(404).send("Short URL not found");

  // Update clicks and last clicked
  link.clicks++;
  link.last_clicked = new Date().toISOString();

  res.redirect(link.originalUrl);
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("🚀 index.js loaded successfully");
});

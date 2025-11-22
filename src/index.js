// src/index.js

const express = require("express");
const app = express();

// Middleware to parse JSON
app.use(express.json());

// In-memory store for URLs (for testing)
const urls = {};
const generateId = () => Math.random().toString(36).substring(2, 8);

// Default route
app.get("/", (req, res) => {
  res.send("TinyLink backend is running!");
});

// Health check route
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// Create short URL
app.post("/api/shorten", (req, res) => {
  const { originalUrl } = req.body;
  if (!originalUrl) return res.status(400).json({ error: "originalUrl is required" });

  const id = generateId();
  urls[id] = originalUrl;

  const BASE_URL = process.env.BASE_URL || `https://tinylink-77ax.onrender.com`;

  res.json({
    originalUrl,
    shortUrl: `${BASE_URL}/${id}`
  });
});

// Redirect short URL
app.get("/:id", (req, res) => {
  const { id } = req.params;
  const url = urls[id];
  if (url) {
    return res.redirect(url);
  } else {
    return res.status(404).send("Short URL not found");
  }
});

// Start server
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log("🚀 index.js loaded successfully");
});

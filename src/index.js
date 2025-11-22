// src/index.js

const express = require("express");
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Example health check endpoint
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// Use PORT from environment variable or fallback
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


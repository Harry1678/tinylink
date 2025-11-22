console.log("🚀 index.js loaded successfully");

const express = require("express");
const app = express();

app.use(express.json());

// Default route
app.get("/", (req, res) => {
  res.send("TinyLink backend is running!");
});

// Health check route
app.get("/healthz", (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});


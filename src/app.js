// src/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const linksRouter = require('./routes/links');
const redirectRouter = require('./routes/redirect');

const app = express();

app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({ ok: true, version: "1.0" });
});

// API routes
app.use('/api/links', linksRouter);

// Redirect route (must be last)
app.use('/', redirectRouter);

module.exports = app;

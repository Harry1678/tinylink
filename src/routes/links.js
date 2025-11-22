// src/routes/links.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const Joi = require('joi');
const { customAlphabet } = require('nanoid');

// Allowed characters for code
const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
const generateCode = customAlphabet(alphabet, 6);

// Validation schema
const schema = Joi.object({
  target_url: Joi.string().uri().required(),
  code: Joi.string().alphanum().min(6).max(8).optional()
});

// POST /api/links - create new short link
router.post('/', async (req, res) => {
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ error: error.message });

  const { target_url, code } = value;

  const finalCode = code ? code : generateCode();

  try {
    const query = `INSERT INTO links (code, target_url) VALUES ($1, $2) RETURNING code, target_url`;
    await db.query(query, [finalCode, target_url]);

    return res.status(201).json({
      code: finalCode,
      target_url
    });
  } catch (err) {
    // If code is duplicate → send 409 Conflict
    if (err.code === '23505') {
      return res.status(409).json({ error: "Code already exists" });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/links - list all active links
router.get('/', async (req, res) => {
  const result = await db.query(
    'SELECT code, target_url, clicks, last_clicked FROM links WHERE deleted = false ORDER BY created_at DESC'
  );
  res.json(result.rows);
});

// GET /api/links/:code - get details for a specific link
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  const result = await db.query(
    'SELECT code, target_url, clicks, last_clicked FROM links WHERE code=$1 AND deleted=false',
    [code]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Not found' });
  }

  res.json(result.rows[0]);
});

// DELETE /api/links/:code - soft delete
router.delete('/:code', async (req, res) => {
  const { code } = req.params;

  const result = await db.query(
    'UPDATE links SET deleted=true WHERE code=$1 AND deleted=false RETURNING code',
    [code]
  );

  if (result.rowCount === 0) {
    return res.status(404).json({ error: 'Not found' });
  }

  return res.status(204).send();
});

module.exports = router;

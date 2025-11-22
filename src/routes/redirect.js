// src/routes/redirect.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// This route handles: GET /:code
router.get('/:code', async (req, res) => {
  const { code } = req.params;

  try {
    // Fetch the target URL for this code
    const result = await db.query(
      'SELECT target_url FROM links WHERE code=$1 AND deleted=false',
      [code]
    );

    // If not found → 404
    if (result.rowCount === 0) {
      return res.status(404).send("Not Found");
    }

    const url = result.rows[0].target_url;

    // Increase click count + update last_clicked timestamp
    await db.query(
      'UPDATE links SET clicks = clicks + 1, last_clicked = now() WHERE code=$1',
      [code]
    );

    // Redirect user to the target URL
    return res.redirect(302, url);

  } catch (err) {
    console.error(err);
    return res.status(500).send("Internal Server Error");
  }
});

module.exports = router;

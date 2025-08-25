const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/women-map', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM entrepreneurs');
    res.json(rows);
  } catch (error) {
    console.error('Harita verisi hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

module.exports = router;

const express = require('express');
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const pool = require('../db'); // MySQL bağlantı havuzun
require('dotenv').config();

const router = express.Router();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// POST /api/google-login
router.post('/google-login', async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken gerekli' });
  }

  try {
    // 1) Google token’ını doğrula
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const email = payload.email;
    const name  = payload.name;

    // 2) Kullanıcı DB’de var mı?
    const [rows] = await pool.execute('SELECT id FROM users WHERE email = ?', [email]);

    let userId;
    if (rows.length === 0) {
      // Yeni kullanıcı – kaydet
      const [result] = await pool.execute(
        'INSERT INTO users (username, email) VALUES (?, ?)',
        [name, email]
      );
      userId = result.insertId;
    } else {
      userId = rows[0].id;
    }

    // 3) JWT üret
    const token = jwt.sign(
      { userId, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 4) Geri dön
    res.json({ token, username: name });

  } catch (err) {
    console.error('Google login error:', err);
    res.status(401).json({ error: 'Geçersiz Google kimliği' });
  }
});

module.exports = router;

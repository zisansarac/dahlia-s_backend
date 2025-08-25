const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const bcrypt = require('bcryptjs'); 

// Mail ayarları (Gmail için örnek)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'officialdahliasdahlias@gmail.com',
    pass: 'imkt onkv qoly fsep' // app password
  }
});



// forgot-password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Bu mail adresi ile kayıtlı kullanıcı bulunamadı.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expireDate = new Date(Date.now() + 3600000); // 1 saat geçerli

    await db.query('UPDATE users SET reset_token = ?, reset_token_expire = ? WHERE email = ?', [token, expireDate, email]);

    const resetUrl = `http://192.168.0.74/reset-password/${token}`;

    await transporter.sendMail({
      to: email,
      subject: 'Şifre Sıfırlama Bağlantısı',
      html: `<p>Şifrenizi sıfırlamak için <a href="${resetUrl}">buraya tıklayın</a>.</p><p>Bu bağlantı 1 saat içinde geçerliliğini yitirecektir.</p>`
    });

    res.status(200).json({ message: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.' });
  } catch (err) {
    console.error('Mail gönderme hatası:', err);
    res.status(500).json({ message: 'Bir hata oluştu.' });
  }
});




// reset-password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  if (!password) return res.status(400).json({ message: 'Yeni şifre gerekli.' });

  const [users] = await db.query(
    'SELECT * FROM users WHERE reset_token = ? AND reset_token_expire > NOW()',
    [token]
  );
  if (users.length === 0) return res.status(400).json({ message: 'Geçersiz veya süresi dolmuş token.' });

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = users[0];

  await db.query(
    'UPDATE users SET password = ?, reset_token = NULL, reset_token_expire = NULL WHERE id = ?',
    [hashedPassword, user.id]
  );

  res.status(200).json({ message: 'Şifre başarıyla güncellendi.' });
});


module.exports = router;

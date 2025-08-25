const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/upload');
const db = require('../db'); // mysql bağlantı dosyası

// 📌 PROFİL GETİRME
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query(
      'SELECT id, username, email, bio, profile_image FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// 📌 PROFİL BİLGİLERİ VE FOTOĞRAF GÜNCELLEME (Multipart destekli)
router.post('/update-profile', verifyToken, upload.single('profile_image'), async (req, res) => {
  try {
    const userId = req.user.id;
    const { username, email, bio } = req.body;
    let profileImagePath = null;

    if (req.file) {
      // Dosya "upload/profile_images" klasörüne kaydediliyor
      profileImagePath = `profile_images/${req.file.filename}`;
    }

    // Güncellenecek alanlar dinamik hazırlanıyor
    let fields = [];
    let values = [];

    // Username ve email'i ayrı ayrı kontrol et
    if (username && username.trim() !== '') {
      fields.push('username = ?');
      values.push(username.trim());
    }

    if (email && email.trim() !== '') {
      fields.push('email = ?');
      values.push(email.trim());
    }

    if (bio && bio.trim() !== '') {
      fields.push('bio = ?');
      values.push(bio.trim());
    }

    if (profileImagePath) {
      fields.push('profile_image = ?');
      values.push(profileImagePath);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Güncellenecek veri yok' });
    }

    values.push(userId);

    const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;
    await db.query(sql, values);

    const [rows] = await db.query(
      'SELECT id, username, email, bio, profile_image FROM users WHERE id = ?',
      [userId]
    );

    let user = rows[0];
    
    // Eğer yeni dosya yüklendiyse, response'da tam URL'yi dönüyoruz:
    const profile_image_url = profileImagePath 
      ? `/upload/${profileImagePath}` 
      : (user.profile_image ? `/upload/profile_images/${user.profile_image}` : null);

    res.json({ 
      success: true, 
      profile_image_url,
      user: {
        ...user,
        profile_image_url
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// Başka bir kullanıcıyı ID ile görüntüleme (token gerekmez)
// 🔹 Başkasının profilini görme (email hariç)
router.get('/profile/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    console.log('Requested user ID:', userId);


    const [rows] = await db.query(
      'SELECT id, username, bio, profile_image FROM users WHERE id = ?',
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı' });
    }

    const user = rows[0];
    const profile_image_url = user.profile_image
      ? `/upload/profile_images/${user.profile_image}`
      : null;

    res.json({ ...user, profile_image_url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});



module.exports = router;

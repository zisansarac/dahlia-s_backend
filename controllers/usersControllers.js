const path = require('path');
const fs = require('fs');
const pool = require('../db');

// 📌 Kullanıcının profilini (biyografi + fotoğraf) güncelle
exports.updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // JWT middleware ile geliyor
    const bio = req.body.bio;
    const imagePath = req.file ? `/upload/profile_images/${req.file.filename}` : null;

    // 🧼 Mevcut profil fotoğrafını sil (isteğe bağlı)
    if (imagePath) {
      const [rows] = await pool.query('SELECT profile_image FROM users WHERE id = ?', [userId]);
      const oldImagePath = rows[0]?.profile_picture;
      if (oldImagePath && fs.existsSync(path.join(__dirname, '..', oldImagePath))) {
        fs.unlinkSync(path.join(__dirname, '..', oldImagePath));
      }
    }

    // 🛠️ Veritabanını güncelle
    const updateQuery = `
      UPDATE users 
      SET bio = ?, profile_image = COALESCE(?, profile_image)
      WHERE id = ?
    `;
    await pool.query(updateQuery, [bio, imagePath, userId]);

    res.status(200).json({
      message: 'Profil başarıyla güncellendi',
      imageUrl: imagePath
    });

  } catch (error) {
    console.error('Profil güncellenemedi:', error);
    res.status(500).json({ error: 'Profil güncellenemedi' });
  }
};

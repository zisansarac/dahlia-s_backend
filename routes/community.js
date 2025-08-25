const express = require('express');
const router = express.Router();
const db = require('../db');

// ➕ Yeni topluluk mesajı ekleme
router.post('/', async (req, res) => {
  const { user_id, message } = req.body;

  if (!user_id || !message) {
    return res.status(400).json({ error: 'user_id ve message zorunludur' });
  }

  try {
    await db.query(
      'INSERT INTO community_posts (user_id, message) VALUES (?, ?)',
      [user_id, message]
    );
    res.status(201).json({ message: 'Mesaj başarıyla paylaşıldı' });
  } catch (error) {
    console.error('Ekleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// 📥 Tüm mesajları listeleme (yeniden eskiye)
router.get('/', async (req, res) => {
  const { user_id } = req.query;

  try {
    const [rows] = await db.query(`
      SELECT cp.*, u.username,
        EXISTS (
          SELECT 1 FROM community_likes
          WHERE user_id = ? AND post_id = cp.id
        ) AS isLiked
      FROM community_posts cp
      JOIN users u ON cp.user_id = u.id
      ORDER BY cp.created_at DESC
    `, [user_id || 0]);

    res.json(rows);
  } catch (error) {
    console.error('Listeleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// 🔁 Mesaj güncelleme
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { user_id, message } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE community_posts SET message = ? WHERE id = ? AND user_id = ?',
      [message, id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Bu mesajı düzenleme yetkiniz yok' });
    }

    res.json({ message: 'Mesaj güncellendi' });
  } catch (err) {
    console.error('Mesaj güncelleme hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});


// ❌ Sadece kendi mesajını silme
router.delete('/:id/:userId', async (req, res) => {
  const { id, userId } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM community_posts WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Bu mesajı silme yetkiniz yok' });
    }

    res.json({ message: 'Mesaj silindi' });
  } catch (error) {
    console.error('Silme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.put('/:id', async (req, res) => {
  const { user_id, message } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE community_posts SET message = ? WHERE id = ? AND user_id = ?',
      [message, req.params.id, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Bu postu düzenleme yetkiniz yok' });
    }

    res.json({ message: 'Post güncellendi' });
  } catch (error) {
    console.error('Post güncelleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});


// 👍 Beğeni ekle/kaldır (toggle)
router.post('/:id/like', async (req, res) => {
  const postId = req.params.id;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id zorunludur' });
  }

  try {
    // Kullanıcı daha önce beğenmiş mi?
    const [rows] = await db.query(
      'SELECT * FROM community_likes WHERE user_id = ? AND post_id = ?',
      [user_id, postId]
    );

    if (rows.length > 0) {
      // Beğenmişse: Beğeniyi kaldır
      await db.query(
        'DELETE FROM community_likes WHERE user_id = ? AND post_id = ?',
        [user_id, postId]
      );
      await db.query(
        'UPDATE community_posts SET likes = likes - 1 WHERE id = ?',
        [postId]
      );
      return res.json({ liked: false });
    } else {
      // Beğenmemişse: Beğeniyi ekle
      await db.query(
        'INSERT INTO community_likes (user_id, post_id) VALUES (?, ?)',
        [user_id, postId]
      );
      await db.query(
        'UPDATE community_posts SET likes = likes + 1 WHERE id = ?',
        [postId]
      );
      return res.json({ liked: true });
    }
  } catch (error) {
    console.error('Beğeni hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// 💬 Yorum ekleme
router.post('/:id/comment', async (req, res) => {
  const postId = req.params.id;
  const { user_id, comment } = req.body;

  try {
    await db.query(
      'INSERT INTO post_comments (post_id, user_id, comment) VALUES (?, ?, ?)',
      [postId, user_id, comment]
    );
    res.status(201).json({ message: 'Yorum eklendi' });
  } catch (error) {
    console.error('Yorum ekleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

// 📥 Yorumları listeleme
router.get('/:id/comments', async (req, res) => {
  const postId = req.params.id;

  try {
    const [rows] = await db.query(
      `SELECT c.*, u.username 
       FROM post_comments c 
       JOIN users u ON c.user_id = u.id 
       WHERE c.post_id = ? 
       ORDER BY c.created_at DESC`,
      [postId]
    );
    res.json(rows);
  } catch (error) {
    console.error('Yorum listeleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});

router.delete('/comment/:commentId/:userId', async (req, res) => {
  const { commentId, userId } = req.params;

  try {
    const [result] = await db.query(
      'DELETE FROM post_comments WHERE id = ? AND user_id = ?',
      [commentId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Bu yorumu silme yetkiniz yok' });
    }

    res.json({ message: 'Yorum silindi' });
  } catch (error) {
    console.error('Yorum silme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});


// 🔁 Yorum güncelleme
router.put('/:postId/comments/:commentId', async (req, res) => {
  const { commentId, postId } = req.params;
  const { user_id, comment } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE post_comments SET comment = ? WHERE id = ? AND user_id = ? AND post_id = ?',
      [comment, commentId, user_id, postId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ error: 'Bu yorumu düzenleme yetkiniz yok' });
    }

    res.json({ message: 'Yorum güncellendi' });
  } catch (err) {
    console.error('Yorum güncelleme hatası:', err);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});







module.exports = router;

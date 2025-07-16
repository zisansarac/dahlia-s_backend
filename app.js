const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');

const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);


const app = express();
//const status = (req.body.status || 'hazırlanıyor').toLowerCase();

const db = require('./db'); // Örneğin db bağlantı dosyası

app.use(express.json());

// Orta katmanlar (middlewares)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type']
}));
app.use(bodyParser.json());

// Rotalar
app.use('/orders', ordersRoutes);

app.delete('/orders/:id', (req, res) => {
  const id = req.params.id;
  const sql = 'DELETE FROM orders WHERE id = ?';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Silme hatası:', err);
      return res.status(500).json({ error: 'Silme işlemi başarısız' });
    }
    res.status(200).json({ message: 'Sipariş silindi' });
  });
});


app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const [rows] = await db.query('SELECT * FROM users WHERE username = ?', [username]);

    if (rows.length > 0) {
      return res.status(400).json({ message: 'Bu kullanıcı adı zaten kayıtlı.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword]);

    res.status(201).json({ message: 'Kayıt başarılı!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});


const SECRET_KEY = 'gizli_anahtar'; // Gerçek projede .env ile saklanmalı

app.post('/login', async (req, res) => {
  try {
    console.log("Login denemesi geldi:", req.body);

    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Kullanıcı adı ve şifre gerekli' });
    }

    const [results] = await db.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (results.length === 0) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı' });
    }

    const user = results[0];
    console.log("Kullanıcı bulundu:", user);

    const isPasswordCorrect = bcrypt.compareSync(password, user.password);
    console.log("Şifre doğru mu?", isPasswordCorrect);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Hatalı şifre' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      SECRET_KEY,
      { expiresIn: '1h' }
    );

    return res.json({ message: 'Giriş başarılı', token });
  } catch (err) {
    console.error("Sunucu hatası:", err);
    return res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
});


// Sunucuyu başlat
app.listen(3000, () => {
  console.log('Sunucu 3000 portunda çalışıyor');
});


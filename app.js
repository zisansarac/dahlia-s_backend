require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');


const ordersRoutes = require('./routes/orders');
const authRoutes = require('./routes/auth');
const googleAuthRoutes = require('./routes/googleAuth');
const userRoutes = require('./routes/user');
const womenMapRoutes = require('./routes/womenMap');
const communityRoutes = require('./routes/community');


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
app.use('/api/orders', ordersRoutes);

app.use('/api/auth', authRoutes);

app.use('/api', googleAuthRoutes);

app.use('/api/user', userRoutes);

app.use('/upload', express.static(path.join(__dirname, 'upload')));

// app.use('/profile', userRoutes);

// app.use('/update-profile', userRoutes);


app.use('/api', womenMapRoutes);

app.use('/api/community', communityRoutes);



//app.use('/api/auth/reset-password/:token', authRoutes);

// POST http://localhost:3000/api/auth/reset-password/:token


app.delete('api/orders/:id', (req, res) => {
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

app.put('/orders/:id', async (req, res) => {
  const orderId = req.params.id;
  const { product_name, customer_name, status } = req.body;

  console.log("Güncellenecek order ID:", orderId);
  console.log("Yeni bilgiler:", req.body);

  try {
    const [result] = await db.query(
      'UPDATE orders SET product_name = ?, customer_name = ?, status = ? WHERE id = ?',
      [product_name, customer_name, status, orderId]
    );

    if (result.affectedRows === 1) {
      res.status(200).json({ message: 'Güncelleme başarılı' });
    } else {
      res.status(404).json({ message: 'Sipariş bulunamadı' });
    }
  } catch (error) {
    console.error('Güncelleme hatası:', error);
    res.status(500).json({ error: 'Sunucu hatası' });
  }
});


app.post('/register', async (req, res) => {
  const { username, email, password, isFemaleEntrepreneur } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Tüm alanlar zorunludur.' });
  }

  try {
    // Email veya kullanıcı adı kayıtlı mı kontrol et (ikisini de kontrol ediyoruz)
    const [existingUser] = await db.query(
      'SELECT * FROM users WHERE email = ? OR username = ?',
      [email, username]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({ message: 'Bu e-posta veya kullanıcı adı zaten kayıtlı.' });
    }

    // Şifreyi hashle
    const hashedPassword = await bcrypt.hash(password, 10);

    // Veritabanına kaydet
    await db.query(
  'INSERT INTO users (username, email, password, is_female_entrepreneur) VALUES (?, ?, ?, ?)',
  [username, email, hashedPassword, isFemaleEntrepreneur ? 1 : 0]
);

    res.status(201).json({ message: 'Kayıt başarılı!' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});



app.post('/login', async (req, res) => {
  try {
    console.log("Login denemesi geldi:", req.body);

    const { username, password, isFemaleEntrepreneur } = req.body;

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
    const isPasswordCorrect = bcrypt.compareSync(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({ error: 'Hatalı şifre' });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // 👇 is_female_entrepreneur bilgisi de gönderiliyor artık!
    return res.json({
      message: 'Giriş başarılı',
      token,
      username: user.username,
      user_id: user.id,
      is_female_entrepreneur: user.is_female_entrepreneur === 1
    });

  } catch (err) {
    console.error("Sunucu hatası:", err);
    return res.status(500).json({ error: 'Sunucu hatası oluştu' });
  }
});

// Sunucuyu başlat
app.listen(3000, '0.0.0.0', () => {
  console.log('Server listening on port 3000');
});


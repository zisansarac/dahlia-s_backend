const db = require('../db');

// Tüm siparişleri getir
exports.getAllOrders = async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Yeni sipariş oluştur
exports.createOrder = async (req, res) => {
  try {
    const { customer_name, product_name, price, address, cargo_company, tracking_number } = req.body;
    await db.query(
      'INSERT INTO orders (customer_name, product_name, price, address, cargo_company, tracking_number) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_name, product_name, price, address, cargo_company, tracking_number]
    );
    res.status(201).json({ message: 'Sipariş oluşturuldu' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Sipariş durumu güncelle
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ message: 'Durum güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Siparişi sil
exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ message: 'Sipariş silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

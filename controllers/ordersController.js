const db = require('../db');

// Tüm siparişleri getir (kullanıcıya özel)
exports.getAllOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const [rows] = await db.query('SELECT * FROM orders WHERE user_id = ?', [userId]);

    const formattedOrders = rows.map(order => {
      const createdAt = new Date(order.created_at);
      return {
        ...order,
        date: createdAt.toISOString().split('T')[0], // yyyy-mm-dd
        time: createdAt.toTimeString().split(' ')[0].slice(0, 5), // hh:mm
      };
    });

    res.json(formattedOrders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};



exports.createOrder = async (req, res) => {
  try {
    const {
      customer_name,
      product_name,
      price,
      address,
      cargo_company,
      tracking_number,
      status // Bunu da aldık
    } = req.body;

    const userId = req.user.id;

    await db.query(
      `INSERT INTO orders (
        customer_name, product_name, price, address,
        cargo_company, tracking_number, status, user_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        customer_name,
        product_name,
        price,
        address,
        cargo_company,
        tracking_number,
        status, 
        userId
      ]
    );

    res.status(201).json({ message: 'Sipariş oluşturuldu' });
  } catch (error) {
    console.error('Sipariş oluşturma hatası:', error);
    res.status(500).json({ error: error.message });
  }
};



// Sipariş durumu güncelle (sadece kendi siparişine izin ver)
exports.updateOrderStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    const [result] = await db.query(
      'UPDATE orders SET status = ? WHERE id = ? AND user_id = ?',
      [status, id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: 'Bu siparişi güncelleme yetkiniz yok.' });
    }

    res.json({ message: 'Durum güncellendi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const {
      customer_name,
      product_name,
      price,
      address,
      cargo_company,
      tracking_number,
      status  
    } = req.body;

    const [result] = await db.query(
      `UPDATE orders SET
        customer_name = ?, product_name = ?, price = ?, address = ?,
        cargo_company = ?, tracking_number = ?, status = ?
        WHERE id = ? AND user_id = ?`,
      [
        customer_name,
        product_name,
        price,
        address,
        cargo_company,
        tracking_number,
        status,   
        id,
        userId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: 'Güncelleme yetkiniz yok.' });
    }

    res.json({ message: 'Sipariş güncellendi.' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


// Siparişi sil (sadece kendi siparişine izin ver)
exports.deleteOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const [result] = await db.query(
      'DELETE FROM orders WHERE id = ? AND user_id = ?',
      [id, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(403).json({ message: 'Bu siparişi silme yetkiniz yok.' });
    }

    res.json({ message: 'Sipariş silindi' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

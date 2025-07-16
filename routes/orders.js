const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');

// Tüm siparişleri getir
router.get('/', ordersController.getAllOrders);

// Yeni sipariş oluştur
router.post('/', ordersController.createOrder);

// Sipariş durumu güncelle
router.put('/:id', ordersController.updateOrderStatus);

// Siparişi sil
router.delete('/:id', ordersController.deleteOrder);

module.exports = router;

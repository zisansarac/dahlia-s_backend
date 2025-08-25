const express = require('express');
const router = express.Router();
const ordersController = require('../controllers/ordersController');
const verifyToken = require('../middleware/auth'); // <-- bu eklendi

// Sadece giriş yapan kullanıcılar erişebilsin:
router.get('/', verifyToken, ordersController.getAllOrders);
router.post('/', verifyToken, ordersController.createOrder);
router.put('/:id', verifyToken, ordersController.updateOrderStatus);
router.put('/update/:id', verifyToken, ordersController.updateOrder);

router.delete('/:id', verifyToken, ordersController.deleteOrder);

module.exports = router;

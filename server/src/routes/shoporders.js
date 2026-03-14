const express = require('express');
const router = express.Router();
const { getShopProducts, updateOrderStatus } = require('../controllers/shopordersController');
const authMiddleware = require('../middleware/authmiddleware');

router.get('/:shopId', getShopProducts);
router.patch('/:id/status', authMiddleware, updateOrderStatus);

module.exports = router;

const express = require('express');
const router = express.Router();
const { addToCart, getCart, removeFromCart, updateQuantity } = require('../controllers/cartController');

router.post('/add', addToCart);           // POST   /api/cart/add
router.get('/:userId', getCart);          // GET    /api/cart/:userId
router.delete('/remove', removeFromCart); // DELETE /api/cart/remove
router.patch('/update', updateQuantity);  // PATCH  /api/cart/update

module.exports = router;
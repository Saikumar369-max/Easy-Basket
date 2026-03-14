const express = require('express');
const router = express.Router();
const { getProducts, getProductById, getproductByCategoryId, getproductByshopId } = require('../controllers/productController');

// Mounted at /api/products in app.js
router.get('/', getProducts);              // GET /api/products
router.get('/category/:id', getproductByCategoryId);  // GET /api/products/category/:id  (must be before /:id)
router.get('/shop/:id', getproductByshopId);       // GET /api/products/shop/:id
router.get('/:id', getProductById);           // GET /api/products/:id

module.exports = router;

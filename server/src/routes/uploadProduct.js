const addProduct = require('../controllers/addPoductController');
const upload = require('../middleware/upload');
const authMiddleware = require('../middleware/authmiddleware');
const express = require('express');
const router = express.Router();

router.post('/add-product', authMiddleware, upload.single('image'), addProduct.addProduct);

module.exports = router;
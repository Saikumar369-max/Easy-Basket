const express = require('express');
const router = express.Router();

const { getCategories, getCategoryById } = require('../controllers/categoryController');

// Mounted at /api/categories in app.js
router.get('/', getCategories);      // GET /api/categories
router.get('/:id', getCategoryById);   // GET /api/categories/:id

module.exports = router;
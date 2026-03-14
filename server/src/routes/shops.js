const express = require('express');
const router = express.Router();
const {
    getShops,
    getShopById,
    getMyShop,
} = require('../controllers/shopsController');
const authMiddleware = require('../middleware/authmiddleware');

router.get('/', getShops);              
router.get('/my-shop', authMiddleware, getMyShop); 
router.get('/:id', getShopById);         

module.exports = router;

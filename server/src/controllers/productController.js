const Product = require('../models/Product');   
const Category = require('../models/Category');
const Shop = require('../models/Shop');
const {client : redis} = require('../config/redis');


// GET /api/products
const getProducts = async (req, res) => {
    try {
        const products = await Product.find({ isActive: { $ne: false } });
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/:id
const getProductById = async (req, res) => {
    try {
        const key = `product:${req.params.id}`;
        let cachedProduct = null;
        try {
            if(redis.isOpen) {
                cachedProduct = await redis.get(key);
            }    
        }
        catch(err) {
            console.log("redis error");
        }
        if (cachedProduct) {
            return res.status(200).json(JSON.parse(cachedProduct));
        }
        const foundProduct = await Product.findById(req.params.id); // fixed: renamed to avoid shadowing
        if (!foundProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }
        if(redis.isOpen) {
            await redis.setEx(key, 60 * 5, JSON.stringify(foundProduct));
        }
        res.status(200).json(foundProduct);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/category/:id
const getproductByCategoryId = async (req, res) => {
    try {
        const key = `category:${req.params.id}`;
        let cachedProducts = null;
        try {
            if(redis.isOpen) {
                cachedProducts = await redis.get(key);
            }
        }
        catch(err) {
            console.log("redis error");
        }
        if(cachedProducts) {
            return res.status(200).json(JSON.parse(cachedProducts));
        }
        const products = await Product.find({ categoryId: req.params.id, isActive: { $ne: false } });
        if(redis.isOpen) {
            await redis.setEx(key,60 * 5,JSON.stringify(products));
        }
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/products/shop/:id
const getproductByshopId = async (req, res) => {
    try {
        const key = `shop:${req.params.id}`;
        let cachedProducts = null;
        try {
            if(redis.isOpen) {
                cachedProducts = await redis.get(key);
            }
        }
        catch(err) {
            console.log("redis error");
        }
        if(cachedProducts) {
            return res.status(200).json(JSON.parse(cachedProducts));
        }
        const products = await Product.find({ shopId: req.params.id, isActive: { $ne: false } });
        if(redis.isOpen) {
            await redis.setEx(key,60 * 5,JSON.stringify(products));
        }
        res.status(200).json(products);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getProducts,
    getProductById,
    getproductByCategoryId,
    getproductByshopId
};

const upload = require('../middleware/upload');
const cloudinary = require('../config/cloudinary');
const Product = require('../models/Product');

const addProduct = async (req, res) => {
    try {
        const { name, description, shortDescription, price, categoryId, stock, shopId: bodyShopId } = req.body;
        const image = req.file;

        if (!image) {
            return res.status(400).json({ message: 'Product image is required' });
        }
        
        const shopId = bodyShopId || req.user?.id;

        const dataUri = `data:${image.mimetype};base64,${image.buffer.toString('base64')}`;
        const result = await cloudinary.uploader.upload(dataUri, {
            folder: 'products',
            resource_type: 'image',
            public_id: `product-${shopId}-${Date.now()}`
        });

        let parsedPrice = price;
        let parsedStock = stock;
        if (typeof price === 'string') {
            try { parsedPrice = JSON.parse(price); } catch (_) { parsedPrice = {}; }
        }
        if (typeof stock === 'string') {
            try { parsedStock = JSON.parse(stock); } catch (_) { parsedStock = {}; }
        }

        const product = new Product({
            name,
            description,
            shortDescription,
            price: parsedPrice,
            categoryId,
            stock: parsedStock,
            image: {
                url: result.secure_url,
                public_id: result.public_id
            },
            shopId
        });

        await product.save();
        res.status(201).json({ message: 'Product added successfully', product });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addProduct };
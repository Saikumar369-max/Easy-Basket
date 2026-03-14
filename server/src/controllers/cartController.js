const Cart = require('../models/Cart');
const Product = require('../models/Product');

// POST /api/cart/add
const addToCart = async (req, res) => {
    try {
        let { userId, productId, shopId, quantity = 1 } = req.body;
        if (!userId || !productId) {
            return res.status(400).json({ message: 'userId and productId are required' });
        }

        
        const product = await Product.findById(productId);
        if (!product) return res.status(404).json({ message: 'Product not found' });

       
        if (!shopId) shopId = product.shopId?.toString();
        if (!shopId) {
            return res.status(400).json({ message: 'shopId could not be determined for this product' });
        }

        const price = product.price?.sellingprice || 0;
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({
                userId,
                items: [{ productId, shopId, quantity }],
                totalAmount: price * quantity
            });
            await cart.save();
            return res.status(201).json({ message: 'Item added to cart successfully', cart });
        }

        const existingItem = cart.items.find(item => item.productId.toString() === productId);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            cart.items.push({ productId, shopId, quantity });
        }

        // Recalculate total
        cart.totalAmount = 0;
        for (let item of cart.items) {
            const prod = await Product.findById(item.productId);
            if (prod) {
                cart.totalAmount += (prod.price?.sellingprice || 0) * item.quantity;
            }
        }
        cart.updatedAt = Date.now();
        await cart.save();
        return res.status(200).json({ message: 'Item added to cart successfully', cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// GET /api/cart/:userId
const getCart = async (req, res) => {
    try {
        const { userId } = req.params;
        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart) {
            return res.status(200).json({ items: [], totalAmount: 0 });
        }
        return res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// DELETE /api/cart/remove
const removeFromCart = async (req, res) => {
    try {
        const { userId, productId } = req.body;
        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        cart.items = cart.items.filter(item => item.productId.toString() !== productId);

        // Recalculate total
        cart.totalAmount = 0;
        for (let item of cart.items) {
            const product = await Product.findById(item.productId);
            if (product) {
                cart.totalAmount += (product.price?.sellingprice || 0) * item.quantity;
            }
        }
        cart.updatedAt = Date.now();
        await cart.save();
        return res.status(200).json({ message: 'Item removed', cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// PATCH /api/cart/update
const updateQuantity = async (req, res) => {
    try {
        const { userId, productId, quantity } = req.body;
        if (quantity < 1) return res.status(400).json({ message: 'Quantity must be at least 1' });

        const cart = await Cart.findOne({ userId });
        if (!cart) return res.status(404).json({ message: 'Cart not found' });

        const item = cart.items.find(i => i.productId.toString() === productId);
        if (!item) return res.status(404).json({ message: 'Item not in cart' });

        item.quantity = quantity;

        // Recalculate total
        cart.totalAmount = 0;
        for (let i of cart.items) {
            const product = await Product.findById(i.productId);
            if (product) {
                cart.totalAmount += (product.price?.sellingprice || 0) * i.quantity;
            }
        }
        cart.updatedAt = Date.now();
        await cart.save();
        return res.status(200).json({ message: 'Quantity updated', cart });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { addToCart, getCart, removeFromCart, updateQuantity };
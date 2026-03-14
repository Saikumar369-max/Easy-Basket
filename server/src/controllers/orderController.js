const Cart = require('../models/Cart');
const Order = require('../models/Order');
const ShopOrder = require('../models/shoporders');


const placeOrder = async (req, res) => {
    try {
        const userId = req.user.id;

        const cart = await Cart.findOne({ userId }).populate('items.productId');
        if (!cart || !cart.items.length) {
            return res.status(400).json({ message: 'Cart is empty' });
        }

        const groupedByShop = cart.items.reduce((acc, item) => {
            if (!item.shopId) return acc;   
            const shopId = item.shopId.toString();
            if (!acc[shopId]) acc[shopId] = [];
            acc[shopId].push(item);
            return acc;
        }, {});

        if (Object.keys(groupedByShop).length === 0) {
            return res.status(400).json({ message: 'No valid items with shop info found in cart. Please re-add products.' });
        }

        for(const prod of cart.items){
            const product = await product.findById(prod.productId);
            if(product.stock.quantity < prod.quantity){
                return res.status(400).json({ message: 'Product out of stock', product : prod.productId});
            }
            product.stock.quantity -= prod.quantity;
            await product.save();
        }
        
        const overallTotal = cart.items.reduce((sum, item) => {
            const price = item.productId?.price?.sellingprice || 0;
            return sum + price * item.quantity;
        }, 0);

        const order = new Order({
            userId,
            items: cart.items.map(i => ({ productId: i.productId._id, quantity: i.quantity, shopId: i.shopId })),
            totalAmount: cart.totalAmount || overallTotal
        });
        await order.save();

        for (const shopId in groupedByShop) {
            const shopItems = groupedByShop[shopId];
            // Compute total using the populated product's selling price
            const shopTotal = shopItems.reduce((sum, item) => {
                const price = item.productId?.price?.sellingprice || 0;
                return sum + price * item.quantity;
            }, 0);

            const shopOrder = new ShopOrder({
                shopId,
                userId,
                items: shopItems.map(i => ({ productId: i.productId._id, quantity: i.quantity })),
                totalAmount: shopTotal
            });
            await shopOrder.save();
        }

        cart.items = [];
        cart.totalAmount = 0;
        cart.updatedAt = Date.now();
        await cart.save();

        return res.status(201).json({ message: 'Order placed successfully', order });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getOrders = async (req, res) => {
    try {
        const userId = req.user.id;
        const orders = await Order.find({ userId })
            .populate('items.productId')
            .sort({ createdAt: -1 });
        return res.status(200).json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { placeOrder, getOrders };
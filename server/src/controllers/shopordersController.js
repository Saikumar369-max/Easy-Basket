const shopOrder = require('../models/shoporders');


const getShopProducts = async (req, res) => {
    try {
        const shopId = req.params.shopId;
        const products = await shopOrder.find({ shopId })
            .populate({ path: 'items.productId', select: 'name price image' })
            .sort({ createdAt: -1 });
        res.status(200).json(products);
    }
    catch (err) {
        res.status(500).json({ message: err.message });
    }
};

const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const allowed = ['pending', 'completed', 'cancelled'];
        if (!allowed.includes(status)) {
            return res.status(400).json({ message: 'Invalid status value' });
        }
        const order = await shopOrder.findByIdAndUpdate(
            id,
            { status },
            { returnDocument: 'after' }
        );
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.status(200).json({ message: 'Status updated', order });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = { getShopProducts, updateOrderStatus };

const Shop = require('../models/Shop');


const getShops = async (req, res) => {
    try {
        const shops = await Shop.find({ isActive: true })
            .populate('ownerId', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: shops.length,
            data: shops
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getShopById = async (req, res) => {
    try {
        const shop = await Shop.findById(req.params.id)
            .populate('ownerId', 'name email');

        if (!shop) {
            return res.status(404).json({ message: 'Shop not found' });
        }

        res.status(200).json({ success: true, data: shop });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


const getMyShop = async (req, res) => {
    try {
        const shop = await Shop.findOne({ ownerId: req.user.id });
        if (!shop) {
            return res.status(404).json({ message: 'No shop found for this owner' });
        }
        res.status(200).json({ success: true, data: shop });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getShops, getShopById, getMyShop };

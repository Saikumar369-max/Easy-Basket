const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const authRoutes = require('./routes/auth.routes');
const productRoutes = require('./routes/products');
const shopRoutes = require('./routes/shops');
const categoryRoutes = require('./routes/category');
const cartRoutes = require('./routes/Cart');
const orderRoutes = require('./routes/order');
const profileRoutes = require('./routes/profile');
const shopOrderRoutes = require('./routes/shoporders');
const uploadProducts = require('./routes/uploadProduct');
const authMiddleware = require('./middleware/authmiddleware');

const app = express();


app.use(cors({
    origin: [
        'http://localhost:5173',
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:5501',
        'http://127.0.0.1:5501',
        'http://localhost:3000',
        'http://127.0.0.1:3000',
    ],
    credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ── Routes ─────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/profile', authMiddleware, profileRoutes);
app.use('/api/shoporders', shopOrderRoutes);
app.use('/api/uploadProducts', uploadProducts);

// ── Health Check ────────────────────────────────────────
app.get('/', (req, res) => {
    res.json({ message: '🛒 Easy Basket API is running' });
});


app.use((req, res) => {
    res.status(404).json({ message: 'Route not found' });
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message || 'Internal Server Error',
    });
});

module.exports = app;

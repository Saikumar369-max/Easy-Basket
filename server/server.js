require('dotenv').config({ path: './server/.env' });
const app = require('./src/app');
const connectDB = require('./src/config/db');
const {connectredis} = require('./src/config/redis');

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start server
connectDB().then(() => {
    connectredis();
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
});

const redis = require('redis');

const client = redis.createClient({
    url: "redis://localhost:6379",
    socket: {
        reconnectStrategy: false        // stops infinite retry
    }
});

client.on("error", (err) => {
    console.log("Redis client error");
});

connectredis = async () => {
    try {
        await client.connect();
        console.log("redis connected");
    }
    catch(err) {
        console.log("redis not connected");
    }
};

module.exports = {client,connectredis};

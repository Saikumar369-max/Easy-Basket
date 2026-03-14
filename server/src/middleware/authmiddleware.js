const jwt = require('jsonwebtoken');
const authMiddleware = async(req,res,next)=> {
    try {
        const authHeader = req.headers.authorization;
        if(!authHeader) {
            return res.status(400).json({message : "No token"});
        }
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token,process.env.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch(error){
        res.status(400).json({message : error.message});
    }
} 

module.exports = authMiddleware;
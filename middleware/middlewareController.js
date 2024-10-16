const jwt = require('jsonwebtoken');
require("dotenv").config();

const middleware = {
    verifyToken: (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Bạn cần Login' });
        }
        try {
            jwt.verify(token, process.env.JWT_ACCESS_KEY, (err, user) => {
                if (err) {
                    return res.status(403).json({ error: 'Bạn không có quyền' });
                }
                req.user = user;
                next();
            });
        } catch (error) {
            console.error(error);
            res.status(400).json({ error: 'Invalid Token' });
        }
    }
};



module.exports = middleware;

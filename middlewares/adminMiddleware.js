const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
    const userId = req.user.id; // Assuming user ID is stored in req.user
    const user = await User.findById(userId);

    if (!user || !user.isAdmin) {
        return res.status(403).json({ error: "Access denied. Admins only." });
    }

    next();
};

module.exports = adminMiddleware; 
const connectDB = require('../config/db');

const ensureDbConnected = async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (err) {
        console.error('Database connection failed in middleware:', err.message);
        res.status(500).json({ message: 'Database connection failed. Check MONGO_URI environment variable.' });
    }
};

module.exports = ensureDbConnected;

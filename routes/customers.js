const express = require('express');
const Customer = require('../models/Customer');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
    const { mobile } = req.query;
    if (!mobile) return res.status(400).json({ message: 'Mobile number is required' });

    try {
        const customer = await Customer.findOne({ mobile });
        if (!customer) return res.status(404).json({ message: 'Customer not found' });
        res.json(customer);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;

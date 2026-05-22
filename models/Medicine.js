const mongoose = require('mongoose');

const medicineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true
    },
    batchNumber: String,
    expiryDate: Date,
    price: {
        type: Number,
        required: true
    },
    gstPercent: {
        type: Number,
        default: 12
    },
});

module.exports = mongoose.model('Medicine', medicineSchema);
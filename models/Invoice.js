const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true, unique: true },
    date: { type: Date, default: Date.now },
    customer: {
        name: String,
        mobile: String,
        address: String,
    },
    items: [{
        medicineName: String,
        batchNumber: String,
        expiryDate: Date,
        quantity: Number,
        price: Number,
        gstPercent: Number,
        subtotal: Number,
        gstAmount: Number,
        total: Number,
    }],
    subtotal: Number,
    totalGst: Number,
    grandTotal: Number,
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
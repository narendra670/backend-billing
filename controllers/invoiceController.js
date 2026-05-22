const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { v4: uuidv4 } = require('uuid');

exports.createInvoice = async (req, res) => {
    try {
        const { customer, items } = req.body;

        let existingCustomer = await Customer.findOne({ mobile: customer.mobile });
        if (!existingCustomer) {
            existingCustomer = new Customer(customer);
            await existingCustomer.save();
        }

        const customerData = {
            name: existingCustomer.name,
            mobile: existingCustomer.mobile,
            address: existingCustomer.address,
        };

        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${uuidv4().slice(0, 4).toUpperCase()}`;

        let subtotal = 0, totalGst = 0;

        const processedItems = items.map(item => {
            const gstAmount = (item.price * item.quantity * item.gstPercent) / 100;
            const total = (item.price * item.quantity) + gstAmount;

            subtotal += item.price * item.quantity;
            totalGst += gstAmount;

            return { ...item, gstAmount, total };
        });

        const grandTotal = subtotal + totalGst;

        const invoice = new Invoice({
            invoiceNumber,
            customer: customerData,
            items: processedItems,
            subtotal,
            totalGst,
            grandTotal,
            user: req.user.id,
        });

        await invoice.save();
        res.status(201).json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
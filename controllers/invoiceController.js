const Invoice = require('../models/Invoice');
const Customer = require('../models/Customer');
const { v4: uuidv4 } = require('uuid');

exports.createInvoice = async (req, res) => {
    try {
        const { customer, items } = req.body;

        if (!customer || !customer.name || !customer.mobile) {
            return res.status(400).json({ message: 'Customer name and mobile are required' });
        }

        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'At least one item is required' });
        }

        const customerFields = { name: customer.name, mobile: customer.mobile, address: customer.address || '' };

        let existingCustomer = await Customer.findOne({ mobile: customerFields.mobile });
        if (!existingCustomer) {
            existingCustomer = new Customer(customerFields);
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
        console.error('Create invoice error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find({ user: req.user.id })
            .sort({ createdAt: -1 });
        res.json(invoices);
    } catch (err) {
        console.error('Get invoices error:', err);
        res.status(500).json({ message: err.message });
    }
};

exports.getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id);
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });
        res.json(invoice);
    } catch (err) {
        console.error('Get invoice by ID error:', err);
        res.status(500).json({ message: err.message });
    }
};
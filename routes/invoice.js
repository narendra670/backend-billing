// routes/invoice.js
const express = require('express');
const { createInvoice, getInvoices, getInvoiceById } = require('../controllers/invoiceController');
const { searchMedicines } = require('../controllers/getMedicine');
const { generateInvoicePDF } = require('../controllers/pdfController');
const auth = require('../middleware/auth');

const router = express.Router();

// Invoice Routes
router.post('/', auth, createInvoice);
router.get('/', auth, getInvoices);
router.get('/medicines/search', auth, searchMedicines);
router.get('/:id/pdf', auth, generateInvoicePDF);
router.get('/:id', auth, getInvoiceById);

module.exports = router;





















// const express = require('express');
// const { createInvoice, getInvoices, getInvoiceById } = require('../controllers/invoiceController');
// const auth = require('../middleware/auth');
// const { getMedicineList } = require('../controllers/getMedicine');
// const router = express.Router();

// router.post('/', auth, createInvoice);
// router.get('/', auth, getInvoices);
// router.get('/:id', auth, getInvoiceById);
// router.get("/getMedicineList", getMedicineList);

// module.exports = router;
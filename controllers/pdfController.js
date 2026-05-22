const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const Invoice = require('../models/Invoice');

exports.generateInvoicePDF = async (req, res) => {
    try {
        const { id: invoiceId } = req.params;
        const invoice = await Invoice.findById(invoiceId);

        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }

        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([595.28, 841.89]);
        const { width, height } = page.getSize();
        const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
        const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

        const fontSize = 12;
        const smallFontSize = 10;
        const margin = 50;
        let yPosition = height - margin;

        const drawText = (text, x, y, size = fontSize, fnt = font, color = rgb(0, 0, 0), options = {}) => {
            const textWidth = fnt.widthOfTextAtSize(String(text), size);
            const align = options.align || 'left';
            const finalX = align === 'right' ? x - textWidth : x;
            page.drawText(String(text), { x: finalX, y, size, font: fnt, color });
        };

        // Header
        drawText('SHREE GANESH MEDICAL STORE', margin, yPosition, 20, boldFont, rgb(0.1, 0.3, 0.7));
        yPosition -= 20;
        drawText('Lucknow, Uttar Pradesh', margin, yPosition, smallFontSize, font, rgb(0.3, 0.3, 0.3));
        drawText('GSTIN: 09ABCDE1234F1Z5 • Phone: +91 98765 43210', margin, yPosition - 15, smallFontSize, font, rgb(0.3, 0.3, 0.3));

        // INVOICE title on right
        drawText('INVOICE', width - margin - 120, yPosition + 20, 28, boldFont, rgb(0.1, 0.3, 0.7));
        drawText(`#${invoice.invoiceNumber}`, width - margin - 120, yPosition, smallFontSize, font, rgb(0.3, 0.3, 0.3));

        const invoiceDate = invoice.date ? new Date(invoice.date) : new Date();
        const dateStr = invoiceDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
        drawText(`Date: ${dateStr}`, width - margin - 120, yPosition - 15, smallFontSize, font, rgb(0.3, 0.3, 0.3));

        yPosition -= 50;

        // Line separator
        page.drawLine({
            start: { x: margin, y: yPosition },
            end: { x: width - margin, y: yPosition },
            thickness: 2,
            color: rgb(0.2, 0.2, 0.2),
        });

        yPosition -= 30;

        // Bill To and From sections
        drawText('Bill To', margin, yPosition, smallFontSize, boldFont, rgb(0.4, 0.4, 0.4));
        drawText('From', width - margin - 200, yPosition, smallFontSize, boldFont, rgb(0.4, 0.4, 0.4));

        yPosition -= 20;

        // Customer info (left)
        drawText(invoice.customer.name, margin, yPosition, fontSize, boldFont);
        yPosition -= 18;
        drawText(invoice.customer.mobile, margin, yPosition, smallFontSize);
        yPosition -= 18;
        if (invoice.customer.address) {
            drawText(invoice.customer.address, margin, yPosition, smallFontSize);
        }

        // From info (right)
        let fromY = yPosition + 38;
        drawText('Shree Ganesh Medical Store', width - margin - 200, fromY, fontSize, boldFont);
        fromY -= 18;
        drawText('Near Charbagh Railway Station, Lucknow', width - margin - 200, fromY, smallFontSize);
        fromY -= 18;
        drawText('Uttar Pradesh - 226001', width - margin - 200, fromY, smallFontSize);

        yPosition -= 60;

        // Items table
        const headers = ['Medicine', 'Batch', 'Expiry', 'Qty', 'Price', 'GST%', 'Amount'];
        const colWidths = [150, 60, 70, 40, 60, 50, 75];
        let xPosition = margin;

        // Table header background
        page.drawRectangle({
            x: margin,
            y: yPosition - 5,
            width: width - 2 * margin,
            height: 30,
            color: rgb(0.95, 0.95, 0.95),
        });

        page.drawLine({
            start: { x: margin, y: yPosition - 5 },
            end: { x: width - margin, y: yPosition - 5 },
            thickness: 2,
            color: rgb(0.2, 0.2, 0.2),
        });

        headers.forEach((header, i) => {
            const align = (i >= 3) ? { x: xPosition + colWidths[i] - 5, align: 'right' } : { x: xPosition + 5 };
            drawText(header, align.x, yPosition + 5, smallFontSize, boldFont, rgb(0, 0, 0), align);
            xPosition += colWidths[i];
        });

        yPosition -= 30;

        // Draw items
        invoice.items.forEach((item, index) => {
            xPosition = margin;
            const amount = item.total ? Number(item.total).toFixed(2) :
                ((Number(item.price) || 0) * (Number(item.quantity) || 0) * (1 + (Number(item.gstPercent) || 0) / 100)).toFixed(2);

            const expiryStr = item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('en-IN', { month: '2-digit', year: '2-digit' }) : '-';

            const values = [
                item.medicineName,
                item.batchNumber || '-',
                expiryStr,
                String(item.quantity),
                `Rs.${(Number(item.price) || 0).toFixed(2)}`,
                `${Number(item.gstPercent) || 0}%`,
                `Rs.${amount}`
            ];

            values.forEach((value, i) => {
                const isRight = (i >= 3);
                const x = isRight ? xPosition + colWidths[i] - 5 : xPosition + 5;
                drawText(value, x, yPosition + 5, smallFontSize, font, rgb(0, 0, 0), isRight ? { align: 'right' } : {});
                xPosition += colWidths[i];
            });

            yPosition -= 25;

            // Line separator between items
            page.drawLine({
                start: { x: margin, y: yPosition + 10 },
                end: { x: width - margin, y: yPosition + 10 },
                thickness: 0.5,
                color: rgb(0.85, 0.85, 0.85),
            });
        });

        yPosition -= 20;

        // Totals section (right aligned to the right margin)
        const totalsWidth = 220;
        const totalsX = width - margin - totalsWidth;
        const valueX = width - margin - 10;

        drawText('Subtotal', totalsX, yPosition, smallFontSize, font);
        drawText(`Rs.${(Number(invoice.subtotal) || 0).toFixed(2)}`, valueX, yPosition, smallFontSize, font, rgb(0, 0, 0), { align: 'right' });
        yPosition -= 25;

        page.drawLine({
            start: { x: totalsX, y: yPosition + 15 },
            end: { x: width - margin, y: yPosition + 15 },
            thickness: 1,
            color: rgb(0.7, 0.7, 0.7),
        });

        drawText('Total GST', totalsX, yPosition, smallFontSize, font);
        drawText(`Rs.${(Number(invoice.totalGst) || 0).toFixed(2)}`, valueX, yPosition, smallFontSize, font, rgb(0, 0, 0), { align: 'right' });
        yPosition -= 30;

        page.drawLine({
            start: { x: totalsX, y: yPosition + 15 },
            end: { x: width - margin, y: yPosition + 15 },
            thickness: 2,
            color: rgb(0.2, 0.2, 0.2),
        });

        drawText('Grand Total', totalsX, yPosition, 14, boldFont, rgb(0.1, 0.3, 0.7));
        drawText(`Rs.${(Number(invoice.grandTotal) || 0).toFixed(2)}`, valueX, yPosition, 14, boldFont, rgb(0.1, 0.3, 0.7), { align: 'right' });

        yPosition -= 60;

        // Footer
        drawText('Thank you for your purchase! • Medicines are non-returnable after sale.', margin, yPosition, smallFontSize, font, rgb(0.5, 0.5, 0.5));
        yPosition -= 15;
        drawText('This is a computer-generated invoice. No signature required.', margin, yPosition, smallFontSize, font, rgb(0.5, 0.5, 0.5));

        const pdfBytes = await pdfDoc.save();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=Invoice_${invoice.invoiceNumber}.pdf`);
        res.send(Buffer.from(pdfBytes));
    } catch (err) {
        console.error('PDF Generation Error:', err);
        res.status(500).json({ message: 'Failed to generate PDF' });
    }
};

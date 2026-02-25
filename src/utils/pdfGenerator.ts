
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import JsBarcode from 'jsbarcode';
import { FirestoreTrackingItem } from '@/lib/firestore-schema';

export const generateReceiptPDF = async (tracking: FirestoreTrackingItem) => {
    const doc = new jsPDF();

    // Colors
    const primaryColor = '#4a00a0'; // FedEx Purple-ish
    const secondaryColor = '#ff6200'; // FedEx Orange-ish
    const date = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();
    const deliveryDate = tracking.estimatedDeliveryDate
        ? new Date(tracking.estimatedDeliveryDate.seconds * 1000).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()
        : 'PENDING';

    // --- Header ---
    // Logo
    try {
        const logoImg = new Image();
        logoImg.src = '/img/logo.png';
        await new Promise((resolve) => {
            logoImg.onload = resolve;
            logoImg.onerror = resolve; // Continue even if logo fails
        });
        // Assuming standard aspect ratio, adjust as needed
        doc.addImage(logoImg, 'PNG', 15, 10, 50, 20); // x, y, w, h
    } catch (e) {
        console.warn('Logo not found or failed to load');
        doc.setFontSize(24);
        doc.setTextColor(primaryColor);
        doc.text('FedEx', 15, 25);
        doc.setTextColor(secondaryColor);
        doc.text('Express', 45, 25);
    }

    // --- From / To Section ---
    doc.setDrawColor(0);
    doc.setLineWidth(0.1);

    const startY = 40;

    // Vertical Divider
    doc.line(105, startY, 105, startY + 50);

    // Left Column (From)
    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text('From', 15, startY + 5);

    doc.setFontSize(8);
    doc.text('ORIGIN', 15, startY + 15);
    doc.setFontSize(10);
    doc.text(tracking.sender.address.country.toUpperCase(), 95, startY + 15, { align: 'right' });

    doc.setFontSize(8);
    doc.text('SENDER', 15, startY + 25);
    doc.setFontSize(10);
    doc.text(tracking.sender.name.toUpperCase(), 95, startY + 25, { align: 'right' });

    doc.setFontSize(8);
    doc.text('ADDRESS', 15, startY + 35);
    doc.setFontSize(9);
    const senderAddress = `${tracking.sender.address.street}\n${tracking.sender.address.city}`; // Simplified for fit
    doc.text(senderAddress, 95, startY + 35, { align: 'right', maxWidth: 50 });

    doc.setFontSize(8);
    doc.text('DEPARTURE DATE', 15, startY + 55);
    doc.setFontSize(10);
    doc.text(date, 95, startY + 55, { align: 'right' });

    // Right Column (To)
    const rightX = 115;
    const rightValueX = 195;

    doc.setFontSize(10);
    doc.text('To', rightX, startY + 5);

    doc.setFontSize(8);
    doc.text('Destination', rightX, startY + 15);
    doc.setFontSize(10);
    doc.text(tracking.recipient.address.country.toUpperCase(), rightValueX, startY + 15, { align: 'right' });

    doc.setFontSize(8);
    doc.text('Receiver', rightX, startY + 25);
    doc.setFontSize(10);
    doc.text(tracking.recipient.name.toUpperCase(), rightValueX, startY + 25, { align: 'right' });

    doc.setFontSize(8);
    doc.text('Address', rightX, startY + 35);
    doc.setFontSize(9);
    const recipientAddress = `${tracking.recipient.address.street}\n${tracking.recipient.address.city} ${tracking.recipient.address.postalCode}`;
    doc.text(recipientAddress, rightValueX, startY + 35, { align: 'right', maxWidth: 50 });

    doc.setFontSize(8);
    doc.text('Arrival', rightX, startY + 55);
    doc.setFontSize(10);
    doc.text(deliveryDate, rightValueX, startY + 55, { align: 'right' });


    // --- Horizontal Line ---
    doc.line(10, startY + 60, 200, startY + 60);

    // --- Package Information ---
    const pkgY = startY + 70;
    doc.setFontSize(10);
    doc.text('Package Information', 15, pkgY);

    const colWidth = 45;

    // Headers
    doc.setFontSize(9);
    doc.text('Weight', 15, pkgY + 10);
    doc.text('Dimensions', 15 + colWidth, pkgY + 10);
    doc.text('Packaging', 15 + colWidth * 2, pkgY + 10);
    doc.text('Value', 15 + colWidth * 3, pkgY + 10);

    // Values
    doc.setFontSize(11);
    doc.setFont(undefined, 'bold');

    const weight = tracking.weight ? `${tracking.weight}kg` : '-';
    const dims = tracking.dimensions ? `${tracking.dimensions.length}x${tracking.dimensions.width}x${tracking.dimensions.height} cm` : '-';
    const pack = tracking.itemCategory || 'Package'; // Typo in reference image "Suit case" -> Package
    //   // Format value
    const value = tracking.itemValue
        ? `$${tracking.itemValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`
        : '-';

    doc.text(weight, 15, pkgY + 20);
    doc.text(dims, 15 + colWidth, pkgY + 20);
    doc.text(pack, 15 + colWidth * 2, pkgY + 20);
    doc.text(value, 15 + colWidth * 3, pkgY + 20);

    // --- Horizontal Line ---
    doc.line(10, pkgY + 30, 200, pkgY + 30);


    // --- Costs ---
    const costY = pkgY + 40;
    doc.setFont(undefined, 'normal');
    doc.setFontSize(10);

    const formatCurrency = (val: number | undefined) => val ? `$${val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '$0.00';

    // Standard Rate
    doc.text('Standard Rate', 15, costY);
    doc.setFont(undefined, 'bold');
    doc.text(formatCurrency(tracking.cost), 90, costY, { align: 'right' });

    // Taxes & Fees (VAT + Tax)
    const taxes = (tracking.vat || 0) + (tracking.tax || 0);
    doc.setFont(undefined, 'normal');
    const taxLabel = 'Taxes & Fees';
    doc.text(taxLabel, 15, costY + 8);
    doc.setFont(undefined, 'bold');
    doc.text(formatCurrency(taxes), 90, costY + 8, { align: 'right' });

    // Total Paid
    const total = (tracking.cost || 0) + taxes;
    doc.setFont(undefined, 'bold');
    doc.text('Total Paid', 15, costY + 18);
    doc.text(formatCurrency(total), 90, costY + 18, { align: 'right' });

    // --- Horizontal Line ---
    doc.line(10, costY + 25, 200, costY + 25);


    // --- Barcode ---
    try {
        const canvas = document.createElement('canvas');
        // Set reasonable initial dimensions
        canvas.width = 200;
        canvas.height = 100;

        JsBarcode(canvas, tracking.trackingId, {
            format: "CODE128",
            displayValue: false,
            lineColor: "#000",
            width: 2,
            height: 50,
            margin: 0
        });

        const barcodeDataUrl = canvas.toDataURL("image/png");
        if (barcodeDataUrl && barcodeDataUrl !== 'data:,') {
            doc.addImage(barcodeDataUrl, 'PNG', 15, costY + 35, 100, 20);
        } else {
            console.error('Barcode generation failed: empty data URL');
            doc.text('[Barcode Generation Failed]', 15, costY + 45);
        }
    } catch (err) {
        console.error('Error generating barcode:', err);
        // Fallback or visual indication
        doc.text(`[Barcode Error: ${tracking.trackingId}]`, 15, costY + 45);
    }

    // Tracking ID text
    doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
    doc.text(`TRK ID: ${tracking.trackingId}`, 15, costY + 62);


    // Save PDF
    doc.save(`receipt-${tracking.trackingId}.pdf`);
};

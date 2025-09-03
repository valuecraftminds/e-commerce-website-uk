const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const db = require('../../config/database');
const { generateInvoiceFileName } = require('../../utils/invoiceUtils');

// Helper function to fetch company details
const getCompanyDetails = (companyCode) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT company_name, company_address, company_phone, company_email
      FROM companies 
      WHERE company_code = ?
    `;
    
    db.query(query, [companyCode], (err, results) => {
      if (err) {
        console.error('Error fetching company details:', err);
        reject(err);
      } else if (results.length === 0) {
        reject(new Error(`Company not found for code: ${companyCode}`));
      } else {
        resolve(results[0]);
      }
    });
  });
};

// Helper function to fetch shipping address details
const getShippingAddressDetails = (addressId, companyCode) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT first_name, last_name, house, address_line_1, address_line_2, 
             city, state, country, postal_code, phone
      FROM address 
      WHERE address_id = ? AND company_code = ?
    `;
    
    db.query(query, [addressId, companyCode], (err, results) => {
      if (err) {
        console.error('Error fetching shipping address details:', err);
        reject(err);
      } else if (results.length === 0) {
        reject(new Error(`Shipping address not found for address_id: ${addressId}`));
      } else {
        resolve(results[0]);
      }
    });
  });
};

// Helper function to fetch customer billing address details
const getCustomerBillingDetails = (customerId, companyCode) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT c.first_name, c.last_name, c.email, c.phone
      FROM customers c
      WHERE c.customer_id = ? AND c.company_code = ?
    `;
    
    db.query(query, [customerId, companyCode], (err, results) => {
      if (err) {
        console.error('Error fetching customer billing details:', err);
        reject(err);
      } else if (results.length === 0) {
        reject(new Error(`Customer not found for customer_id: ${customerId}`));
      } else {
        resolve(results[0]);
      }
    });
  });
};

// Helper function to generate QR code for PDF
const generateQRCodeForPDF = async (url) => {
  try {
    const options = {
      errorCorrectionLevel: 'M',
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 120
    };

    // Generate QR code as buffer for PDF
    return await QRCode.toBuffer(url, options);
  } catch (error) {
    console.error('Error generating QR code for PDF:', error);
    return null;
  }
};

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    // For Gmail
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER, // Email
      pass: process.env.EMAIL_PASS  // App password
    }
    
    // Alternative for other SMTP services
    /*
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
    */
    });
    };

     // Send invoice email with order confirmation
    const sendInvoiceEmail = async (customerEmail, customerName, orderData, pdfBuffer, invoiceFileName, frontendUrl) => {
    try {
        const transporter = createTransporter();

        // Generate order details link
        const baseUrl = frontendUrl || 'http://localhost:3000';
        const orderDetailsLink = `${baseUrl}/orders/${orderData.orderId || orderData.order_id}?customer_id=${orderData.customer_id}&company_code=${orderData.company_code}`;

        // Combined email template for order confirmation and invoice
        const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Order confirmed!</h2>
        
        <p>Dear ${customerName},</p>
        
        <p>Thank you for your purchase! We have received your order and it is being processed. Please find your invoice attached to this email.</p>
        
        <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Order Summary</h3>
            ${orderData.orderNumber ? `<p><strong>Order Number:</strong> ${orderData.orderNumber}</p>` : ''}
            <p><strong>Order Date:</strong> ${new Date(orderData.orderDate).toLocaleDateString()}</p>
            <p><strong>Total Amount:</strong> $${orderData.totalAmount}</p>
        </div>
        
        <div style="background-color: #e8eaf8ff; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #2E5090;">
            <p style="margin: 0;"><strong>📋 Review your items:</strong> Check your order details and add reviews for your items!</p>
            <div style="margin-top: 10px;">
                <a href="${orderDetailsLink}" style="background-color: #2E5090; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">Add Review</a>
                <br>
                <p> You can return to your order details page anytime to review your items. </p>
            </div>
        </div>
        
        <p>If you have any questions about your order, please don't hesitate to contact us.</p>
        
        <p>Best regards,<br>
        ${orderData.company_name}</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666;">
            This is an automated message. Please do not reply to this email.
        </p>
        </div>
        `;

        // Email options
        const mailOptions = {
        from: {
            name: orderData.company_name,
            address: process.env.EMAIL_USER
        },
        to: customerEmail,
        subject: `Order Confirmed - #${orderData.orderNumber}`,
        html: emailTemplate,
        attachments: [
            {
            filename: invoiceFileName, 
            content: pdfBuffer,
            contentType: 'application/pdf'
            }
        ]
        };

        // Send email
        const info = await transporter.sendMail(mailOptions);
        console.log('Invoice email sent successfully');
        
        return {
        success: true,
        messageId: info.messageId
        };

    } catch (error) {
        console.error('Error sending invoice email:', error);
        return {
        success: false,
        error: error.message
        };
    }
    };

    // Generate and send invoice email with PDF attachment
    const generateAndSendInvoice = async (orderData, customerData, invoiceData, companyData, frontendUrl) => {
    try {
        const PDFDocument = require('pdfkit');

        // Fetch company details if not provided
        let companyInfo = companyData;
        if (!companyInfo && orderData.company_code) {
        try {
            companyInfo = await getCompanyDetails(orderData.company_code);
        } catch (companyError) {
            console.error('Failed to fetch company details:', companyError);
            // Use default fallback company info
            companyInfo = {
            company_name: '',
            company_address: '',
            company_phone: '',
            company_email: ''
            };
        }
    }

        // Fetch complete customer billing details
        let billingCustomerDetails = customerData;
        if (orderData.customer_id && orderData.company_code) {
            try {
                billingCustomerDetails = await getCustomerBillingDetails(orderData.customer_id, orderData.company_code);
                // Merge with existing customer data to preserve any additional fields
                billingCustomerDetails = { ...customerData, ...billingCustomerDetails };
            } catch (customerError) {
                console.error('Failed to fetch customer billing details:', customerError);
                // Use provided customer data as fallback
                billingCustomerDetails = customerData;
            }
        }

        // Fetch shipping address details
        let shippingAddressDetails = null;
        if (orderData.shippingAddress && orderData.shippingAddress.address_id) {
        try {
            shippingAddressDetails = await getShippingAddressDetails(orderData.shippingAddress.address_id, orderData.company_code);
        } catch (shippingError) {
            console.error('Failed to fetch shipping address:', shippingError);
            shippingAddressDetails = orderData.shippingAddress; // fallback to provided data
        }
        } else {
        shippingAddressDetails = orderData.shippingAddress;
        }

        // Create invoices directory if it doesn't exist - COMMENTED OUT TO PREVENT FILE STORAGE
        // const invoicesDir = path.join(__dirname, '../invoices');
        // if (!fs.existsSync(invoicesDir)) {
        //   fs.mkdirSync(invoicesDir, { recursive: true });
        // }

        // Use the invoice number passed from checkout controller
        const invoiceNumber = invoiceData.invoiceNumber;
        
        // Generate unique PDF filename using utility function
        const invoiceFileName = generateInvoiceFileName(orderData.orderNumber, invoiceNumber);
        
        // Generate PDF file path - COMMENTED OUT TO PREVENT FILE STORAGE
        // const invoiceFilePath = path.join(invoicesDir, invoiceFileName);

        // Create PDF document in memory
        const doc = new PDFDocument({ 
        size: 'A4', 
        margin: 50 
        });

        // Pipe PDF to file - COMMENTED OUT TO PREVENT FILE STORAGE
        // doc.pipe(fs.createWriteStream(invoiceFilePath));

        // Collect PDF buffer chunks
        const pdfBuffers = [];
        doc.on('data', (chunk) => {
            pdfBuffers.push(chunk);
        });

        // Generate PDF content with company information
        await generateInvoicePDFContent(doc, orderData, billingCustomerDetails, invoiceData, companyInfo, shippingAddressDetails, frontendUrl);

        // Finalize PDF
        doc.end();

        // Wait for PDF to be completed and get buffer
        // const pdfBuffer = await new Promise((resolve, reject) => {
        //     doc.on('end', resolve);
        //     doc.on('error', reject);
        // });
        const pdfBuffer = await new Promise((resolve, reject) => {
            doc.on('end', () => {
                const finalBuffer = Buffer.concat(pdfBuffers);
                resolve(finalBuffer);
            });
            doc.on('error', reject);
        });

        // Send email with PDF buffer attachment
        const emailResult = await sendInvoiceEmail(
        customerData.email,
        `${customerData.firstName} ${customerData.lastName}`,
        {
            ...orderData,
            company_name: companyInfo.company_name
        },
        pdfBuffer,
        invoiceFileName,
        frontendUrl
        );

        return {
        success: emailResult.success,
        // invoiceFilePath: invoiceFilePath, // COMMENTED OUT - NO FILE PATH SINCE NO FILE IS SAVED
        messageId: emailResult.messageId,
        invoiceNumber: invoiceNumber,
        error: emailResult.error
        };

    } catch (error) {
        console.error('Error generating and sending invoice:', error);
        return {
        success: false,
        error: error.message
        };
    }
    };

    // Helper function to generate PDF content for invoice
    const generateInvoicePDFContent = async (doc, orderData, customerData, invoiceData, companyInfo, shippingAddressDetails, frontendUrl) => {
    // Define colors
    const primaryColor = '#2E5090';
    const secondaryColor = '#E8F0FE';
    const textColor = '#333333';
    const lightGray = '#F5F5F5';
    
    // Page dimensions
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 30;
    const contentWidth = pageWidth - (margin * 2);
    
    // Generate QR code for order details link
    const baseUrl = frontendUrl || 'http://localhost:3000';
    const orderDetailsLink = `${baseUrl}/orders/${orderData.orderId || orderData.order_id}?customer_id=${orderData.customer_id}&company_code=${orderData.company_code}`;
    const qrCodeBuffer = await generateQRCodeForPDF(orderDetailsLink);
    
    // Header with company branding
    doc.rect(0, 0, pageWidth, 80).fill(primaryColor);
    
    // Invoice title
    doc.fillColor('white')
        .fontSize(28)
        .font('Helvetica-Bold')
        .text('INVOICE', margin, 25);
    
    // Company name on the right
    doc.fontSize(16)
        .text(companyInfo.company_name, pageWidth - 200, 30, { 
        width: 170, 
        align: 'right' 
        });
    
    // Invoice details box
    doc.fillColor(textColor)
        .fontSize(10)
        .font('Helvetica');
    
    // Reset Y position after header
    let currentY = 100;
    
    // Invoice information section
    doc.rect(margin, currentY, contentWidth, 60).fill(lightGray);
    
    // Invoice details - left side
    doc.fillColor(textColor)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('Invoice Number:', margin + 15, currentY + 15)
        .font('Helvetica')
        .text(invoiceData.invoiceNumber, margin + 100, currentY + 15);
    
    doc.font('Helvetica-Bold')
        .text('Invoice Date:', margin + 15, currentY + 30)
        .font('Helvetica')
        .text(new Date(invoiceData.invoiceDate).toLocaleDateString('en-GB'), margin + 100, currentY + 30);
    
    doc.font('Helvetica-Bold')
        .text('Order Number:', margin + 15, currentY + 45)
        .font('Helvetica')
        .text(orderData.orderNumber || orderData.orderId, margin + 100, currentY + 45);
    
    // Company details - right side
    let companyDetailsY = currentY + 15;
    const companyLineHeight = 12;
    
    if (companyInfo.company_address) {
        // Split address into multiple lines if too long
        const addressLines = companyInfo.company_address.split('\n');
        addressLines.forEach((line, index) => {
        if (line.trim()) {
            doc.fontSize(9)
            .fillColor(textColor)
            .text(line.trim(), pageWidth - 200, companyDetailsY + (index * companyLineHeight), { 
                width: 170, 
                align: 'right' 
            });
        }
        });
        companyDetailsY += (addressLines.length * companyLineHeight);
    }
    
    if (companyInfo.company_phone) {
        doc.fontSize(9)
        .text(`${companyInfo.company_phone}`, pageWidth - 200, companyDetailsY, { 
            width: 170, 
            align: 'right' 
        });
        companyDetailsY += companyLineHeight;
    }
    
    if (companyInfo.company_email) {
        doc.fontSize(9)
        .text(`${companyInfo.company_email}`, pageWidth - 200, companyDetailsY, { 
            width: 170, 
            align: 'right' 
        });
    }
    
    currentY += 80;
    
    // Bill To and Ship To section
    const billToX = margin;
    const shipToX = pageWidth / 2 + 10;
    const sectionWidth = (contentWidth - 20) / 2;
    const sectionHeight = 120; // Increased height to accommodate all address lines
    
    // Bill To section - Customer's details (logged in user)
    doc.rect(billToX, currentY, sectionWidth, sectionHeight).fill(secondaryColor);
    doc.fillColor(primaryColor)
        .fontSize(12)
        .font('Helvetica-Bold')
        .text('Billing Information', billToX + 10, currentY + 10);
    
    doc.fillColor(textColor)
        .fontSize(10)
        .font('Helvetica');
  
    // Billing address - logged in customer details
    let billY = currentY + 30;
    const billLineHeight = 12;
    
    // Customer name
    const customerName = `${customerData.firstName || customerData.first_name || ''} ${customerData.lastName || customerData.last_name || ''}`.trim();
    if (customerName) {
        doc.text(customerName, billToX + 10, billY, { width: sectionWidth - 20 });
        billY += billLineHeight;
    }
  
  // Email
  if (customerData.email) {
    doc.text(`Email: ${customerData.email}`, billToX + 10, billY, { width: sectionWidth - 20 });
    billY += billLineHeight;
  }
  
  // Phone
  if (customerData.phone) {
    doc.text(`Phone: ${customerData.phone}`, billToX + 10, billY, { width: sectionWidth - 20 });
  }
  
  // Ship To section - Selected shipping address from addresses table
  if (shippingAddressDetails) {
    doc.rect(shipToX, currentY, sectionWidth, sectionHeight).fill(secondaryColor);
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Shipping Address', shipToX + 10, currentY + 10);
    
    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica');
    
    let shipY = currentY + 30;
    const shipLineHeight = 12;
    
    // Name
    if (shippingAddressDetails.first_name || shippingAddressDetails.last_name) {
      doc.text(`${shippingAddressDetails.first_name || ''} ${shippingAddressDetails.last_name || ''}`.trim(), 
               shipToX + 10, shipY, { width: sectionWidth - 20 });
      shipY += shipLineHeight;
    }
    
    // House/Building
    if (shippingAddressDetails.house) {
      doc.text(shippingAddressDetails.house, shipToX + 10, shipY, { width: sectionWidth - 20 });
      shipY += shipLineHeight;
    }
    
    // Address line 1
    if (shippingAddressDetails.address_line_1) {
      doc.text(shippingAddressDetails.address_line_1, shipToX + 10, shipY, { width: sectionWidth - 20 });
      shipY += shipLineHeight;
    }
    
    // Address line 2
    if (shippingAddressDetails.address_line_2) {
      doc.text(shippingAddressDetails.address_line_2, shipToX + 10, shipY, { width: sectionWidth - 20 });
      shipY += shipLineHeight;
    }
    
    // City, State on one line
    let cityStateLine = '';
    if (shippingAddressDetails.city) cityStateLine += shippingAddressDetails.city;
    if (shippingAddressDetails.state) cityStateLine += (cityStateLine ? ', ' : '') + shippingAddressDetails.state;

    if (cityStateLine) {
        doc.text(cityStateLine, shipToX + 10, shipY, { width: sectionWidth - 20 });
        shipY += shipLineHeight;
    }
    
    // Postal code, Country
    let postalCountryLine = '';
    if (shippingAddressDetails.postal_code) postalCountryLine += shippingAddressDetails.postal_code;
    if (shippingAddressDetails.country) postalCountryLine += (postalCountryLine ? ', ' : '') + shippingAddressDetails.country;

    if (postalCountryLine) {
      doc.text(postalCountryLine, shipToX + 10, shipY, { width: sectionWidth - 20 });
      shipY += shipLineHeight;
    }
    
    // Phone
    if (shippingAddressDetails.phone) {
        doc.text(`Phone: ${shippingAddressDetails.phone}`, shipToX + 10, shipY, { width: sectionWidth - 20 });
    }
  } else {
    // Same as billing address if no separate shipping address
    doc.rect(shipToX, currentY, sectionWidth, sectionHeight).fill(secondaryColor);
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Shipping Address', shipToX + 10, currentY + 10);

    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica')
       .text('(Same as billing address)', shipToX + 10, currentY + 30, { width: sectionWidth - 20 });
  }

  currentY += sectionHeight + 20;
  
  // Items table
  const tableStartY = currentY;
 const tableHeaders = [
  { text: 'Item',     x: margin + 5,   width: 150, align: 'left' },
  { text: 'Size',     x: margin + 155, width: 40,  align: 'left' },
  { text: 'Color',    x: margin + 200, width: 60,  align: 'left' },
  { text: 'Qty',      x: margin + 260, width: 30,  align: 'right' },
  { text: 'Price',    x: margin + 290, width: 55,  align: 'right' },
  { text: 'Subtotal', x: margin + 365, width: 65,  align: 'right' }
];
  
  // Table header background
  const headerHeight = 30;
  doc.rect(margin, currentY, contentWidth, headerHeight).fill(primaryColor);
  
  // Table headers
  doc.fillColor('white')
     .fontSize(10)
     .font('Helvetica-Bold');
  
  tableHeaders.forEach(header => {
    doc.text(header.text, header.x + 5, currentY + 10, {
      width: header.width - 10, 
      align: header.text === 'Qty' || header.text === 'Price' || header.text === 'Total' ? 'right' : 'left' 
    });
  });
  
  currentY += headerHeight;
  
  // Table rows
  doc.fillColor(textColor)
     .fontSize(9)
     .font('Helvetica');
  
  let rowColor = true;
  const rowHeight = 25;
  const textPadding = 8;
  
  orderData.items.forEach((item, index) => {
    // Alternate row colors
    if (rowColor) {
      doc.rect(margin, currentY, contentWidth, rowHeight).fill('#FAFAFA');
    }
    
    // Item data
   doc.font('Helvetica').fillColor(textColor);
  doc.text(item.style_name || item.name || 'Product', margin + 5, currentY + textPadding, { width: 150, ellipsis: true });
  doc.text(item.size_name || 'N/A',   margin + 155, currentY + textPadding, { width: 40,  align: 'left' });
  doc.text(item.color_name || 'N/A',  margin + 200, currentY + textPadding, { width: 60,  ellipsis: true, align: 'left' });
  doc.text(item.quantity.toString(),  margin + 260, currentY + textPadding, { width: 30,  align: 'right' });
  doc.text(parseFloat(item.unit_price).toFixed(2), margin + 290, currentY + textPadding, { width: 55, align: 'right' });
  doc.text(parseFloat(item.total_price).toFixed(2), margin + 365, currentY + textPadding, { width: 65, align: 'right' });

    currentY += rowHeight;
    rowColor = !rowColor;
  });
  
  // Table border
  doc.rect(margin, tableStartY, contentWidth, currentY - tableStartY).stroke('#CCCCCC');
  
  // Totals section
  currentY += 20;
  const totalsX = pageWidth - 200;
  const totalsWidth = 170;
  
  // Totals background
  doc.rect(totalsX, currentY, totalsWidth, 80).fill(lightGray);
  
  doc.fillColor(textColor)
     .fontSize(10)
     .font('Helvetica');
  
  let totalsY = currentY + 15;
  const lineHeight = 15;
  
  // Subtotal
  doc.text('Subtotal:', totalsX + 10, totalsY)
     .text(`${parseFloat(orderData.subtotal || 0).toFixed(2)}`, totalsX + 10, totalsY, { 
       width: totalsWidth - 20, 
       align: 'right' 
     });
  totalsY += lineHeight;
  
  // Tax if applicable
  if (orderData.taxAmount && orderData.taxAmount > 0) {
    doc.text('Tax:', totalsX + 10, totalsY)
       .text(`${parseFloat(orderData.taxAmount).toFixed(2)}`, totalsX + 10, totalsY, { 
         width: totalsWidth - 20, 
         align: 'right' 
       });
    totalsY += lineHeight;
  }
  
  // Shipping if applicable
  if (orderData.shippingFee && orderData.shippingFee > 0) {
    doc.text('Shipping:', totalsX + 10, totalsY)
       .text(`${parseFloat(orderData.shippingFee).toFixed(2)}`, totalsX + 10, totalsY, { 
         width: totalsWidth - 20, 
         align: 'right' 
       });
    totalsY += lineHeight;
  }
  
  // Total
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .text('TOTAL:', totalsX + 10, totalsY)
     .text(`${parseFloat(orderData.totalAmount).toFixed(2)}`, totalsX + 10, totalsY, { 
       width: totalsWidth - 20, 
       align: 'right' 
     });
  
  // Payment information
  if (orderData.payment_date) {
    currentY += 20;
    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica')
       .text(`Payment Date: ${new Date(orderData.payment_date).toLocaleDateString('en-GB')}`, margin, currentY);
    currentY += 30;
  } else {
    currentY += 30;
  }
  
  // QR Code section
  if (qrCodeBuffer) {
    currentY += 70;
    
    // QR Code section background
    const qrSectionHeight = 100;
    const qrSectionY = currentY;
    doc.rect(margin, qrSectionY, contentWidth, qrSectionHeight).fill('#F8F9FA');
    doc.rect(margin, qrSectionY, contentWidth, qrSectionHeight).stroke('#E0E0E0');
    
    // QR Code title
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('Quick Access to Order Details', margin + 15, qrSectionY + 15);
    
    // QR Code description
    doc.fillColor(textColor)
       .fontSize(9)
       .font('Helvetica')
       .text('Scan this QR code with your phone to add reviews to your items.', margin + 15, qrSectionY + 35, {
         width: contentWidth - 150
       });
    
    // Add QR code image
    try {
      doc.image(qrCodeBuffer, pageWidth - 130, qrSectionY + 10, {
        width: 80,
        height: 80
      });
    } catch (error) {
      console.error('Error adding QR code to PDF:', error);
    }
    
    currentY += qrSectionHeight + 20;
  }
  
  // Footer - positioned relative to content, not fixed to page bottom
  doc.fontSize(9)
     .fillColor('#666666')
     .text('Thank you!', 0, currentY, { 
       width: pageWidth, 
       align: 'center' 
     });
};

module.exports = {
  sendInvoiceEmail,
  generateAndSendInvoice
};
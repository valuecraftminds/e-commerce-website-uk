const db = require('../../config/database');
const PDFDocument = require('pdfkit');
const { sendInvoiceEmail } = require('../../services/emailService');
const fs = require('fs');
const path = require('path');
const { generateUniqueInvoiceNumber, generateInvoiceFileName } = require('../../utils/invoiceUtils');

const InvoiceController = {
  // Generate and download invoice PDF for an order
  generateInvoice: async (req, res) => {
    try {
      const customer_id = req.user?.id;
      const { company_code } = req.query;
      const { order_id } = req.params;

      // Validate required fields
      if (!customer_id) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      if (!company_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company code is required' 
        });
      }

      if (!order_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Order ID is required' 
        });
      }

      // Fetch order data with all related information including shipping address and company details
      const orderQuery = `
        SELECT 
          o.*,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          p.payment_id,
          p.subtotal as payment_subtotal,
          p.tax as payment_tax,
          p.shipping_fee as payment_shipping_fee,
          p.total as payment_total,
          p.payment_date,
          a.address_id,
          a.first_name as shipping_first_name,
          a.last_name as shipping_last_name,
          a.house,
          a.address_line_1,
          a.address_line_2,
          a.city,
          a.state,
          a.country,
          a.postal_code,
          a.phone as shipping_phone,
          comp.company_name,
          comp.company_address,
          comp.company_phone,
          comp.company_email
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id AND o.company_code = c.company_code
        LEFT JOIN payment p ON o.order_id = p.order_id AND o.company_code = p.company_code
        LEFT JOIN address a ON o.address_id = a.address_id AND o.company_code = a.company_code
        LEFT JOIN companies comp ON o.company_code = comp.company_code
        WHERE o.order_id = ? AND o.customer_id = ? AND o.company_code = ?
      `;

      db.query(orderQuery, [order_id, customer_id, company_code], (err, orderResults) => {
        if (err) {
          console.error('Error fetching order:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch order data' 
          });
        }

        if (orderResults.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Order not found' 
          });
        }

        const order = orderResults[0];

        // Fetch order items
        const itemsQuery = `
          SELECT 
            oi.*,
            s.name,
            s.style_number,
            sz.size_name,
            c.color_name,
            f.fit_name
          FROM order_items oi
          LEFT JOIN styles s ON oi.style_number = s.style_number AND oi.company_code = s.company_code
          LEFT JOIN style_variants v ON oi.sku = v.sku AND oi.company_code = v.company_code
          LEFT JOIN sizes sz ON v.size_id = sz.size_id AND oi.company_code = sz.company_code
          LEFT JOIN colors c ON v.color_id = c.color_id AND oi.company_code = c.company_code
          LEFT JOIN fits f ON v.fit_id = f.fit_id AND oi.company_code = f.company_code
          WHERE oi.order_id = ? AND oi.company_code = ?
        `;

        db.query(itemsQuery, [order_id, company_code], (err, itemsResults) => {
          if (err) {
            console.error('Error fetching order items:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to fetch order items', error: err.message
            });
          }

          // Generate unique invoice number using utility function
          const invoiceNumber = generateUniqueInvoiceNumber(order.order_id);
          
          // Create PDF with A4 size and optimized margins
          const doc = new PDFDocument({ 
            size: 'A4', 
            margin: 30,
            bufferPages: true
          });
          
          // Generate consistent filename using utility function
          const downloadFileName = generateInvoiceFileName(order.order_number, invoiceNumber);
          
          // Set response headers for PDF download
          res.setHeader('Content-Type', 'application/pdf');
          res.setHeader('Content-Disposition', `attachment; filename="${downloadFileName}"`);
          
          // Pipe PDF to response
          doc.pipe(res);

          // Generate PDF content
          generatePDFContent(doc, {
            order,
            items: itemsResults,
            customer: {
              first_name: order.first_name,
              last_name: order.last_name,
              email: order.email,
              phone: order.phone
            },
            shippingAddress: {
              address_id: order.address_id,
              first_name: order.shipping_first_name,
              last_name: order.shipping_last_name,
              house: order.house,
              address_line_1: order.address_line_1,
              address_line_2: order.address_line_2,
              city: order.city,
              state: order.state,
              country: order.country,
              postal_code: order.postal_code,
              phone: order.shipping_phone,
              is_default: order.is_default
            },
            company: {
              name: order.company_name,
              address: order.company_address,
              phone: order.company_phone,
              email: order.company_email,
              code: company_code
            },
            payment: {
              payment_id: order.payment_id,
              subtotal: order.payment_subtotal,
              tax: order.payment_tax,
              shipping_fee: order.payment_shipping_fee,
              total: order.payment_total,
              payment_date: order.payment_date
            },
            invoiceNumber,
            company_code
          });

          // Finalize PDF
          doc.end();

          // Store invoice record in database for tracking
          storeInvoiceRecord(order, invoiceNumber, company_code);
        });
      });

    } catch (error) {
      console.error('Invoice generation error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get invoice data (without PDF generation)
  getInvoice: async (req, res) => {
    try {
      const customer_id = req.user?.id;
      const { company_code } = req.query;
      const { order_id } = req.params;

      if (!customer_id) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      // Check if invoice exists for this order
      const invoiceQuery = `
        SELECT * FROM invoices 
        WHERE order_id = ? AND customer_id = ? AND company_code = ?
        ORDER BY created_at DESC 
        LIMIT 1
      `;

      db.query(invoiceQuery, [order_id, customer_id, company_code], (err, results) => {
        if (err) {
          console.error('Get invoice error:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to retrieve invoice' 
          });
        }

        if (results.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Invoice not found' 
          });
        }

        res.json({
          success: true,
          data: results[0]
        });
      });

    } catch (error) {
      console.error('Get invoice controller error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get shipping address details
  getShippingAddress: async (req, res) => {
    try {
      const customer_id = req.user?.id;
      const { company_code } = req.query;
      const { address_id } = req.params;

      // Validate required fields
      if (!customer_id) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      if (!company_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company code is required' 
        });
      }

      if (!address_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Address ID is required' 
        });
      }

      // Fetch shipping address details
      const addressQuery = `
        SELECT 
          address_id,
          company_code,
          customer_id,
          first_name,
          last_name,
          house,
          address_line_1,
          address_line_2,
          city,
          state,
          country,
          postal_code,
          phone,
          is_default,
          created_at,
          updated_at
        FROM address
        WHERE address_id = ? AND customer_id = ? AND company_code = ?
      `;

      db.query(addressQuery, [address_id, customer_id, company_code], (err, results) => {
        if (err) {
          console.error('Error fetching shipping address:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch shipping address' 
          });
        }

        if (results.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Shipping address not found' 
          });
        }

        res.json({
          success: true,
          data: results[0]
        });
      });

    } catch (error) {
      console.error('Get shipping address error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get all shipping addresses for a customer
  getAllShippingAddresses: async (req, res) => {
    try {
      const customer_id = req.user?.id;
      const { company_code } = req.query;

      // Validate required fields
      if (!customer_id) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      if (!company_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company code is required' 
        });
      }

      // Fetch all shipping addresses for the customer
      const addressesQuery = `
        SELECT 
          address_id,
          company_code,
          customer_id,
          first_name,
          last_name,
          house,
          address_line_1,
          address_line_2,
          city,
          state,
          country,
          postal_code,
          phone,
          is_default,
          created_at,
          updated_at
        FROM address
        WHERE customer_id = ? AND company_code = ?
        ORDER BY is_default DESC, created_at DESC
      `;

      db.query(addressesQuery, [customer_id, company_code], (err, results) => {
        if (err) {
          console.error('Error fetching shipping addresses:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch shipping addresses' 
          });
        }

        res.json({
          success: true,
          data: results,
          count: results.length
        });
      });

    } catch (error) {
      console.error('Get all shipping addresses error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Get company details
  getCompanyDetails: async (req, res) => {
    try {
      const { company_code } = req.query;

      // Validate required fields
      if (!company_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company code is required' 
        });
      }

      // Fetch company details
      const companyQuery = `
        SELECT 
          company_code,
          company_name,
          company_address,
          company_phone,
          company_email
        FROM companies
        WHERE company_code = ?
      `;

      db.query(companyQuery, [company_code], (err, results) => {
        if (err) {
          console.error('Error fetching company details:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch company details' 
          });
        }

        if (results.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Company not found' 
          });
        }

        res.json({
          success: true,
          data: results[0]
        });
      });

    } catch (error) {
      console.error('Get company details error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  // Generate and email invoice PDF to customer
  generateAndEmailInvoice: async (req, res) => {
    try {
      const customer_id = req.user?.id;
      const { company_code } = req.query;
      const { order_id } = req.params;
      const { frontend_url } = req.body; // Get frontend URL from request body

      // Validate required fields
      if (!customer_id) {
        return res.status(401).json({ 
          success: false, 
          message: 'User not authenticated' 
        });
      }

      if (!company_code) {
        return res.status(400).json({ 
          success: false, 
          message: 'Company code is required' 
        });
      }

      if (!order_id) {
        return res.status(400).json({ 
          success: false, 
          message: 'Order ID is required' 
        });
      }

      // Fetch order data with all related information
      const orderQuery = `
        SELECT 
          o.*,
          c.first_name,
          c.last_name,
          c.email,
          c.phone,
          p.payment_id,
          p.subtotal as payment_subtotal,
          p.tax as payment_tax,
          p.shipping_fee as payment_shipping_fee,
          p.total as payment_total,
          p.payment_date,
          a.address_id,
          a.first_name as shipping_first_name,
          a.last_name as shipping_last_name,
          a.house,
          a.address_line_1,
          a.address_line_2,
          a.city,
          a.state,
          a.country,
          a.postal_code,
          a.phone as shipping_phone,
          comp.company_name,
          comp.company_address,
          comp.company_phone,
          comp.company_email
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.customer_id AND o.company_code = c.company_code
        LEFT JOIN payment p ON o.order_id = p.order_id AND o.company_code = p.company_code
        LEFT JOIN address a ON o.address_id = a.address_id AND o.company_code = a.company_code
        LEFT JOIN companies comp ON o.company_code = comp.company_code
        WHERE o.order_id = ? AND o.customer_id = ? AND o.company_code = ?
      `;

      db.query(orderQuery, [order_id, customer_id, company_code], (err, orderResults) => {
        if (err) {
          console.error('Error fetching order:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Failed to fetch order data' 
          });
        }

        if (orderResults.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Order not found' 
          });
        }

        const order = orderResults[0];

        // Fetch order items
        const itemsQuery = `
          SELECT 
            oi.*,
            s.name,
            s.style_number,
            sz.size_name,
            c.color_name,
            f.fit_name
          FROM order_items oi
          LEFT JOIN styles s ON oi.style_number = s.style_number AND oi.company_code = s.company_code
          LEFT JOIN style_variants v ON oi.sku = v.sku AND oi.company_code = v.company_code
          LEFT JOIN sizes sz ON v.size_id = sz.size_id AND oi.company_code = sz.company_code
          LEFT JOIN colors c ON v.color_id = c.color_id AND oi.company_code = c.company_code
          LEFT JOIN fits f ON v.fit_id = f.fit_id AND oi.company_code = f.company_code
          WHERE oi.order_id = ? AND oi.company_code = ?
        `;

        db.query(itemsQuery, [order_id, company_code], async (err, itemsResults) => {
          if (err) {
            console.error('Error fetching order items:', err);
            return res.status(500).json({ 
              success: false, 
              message: 'Failed to fetch order items', 
              error: err.message
            });
          }

          try {
            // Generate unique invoice number using utility function
            const invoiceNumber = generateUniqueInvoiceNumber(order.order_id);
            
            // Create invoices directory if it doesn't exist
            const invoicesDir = path.join(__dirname, '../../invoices');
            if (!fs.existsSync(invoicesDir)) {
              fs.mkdirSync(invoicesDir, { recursive: true });
            }

            // Generate PDF filename using utility function
            const invoiceFileName = generateInvoiceFileName(order.order_number, invoiceNumber);
            const invoiceFilePath = path.join(invoicesDir, invoiceFileName);

            // Create PDF document
            const doc = new PDFDocument({ 
              size: 'A4', 
              margin: 30,
              bufferPages: true
            });
            
            // Pipe PDF to file
            const stream = fs.createWriteStream(invoiceFilePath);
            doc.pipe(stream);

            // Generate PDF content using the existing function
            generatePDFContent(doc, {
              order,
              items: itemsResults,
              customer: {
                first_name: order.first_name,
                last_name: order.last_name,
                email: order.email,
                phone: order.phone
              },
              shippingAddress: {
                address_id: order.address_id,
                first_name: order.shipping_first_name,
                last_name: order.shipping_last_name,
                house: order.house,
                address_line_1: order.address_line_1,
                address_line_2: order.address_line_2,
                city: order.city,
                state: order.state,
                country: order.country,
                postal_code: order.postal_code,
                phone: order.shipping_phone,
                is_default: order.is_default
              },
              company: {
                name: order.company_name,
                address: order.company_address,
                phone: order.company_phone,
                email: order.company_email,
                code: company_code
              },
              payment: {
                payment_id: order.payment_id,
                subtotal: order.payment_subtotal,
                tax: order.payment_tax,
                shipping_fee: order.payment_shipping_fee,
                total: order.payment_total,
                payment_date: order.payment_date
              },
              invoiceNumber,
              company_code
            });

            // Finalize PDF
            doc.end();

            // Wait for PDF to be written
            stream.on('finish', async () => {
              try {
                // Send invoice email with PDF attachment
                const emailResult = await sendInvoiceEmail(
                  order.email,
                  `${order.first_name} ${order.last_name}`,
                  {
                    orderId: order.order_id,
                    orderNumber: order.order_number || order.order_id,
                    orderDate: order.created_at,
                    totalAmount: order.total_amount,
                    company_name: order.company_name,
                    customer_id: order.customer_id,
                    company_code: order.company_code
                  },
                  invoiceFilePath,
                  frontend_url // Pass frontend URL from request
                );

                // Store invoice record in database for tracking
                storeInvoiceRecord(order, invoiceNumber, company_code);

                if (emailResult.success) {
                  res.json({
                    success: true,
                    message: 'Invoice generated and sent successfully',
                    invoice_number: invoiceNumber,
                    email_sent: true,
                    sent_to: order.email
                  });
                } else {
                  res.status(500).json({
                    success: false,
                    message: 'Invoice generated but failed to send email',
                    invoice_number: invoiceNumber,
                    email_sent: false,
                    error: emailResult.error
                  });
                }

              } catch (emailError) {
                console.error('Error sending invoice email:', emailError);
                res.status(500).json({
                  success: false,
                  message: 'Invoice generated but failed to send email',
                  invoice_number: invoiceNumber,
                  email_sent: false,
                  error: emailError.message
                });
              }
            });

            stream.on('error', (streamError) => {
              console.error('Error writing PDF file:', streamError);
              res.status(500).json({
                success: false,
                message: 'Failed to generate invoice PDF',
                error: streamError.message
              });
            });

          } catch (pdfError) {
            console.error('PDF generation error:', pdfError);
            res.status(500).json({
              success: false,
              message: 'Failed to generate invoice PDF',
              error: pdfError.message
            });
          }
        });
      });

    } catch (error) {
      console.error('Generate and email invoice error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

// Helper function to generate PDF content
function generatePDFContent(doc, data) {
  const { order, items, customer, shippingAddress, company, payment, invoiceNumber, company_code } = data;
  
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
  
  // Header with company branding
  doc.rect(0, 0, pageWidth, 80).fill(primaryColor);
  
  // Invoice title
  doc.fillColor('white')
     .fontSize(28)
     .font('Helvetica-Bold')
     .text('INVOICE', margin, 25);
  
  // Company name on the right
  doc.fontSize(16)
     .text(order.company_name || 'Company Name', pageWidth - 200, 30, { 
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
     .text(invoiceNumber, margin + 100, currentY + 15);
  
  doc.font('Helvetica-Bold')
     .text('Invoice Date:', margin + 15, currentY + 30)
     .font('Helvetica')
     .text(new Date().toLocaleDateString('en-GB'), margin + 100, currentY + 30);
  
  doc.font('Helvetica-Bold')
     .text('Order Number:', margin + 15, currentY + 45)
     .font('Helvetica')
     .text(order.order_number || order.order_id, margin + 100, currentY + 45);
  
  // Company details - right side
  if (order.company_address) {
    doc.fontSize(9)
       .text(order.company_address, pageWidth - 200, currentY + 15, { width: 170, align: 'right' });
  }
  if (order.company_phone) {
    doc.text(`Tel: ${order.company_phone}`, pageWidth - 200, currentY + 30, { width: 170, align: 'right' });
  }
  if (order.company_email) {
    doc.text(`Email: ${order.company_email}`, pageWidth - 200, currentY + 45, { width: 170, align: 'right' });
  }
  
  currentY += 80;
  
  // Bill To and Ship To section
  const billToX = margin;
  const shipToX = pageWidth / 2 + 10;
  const sectionWidth = (contentWidth - 20) / 2;
  
  // Bill To section
  doc.rect(billToX, currentY, sectionWidth, 80).fill(secondaryColor);
  doc.fillColor(primaryColor)
     .fontSize(12)
     .font('Helvetica-Bold')
     .text('BILL TO', billToX + 10, currentY + 10);
  
  doc.fillColor(textColor)
     .fontSize(10)
     .font('Helvetica')
     .text(`${customer.first_name} ${customer.last_name}`, billToX + 10, currentY + 30)
     .text(`Email: ${customer.email}`, billToX + 10, currentY + 45);
  
  if (customer.phone) {
    doc.text(`Phone: ${customer.phone}`, billToX + 10, currentY + 60);
  }
  
  // Ship To section
  if (shippingAddress && shippingAddress.address_id) {
    doc.rect(shipToX, currentY, sectionWidth, 80).fill(secondaryColor);
    doc.fillColor(primaryColor)
       .fontSize(12)
       .font('Helvetica-Bold')
       .text('SHIP TO', shipToX + 10, currentY + 10);
    
    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica');
    
    let shipY = currentY + 30;
    const shipLineHeight = 12;
    
    // Name
    if (shippingAddress.first_name || shippingAddress.last_name) {
      doc.text(`${shippingAddress.first_name || ''} ${shippingAddress.last_name || ''}`.trim(), 
               shipToX + 10, shipY, { width: sectionWidth - 20 });
      shipY += shipLineHeight;
    }
    
    // Address lines
    if (shippingAddress.house) {
      doc.text(shippingAddress.house, shipToX + 10, shipY, { width: sectionWidth - 20 });
      shipY += shipLineHeight;
    }
    
    if (shippingAddress.address_line_1) {
      doc.text(shippingAddress.address_line_1, shipToX + 10, shipY, { width: sectionWidth - 20 });
      shipY += shipLineHeight;
    }
    
    // City, State, Postal Code on one line
    let cityLine = '';
    if (shippingAddress.city) cityLine += shippingAddress.city;
    if (shippingAddress.state) cityLine += (cityLine ? ', ' : '') + shippingAddress.state;
    if (shippingAddress.postal_code) cityLine += (cityLine ? ' ' : '') + shippingAddress.postal_code;
    if (cityLine && shipY <= currentY + 65) {
      doc.text(cityLine, shipToX + 10, shipY, { width: sectionWidth - 20 });
    }
  }
  
  currentY += 100;
  
  // Items table
  const tableStartY = currentY;
  const tableHeaders = [
    { text: 'Item', x: margin, width: 120 },
    { text: 'SKU', x: margin + 120, width: 70 },
    { text: 'Size', x: margin + 190, width: 40 },
    { text: 'Color', x: margin + 230, width: 60 },
    { text: 'Qty', x: margin + 290, width: 30 },
    { text: 'Price', x: margin + 320, width: 60 },
    { text: 'Total', x: margin + 380, width: 60 }
  ];
  
  // Table header background
  const headerHeight = 30; // Increased header height from 25 to 30
  doc.rect(margin, currentY, contentWidth, headerHeight).fill(primaryColor);
  
  // Table headers
  doc.fillColor('white')
     .fontSize(10)
     .font('Helvetica-Bold');
  
  tableHeaders.forEach(header => {
    doc.text(header.text, header.x + 5, currentY + 10, { // Adjusted padding for header
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
  const rowHeight = 25; // Increased row height from 18 to 25
  const textPadding = 8; // Adjusted padding for better text positioning
  
  items.forEach((item, index) => {
    // Alternate row colors
    if (rowColor) {
      doc.rect(margin, currentY, contentWidth, rowHeight).fill('#FAFAFA');
    }
    
    // Item data
    doc.fillColor(textColor);
    doc.text(item.style_name || 'Product', margin + 5, currentY + textPadding, { width: 115, ellipsis: true });
    doc.text(item.sku || 'N/A', margin + 125, currentY + textPadding, { width: 65, ellipsis: true });
    doc.text(item.size_name || 'N/A', margin + 195, currentY + textPadding, { width: 35, align: 'center' });
    doc.text(item.color_name || 'N/A', margin + 235, currentY + textPadding, { width: 55, ellipsis: true });
    doc.text(item.quantity.toString(), margin + 295, currentY + textPadding, { width: 25, align: 'right' });
    doc.text(`$${parseFloat(item.unit_price).toFixed(2)}`, margin + 325, currentY + textPadding, { width: 55, align: 'right' });
    doc.text(`$${parseFloat(item.total_price).toFixed(2)}`, margin + 385, currentY + textPadding, { width: 55, align: 'right' });
    
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
     .text(`$${parseFloat(order.subtotal).toFixed(2)}`, totalsX + 10, totalsY, { 
       width: totalsWidth - 20, 
       align: 'right' 
     });
  totalsY += lineHeight;
  
  // Tax if applicable
  if (order.tax_amount && order.tax_amount > 0) {
    doc.text('Tax:', totalsX + 10, totalsY)
       .text(`$${parseFloat(order.tax_amount).toFixed(2)}`, totalsX + 10, totalsY, { 
         width: totalsWidth - 20, 
         align: 'right' 
       });
    totalsY += lineHeight;
  }
  
  // Shipping if applicable
  if (order.shipping_fee && order.shipping_fee > 0) {
    doc.text('Shipping:', totalsX + 10, totalsY)
       .text(`$${parseFloat(order.shipping_fee).toFixed(2)}`, totalsX + 10, totalsY, { 
         width: totalsWidth - 20, 
         align: 'right' 
       });
    totalsY += lineHeight;
  }
  
  // Total
  doc.font('Helvetica-Bold')
     .fontSize(12)
     .text('TOTAL:', totalsX + 10, totalsY)
     .text(`$${parseFloat(order.total_amount).toFixed(2)}`, totalsX + 10, totalsY, { 
       width: totalsWidth - 20, 
       align: 'right' 
     });
  
  // Payment information
  if (payment.payment_date) {
    currentY += 100;
    doc.fillColor(textColor)
       .fontSize(10)
       .font('Helvetica')
       .text(`Payment Date: ${new Date(payment.payment_date).toLocaleDateString('en-GB')}`, margin, currentY);
  }
  
  // Footer
  const footerY = pageHeight - 50;
  doc.fontSize(9)
     .fillColor('#666666')
     .text('Thank you for your business!', margin, footerY, { 
       width: contentWidth, 
       align: 'center' 
     });
}

// Helper function to store invoice record
function storeInvoiceRecord(order, invoiceNumber, company_code) {
  const invoiceQuery = `
    INSERT INTO invoices (
      company_code, customer_id, order_id, invoice_number, 
      invoice_date, total_amount
    ) VALUES (?, ?, ?, ?, NOW(), ?)
  `;

  const values = [
    company_code,
    order.customer_id,
    order.order_id,
    invoiceNumber,
    order.total_amount
  ];

  db.query(invoiceQuery, values, (err) => {
    if (err) {
      console.error('Error storing invoice record:', err);
    } else {
      console.log('Invoice record stored successfully');
    }
  });
}

// Helper function to format shipping address for display
function formatShippingAddress(address) {
  if (!address) return null;
  
  const lines = [];
  
  // Full name
  if (address.first_name || address.last_name) {
    lines.push(`${address.first_name || ''} ${address.last_name || ''}`.trim());
  }
  
  // House number
  if (address.house) {
    lines.push(address.house);
  }
  
  // Address lines
  if (address.address_line_1) {
    lines.push(address.address_line_1);
  }
  
  if (address.address_line_2) {
    lines.push(address.address_line_2);
  }
  
  // City, State, Postal Code
  let cityLine = '';
  if (address.city) cityLine += address.city;
  if (address.state) cityLine += (cityLine ? ', ' : '') + address.state;
  if (address.postal_code) cityLine += (cityLine ? ' ' : '') + address.postal_code;
  if (cityLine) {
    lines.push(cityLine);
  }
  
  // Country
  if (address.country) {
    lines.push(address.country);
  }
  
  // Phone
  if (address.phone) {
    lines.push(`Phone: ${address.phone}`);
  }
  
  return {
    formatted: lines.join('\n'),
    lines: lines,
    full_address: lines.join(', ')
  };
}

module.exports = InvoiceController;
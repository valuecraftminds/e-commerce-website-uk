const db = require('../../config/database');
const PDFDocument = require('pdfkit');

class IssuingController {
  // Get all bookings for a company (include style_number) - Original method
  getBookings(req, res) {
    const { company_code } = req.query;
    db.query(
      'SELECT booking_id, company_code, order_item_id, sku, style_number, ordered_qty, status, created_at FROM booking WHERE company_code = ?',
      [company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(results);
        }
      }
    );
  }

  // Get all orders for a company
  getOrders(req, res) {
    const { company_code } = req.query;
    
    if (!company_code) {
      return res.status(400).json({ error: 'Company code is required' });
    }

    const sql = `
      SELECT 
        o.order_id,
        o.company_code,
        o.customer_id,
        o.order_number,
        o.address_id,
        o.payment_method_id,
        o.subtotal,
        o.shipping_fee,
        o.tax_amount,
        o.total_amount,
        o.total_items,
        o.order_notes,
        o.order_status,
        o.created_at,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email as customer_email,
        c.phone as customer_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      WHERE o.company_code = ?
      ORDER BY o.created_at DESC
    `;

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error fetching orders:', err);
        return res.status(500).json({ error: err.message });
      }
      res.json(results);
    });
  }

  // Get order details with order items
  getOrderDetails(req, res) {
    const { order_id } = req.params;
    const { company_code } = req.query;

    if (!company_code) {
      return res.status(400).json({ error: 'Company code is required' });
    }

    // Get order header information
    const orderSql = `
      SELECT 
        o.order_id,
        o.company_code,
        o.customer_id,
        o.order_number,
        o.address_id,
        o.payment_method_id,
        o.subtotal,
        o.shipping_fee,
        o.tax_amount,
        o.total_amount,
        o.total_items,
        o.order_notes,
        o.order_status,
        o.created_at,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        a.phone as shipping_phone,
        a.first_name as shipping_first_name,
        a.last_name as shipping_last_name,
        a.address_line_1,
        a.address_line_2,
        a.city,
        a.state,
        a.postal_code,
        a.country,
        a.phone as address_phone
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN address a ON o.address_id = a.address_id
      WHERE o.order_id = ? AND o.company_code = ?
    `;

    // Get order items with style details
    const itemsSql = `
      SELECT 
        oi.order_item_id,
        oi.order_id,
        oi.customer_id,
        oi.variant_id,
        oi.sku,
        oi.style_number,
        oi.quantity,
        oi.unit_price,
        oi.total_price,
        oi.created_at,
        sv.color_id,
        sv.size_id,
        sv.fit_id,
        sv.material_id,
        sv.sale_price,
        st.name as style_name,
        st.description as style_description,
        st.image as style_image,
        c.color_name,
        s.size_name,
        f.fit_name,
        m.material_name,
        COALESCE(b.booking_id, NULL) as booking_id,
        COALESCE(b.status, 'Not Booked') as booking_status
      FROM order_items oi
      LEFT JOIN style_variants sv ON oi.variant_id = sv.variant_id
      LEFT JOIN styles st ON oi.style_number = st.style_number AND st.company_code = oi.company_code
      LEFT JOIN colors c ON sv.color_id = c.color_id AND c.company_code = sv.company_code
      LEFT JOIN sizes s ON sv.size_id = s.size_id AND s.company_code = sv.company_code
      LEFT JOIN fits f ON sv.fit_id = f.fit_id AND f.company_code = sv.company_code
      LEFT JOIN materials m ON sv.material_id = m.material_id AND m.company_code = sv.company_code
      LEFT JOIN booking b ON oi.order_item_id = b.order_item_id
      WHERE oi.order_id = ? AND oi.company_code = ?
      ORDER BY oi.order_item_id
    `;

    db.query(orderSql, [order_id, company_code], (err, orderResults) => {
      if (err) {
        console.error('Error fetching order details:', err);
        return res.status(500).json({ error: err.message });
      }

      if (orderResults.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      db.query(itemsSql, [order_id, company_code], (err, itemsResults) => {
        if (err) {
          console.error('Error fetching order items:', err);
          return res.status(500).json({ error: err.message });
        }

        const orderHeader = orderResults[0];
        const orderItems = itemsResults;

        res.json({
          success: true,
          order: orderHeader,
          items: orderItems
        });
      });
    });
  }

  // Get main stock for issuing (reuse from IssuingController)
  getMainStock(req, res) {
    const { company_code, style_number, sku } = req.query;
    
    if (!company_code || !style_number || !sku) {
      return res.status(400).json({ error: 'Company code, style number, and SKU are required' });
    }

    db.query(
      'SELECT * FROM main_stock WHERE company_code = ? AND style_number = ? AND sku = ?',
      [company_code, style_number, sku],
      (err, results) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json(results);
      }
    );
  }

  // Issue all items in an order at once
  issueAllOrderItems(req, res) {
    const { order_id } = req.params;
    const { company_code, issuing_items } = req.body;

    if (!company_code || !order_id || !issuing_items || !Array.isArray(issuing_items) || issuing_items.length === 0) {
      return res.status(400).json({ error: 'Company code, order ID, and issuing items are required' });
    }

    // Start transaction
    db.beginTransaction((err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to start transaction' });
      }

      let completedIssues = 0;
      let hasError = false;
      const errors = [];

      const processIssueItem = (item, callback) => {
        const { order_item_id, style_number, sku, issuing_qty } = item;

        // First, get available stock for this SKU ordered by date (FIFO - First In, First Out)
        const getStockSql = `
          SELECT batch_number, lot_no, unit_price, main_stock_qty, created_at 
          FROM main_stock 
          WHERE company_code = ? AND style_number = ? AND sku = ? AND main_stock_qty > 0
          ORDER BY created_at ASC
        `;

        db.query(getStockSql, [company_code, style_number, sku], (err, stockResults) => {
          if (err) {
            errors.push(`Failed to fetch stock for ${sku}: ${err.message}`);
            return callback(err);
          }

          if (!stockResults || stockResults.length === 0) {
            errors.push(`No available stock found for ${sku}`);
            return callback(new Error(`No available stock for ${sku}`));
          }

          // Check if we have enough total stock
          const totalAvailableStock = stockResults.reduce((sum, stock) => sum + stock.main_stock_qty, 0);
          if (totalAvailableStock < issuing_qty) {
            errors.push(`Insufficient stock for ${sku}. Required: ${issuing_qty}, Available: ${totalAvailableStock}`);
            return callback(new Error(`Insufficient stock for ${sku}`));
          }

          // Use the oldest stock (first in the ordered list) for issuing
          const selectedStock = stockResults[0];
          const { batch_number, lot_no, unit_price } = selectedStock;

          // Insert into stock_issuing (main_stock_qty updated by trigger)
          const issuingSql = `
            INSERT INTO stock_issuing (company_code, style_number, sku, batch_number, lot_no, unit_price, issuing_qty) 
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `;

          db.query(issuingSql, [company_code, style_number, sku, batch_number, lot_no, unit_price, issuing_qty], (err, result) => {
            if (err) {
              errors.push(`Failed to issue ${sku}: ${err.message}`);
              return callback(err);
            }

            // Update or create booking record
            const checkBookingSql = `
              SELECT booking_id FROM booking WHERE order_item_id = ? AND company_code = ?
            `;

            db.query(checkBookingSql, [order_item_id, company_code], (err, bookingResults) => {
              if (err) {
                errors.push(`Failed to check booking for ${sku}: ${err.message}`);
                return callback(err);
              }

              if (bookingResults.length > 0) {
                // Update existing booking status to Issued
                const updateBookingSql = `
                  UPDATE booking SET status = 'Issued' WHERE booking_id = ?
                `;
                db.query(updateBookingSql, [bookingResults[0].booking_id], (err) => {
                  if (err) {
                    errors.push(`Failed to update booking for ${sku}: ${err.message}`);
                    return callback(err);
                  }
                  callback(null);
                });
              } else {
                // Create new booking record with Issued status
                const createBookingSql = `
                  INSERT INTO booking (company_code, order_item_id, sku, style_number, ordered_qty, status) 
                  VALUES (?, ?, ?, ?, ?, 'Issued')
                `;
                db.query(createBookingSql, [company_code, order_item_id, sku, style_number, issuing_qty], (err) => {
                  if (err) {
                    errors.push(`Failed to create booking for ${sku}: ${err.message}`);
                    return callback(err);
                  }
                  callback(null);
                });
              }
            });
          });
        });
      };

      // Process each issuing item
      issuing_items.forEach((item, index) => {
        processIssueItem(item, (err) => {
          if (err && !hasError) {
            hasError = true;
            return db.rollback(() => {
              res.status(500).json({ 
                error: 'Failed to issue order items', 
                details: errors 
              });
            });
          }

          completedIssues++;
          
          // Check if all items are processed
          if (completedIssues === issuing_items.length && !hasError) {
            // Update order status to 'In Transit' after all items are processed
            const updateOrderSql = `
              UPDATE orders SET order_status = 'In Transit' WHERE order_id = ? AND company_code = ?
            `;
            
            db.query(updateOrderSql, [order_id, company_code], (err) => {
              if (err) {
                return db.rollback(() => {
                  res.status(500).json({ error: 'Failed to update order status' });
                });
              }
              
              db.commit((err) => {
                if (err) {
                  return db.rollback(() => {
                    res.status(500).json({ error: 'Failed to commit transaction' });
                  });
                }
                res.json({ 
                  success: true, 
                  message: `Successfully issued ${completedIssues} items for order ${order_id}`,
                  issued_count: completedIssues
                });
              });
            });
          }
        });
      });
    });
  }

  // Generate Picking List PDF
  generatePickingList(req, res) {
    const { order_id } = req.params;
    const { company_code } = req.query;

    if (!company_code || !order_id) {
      return res.status(400).json({ error: 'Company code and order ID are required' });
    }

    // Get order details with company info
    const orderSql = `
      SELECT 
        o.order_id,
        o.order_number,
        o.order_status,
        o.created_at,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        co.company_name,
        co.company_address,
        co.company_phone,
        co.company_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN companies co ON o.company_code = co.company_code
      WHERE o.order_id = ? AND o.company_code = ?
    `;

    // Get order items
    const itemsSql = `
      SELECT 
        oi.sku,
        oi.style_number,
        oi.quantity,
        st.name as style_name,
        c.color_name,
        s.size_name,
        f.fit_name,
        m.material_name,
        b.status as booking_status
      FROM order_items oi
      LEFT JOIN style_variants sv ON oi.variant_id = sv.variant_id
      LEFT JOIN styles st ON oi.style_number = st.style_number AND st.company_code = oi.company_code
      LEFT JOIN colors c ON sv.color_id = c.color_id AND c.company_code = sv.company_code
      LEFT JOIN sizes s ON sv.size_id = s.size_id AND s.company_code = sv.company_code
      LEFT JOIN fits f ON sv.fit_id = f.fit_id AND f.company_code = sv.company_code
      LEFT JOIN materials m ON sv.material_id = m.material_id AND m.company_code = sv.company_code
      LEFT JOIN booking b ON oi.order_item_id = b.order_item_id
      WHERE oi.order_id = ? AND oi.company_code = ?
      ORDER BY oi.order_item_id
    `;

    db.query(orderSql, [order_id, company_code], (err, orderResults) => {
      if (err) {
        console.error('Error fetching order for picking list:', err);
        return res.status(500).json({ error: err.message });
      }

      if (orderResults.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      db.query(itemsSql, [order_id, company_code], (err, itemsResults) => {
        if (err) {
          console.error('Error fetching items for picking list:', err);
          return res.status(500).json({ error: err.message });
        }

        const order = orderResults[0];
        const items = itemsResults;

        // Call the static method directly
        IssuingController.generatePickingListPDF(res, order, items);
      });
    });
  }

  // Generate Packing Label PDF
  generatePackingLabel(req, res) {
    const { order_id } = req.params;
    const { company_code } = req.query;

    if (!company_code || !order_id) {
      return res.status(400).json({ error: 'Company code and order ID are required' });
    }

    // Get order details with shipping info
    const orderSql = `
      SELECT 
        o.order_id,
        o.order_number,
        o.total_amount,
        o.shipping_fee,
        o.created_at,
        CONCAT(c.first_name, ' ', c.last_name) as customer_name,
        c.email as customer_email,
        c.phone as customer_phone,
        a.first_name as shipping_first_name,
        a.last_name as shipping_last_name,
        a.address_line_1,
        a.address_line_2,
        a.city,
        a.state,
        a.postal_code,
        a.country,
        a.phone as shipping_phone,
        co.company_name,
        co.company_address,
        co.company_phone,
        co.company_email
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN address a ON o.address_id = a.address_id
      LEFT JOIN companies co ON o.company_code = co.company_code
      WHERE o.order_id = ? AND o.company_code = ?
    `;

    // Get order items summary
    const itemsSql = `
      SELECT 
        COUNT(*) as total_items,
        SUM(oi.quantity) as total_quantity
      FROM order_items oi
      WHERE oi.order_id = ? AND oi.company_code = ?
    `;

    db.query(orderSql, [order_id, company_code], (err, orderResults) => {
      if (err) {
        console.error('Error fetching order for packing label:', err);
        return res.status(500).json({ error: err.message });
      }

      if (orderResults.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      db.query(itemsSql, [order_id, company_code], (err, itemsResults) => {
        if (err) {
          console.error('Error fetching items summary for packing label:', err);
          return res.status(500).json({ error: err.message });
        }

        const order = orderResults[0];
        const itemsSummary = itemsResults[0];

        // Call the static method directly
        IssuingController.generatePackingLabelPDF(res, order, itemsSummary);
      });
    });
  }

  // Generate Picking List PDF Document (Static method)
  static generatePickingListPDF(res, order, items) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PickingList-${order.order_number}.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);

    // Company Header
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(order.company_name || 'Company Name', 50, 50, { align: 'center' });
    
    if (order.company_address) {
      doc.fontSize(10)
         .font('Helvetica')
         .text(order.company_address, 50, 75, { align: 'center' });
    }

    // Title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('PICKING LIST', 50, 120, { align: 'center' });

    // Order Information
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Order Information', 50, 160);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Order Number: ${order.order_number}`, 50, 180)
       .text(`Customer: ${order.customer_name}`, 50, 195)
       .text(`Order Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}`, 50, 210)
       .text(`Pick Date: ${new Date().toLocaleDateString('en-GB')}`, 400, 180)
       .text(`Status: ${order.order_status}`, 400, 195);

    // Items Table
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('Items to Pick', 50, 250);

    // Table Headers (improved spacing like purchase order)
    const tableTop = 280;
    const col1X = 50;   // #
    const col2X = 75;   // SKU
    const col3X = 165;  // Style Name
    const col4X = 270;  // Color
    const col5X = 320;  // Size
    const col6X = 355;  // Fit
    const col7X = 420;  // Material
    const col8X = 480;  // Qty

    doc.fontSize(10)
       .font('Helvetica-Bold');

    doc.text('#', col1X, tableTop, { width: 20, align: 'left' });
    doc.text('SKU', col2X, tableTop, { width: 85, align: 'left' });
    doc.text('Style', col3X, tableTop, { width: 100, align: 'left' });
    doc.text('Color', col4X, tableTop, { width: 45, align: 'left' });
    doc.text('Size', col5X, tableTop, { width: 30, align: 'left' });
    doc.text('Fit', col6X, tableTop, { width: 60, align: 'left' });
    doc.text('Material', col7X, tableTop, { width: 55, align: 'left' });
    doc.text('Qty', col8X, tableTop, { width: 50, align: 'right' });

    // Draw header line
    doc.moveTo(50, tableTop + 18)
       .lineTo(530, tableTop + 18)
       .stroke();

    // Table Content
    let currentY = tableTop + 23;
    doc.font('Helvetica').fontSize(9);

    items.forEach((item, index) => {
      if (currentY > 700) {
        doc.addPage();
        // Re-draw headers on new page
        doc.text('#', col1X, tableTop, { width: 20, align: 'left' });
    doc.text('SKU', col2X, tableTop, { width: 85, align: 'left' });
    doc.text('Style', col3X, tableTop, { width: 100, align: 'left' });
    doc.text('Color', col4X, tableTop, { width: 45, align: 'left' });
    doc.text('Size', col5X, tableTop, { width: 30, align: 'left' });
    doc.text('Fit', col6X, tableTop, { width: 60, align: 'left' });
    doc.text('Material', col7X, tableTop, { width: 55, align: 'left' });
    doc.text('Qty', col8X, tableTop, { width: 50, align: 'right' });
        
        doc.moveTo(50, 68).lineTo(530, 68).stroke();
        currentY = 75;
        doc.font('Helvetica').fontSize(9);
      }

      // Truncate material name if too long
      const materialName = item.material_name || 'N/A';
      const truncatedMaterial = materialName.length > 20 ? materialName.substring(0, 20) + '...' : materialName;

      doc.text((index + 1).toString(), col1X, currentY, { width: 20, align: 'left' });
      doc.text(item.sku || 'N/A', col2X, currentY, { width: 85, align: 'left' });
      doc.text(item.style_name || 'N/A', col3X, currentY, { width: 100, align: 'left' });
      doc.text(item.color_name || 'N/A', col4X, currentY, { width: 45, align: 'left' });
      doc.text(item.size_name || 'N/A', col5X, currentY, { width: 30, align: 'left' });
      doc.text(item.fit_name || 'N/A', col6X, currentY, { width: 60, align: 'left' });
      doc.text(truncatedMaterial, col7X, currentY, { width: 55, align: 'left' });
      doc.text(item.quantity.toString(), col8X, currentY, { width: 50, align: 'right' });

      currentY += 18;
    });

    // Draw bottom line
    doc.moveTo(50, currentY)
       .lineTo(530, currentY)
       .stroke();

    // Summary
    const totalItems = items.length;
    const totalQuantity = items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);

    currentY += 20;
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text(`Total Items: ${totalItems}`, 400, currentY);

    currentY += 15;
    doc.text(`Total Quantity: ${totalQuantity}`, 400, currentY);

    // Signature section
    currentY += 80;
    doc.fontSize(10)
       .font('Helvetica')
       .text('Picked By: ____________________', 50, currentY)
       .text('Date: ____________________', 300, currentY);

    currentY += 30;
    doc.text('Verified By: ____________________', 50, currentY)
       .text('Date: ____________________', 300, currentY);

    // Finalize the PDF
    doc.end();
  }

  // Generate Packing Label PDF Document (Static method)
  static generatePackingLabelPDF(res, order, itemsSummary) {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="PackingLabel-${order.order_number}.pdf"`);
    
    // Pipe the PDF to the response
    doc.pipe(res);

    // Company Header
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text(order.company_name || 'Company Name', 50, 50, { align: 'center' });
    
    if (order.company_address) {
      doc.fontSize(10)
         .font('Helvetica')
         .text(order.company_address, 50, 75, { align: 'center' });
    }

    // Title
    doc.fontSize(18)
       .font('Helvetica-Bold')
       .text('SHIPPING LABEL', 50, 120, { align: 'center' });

    // Order Information Box
    doc.rect(50, 160, 240, 100).stroke();
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('ORDER DETAILS', 60, 170);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Order #: ${order.order_number}`, 60, 190)
       .text(`Order Date: ${new Date(order.created_at).toLocaleDateString('en-GB')}`, 60, 205)
       .text(`Items: ${itemsSummary.total_items}`, 60, 220)
       .text(`Quantity: ${itemsSummary.total_quantity}`, 60, 235);

    // Package Info Box
    doc.rect(310, 160, 240, 100).stroke();
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('PACKAGE INFO', 320, 170);

    doc.fontSize(10)
       .font('Helvetica')
       .text(`Weight: _______ kg`, 320, 190)
       .text(`Dimensions: _______ cm`, 320, 205)
       .text(`Packed By: _____________`, 320, 220)
       .text(`Pack Date: ${new Date().toLocaleDateString('en-GB')}`, 320, 235);

    // Shipping Address Box
    doc.rect(50, 280, 500, 120).stroke();
    doc.fontSize(14)
       .font('Helvetica-Bold')
       .text('SHIP TO:', 60, 295);

    doc.fontSize(12)
       .font('Helvetica')
       .text(`${order.shipping_first_name} ${order.shipping_last_name}`, 60, 320)
       .text(order.address_line_1, 60, 340);

    if (order.address_line_2) {
      doc.text(order.address_line_2, 60, 355);
    }

    doc.text(`${order.city}, ${order.state} ${order.postal_code}`, 60, 370)
       .text(order.country, 60, 385);

    if (order.shipping_phone) {
      doc.text(`Phone: ${order.shipping_phone}`, 350, 320);
    }

    // Return Address Box
    doc.rect(50, 420, 240, 80).stroke();
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('RETURN TO:', 60, 435);

    doc.fontSize(10)
       .font('Helvetica')
       .text(order.company_name || 'Company Name', 60, 455);
    
    if (order.company_address) {
      doc.text(order.company_address, 60, 470);
    }
    
    if (order.company_phone) {
      doc.text(`Phone: ${order.company_phone}`, 60, 485);
    }

    // Tracking/Barcode Area
    doc.rect(310, 420, 240, 80).stroke();
    doc.fontSize(12)
       .font('Helvetica-Bold')
       .text('TRACKING INFO', 320, 435);

    doc.fontSize(10)
       .font('Helvetica')
       .text('Tracking #: ___________________', 320, 455)
       .text('Carrier: ______________________', 320, 470)
       .text('Service: ______________________', 320, 485);

    // Instructions
    doc.fontSize(10)
       .font('Helvetica')
       .text('HANDLING INSTRUCTIONS:', 50, 530)
       .text('• Handle with care', 70, 550)
       .text('• This side up', 70, 565)
       .text('• Keep dry', 70, 580);

    // Signature section
    doc.fontSize(10)
       .text('Packed By: ____________________', 50, 620)
       .text('Quality Check: ____________________', 300, 620);

    doc.text('Date: ____________________', 50, 640)
       .text('Supervisor: ____________________', 300, 640);

    // Finalize the PDF
    doc.end();
  }
}

module.exports = new IssuingController();

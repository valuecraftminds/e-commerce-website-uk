const db = require('../../config/database');

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
        c.email as customer_email
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
}

module.exports = new IssuingController();

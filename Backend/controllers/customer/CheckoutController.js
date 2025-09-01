const db = require('../../config/database');
const {generateAndSendInvoice } = require('../../services/emailService');
const { generateUniqueInvoiceNumber } = require('../../utils/invoiceUtils');

const CheckoutController = {
  submitCheckout: (req, res) => {
    const customer_id = req.user?.id;
    const { company_code } = req.query;
    console.log('Company Code:', company_code);
    console.log('Customer ID:', req.user);

    const {
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
      payment_method,
      // New order-related fields
      order_items,
      subtotal,
      shipping_fee,
      tax_amount,
      total_amount,
      order_notes,
      address_id // If using existing address instead of creating new one
    } = req.body;

    // Validate required fields
    if (!customer_id) {
      return res.status(401).json({ error: 'BE: User not authenticated' });
    }

    if (!company_code) {
      return res.status(400).json({ error: 'Company code is required' });
    }

    if (!payment_method || !payment_method.method_type) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    if (!order_items || !Array.isArray(order_items) || order_items.length === 0) {
      return res.status(400).json({ error: 'Order items are required' });
    }

    if (!total_amount || total_amount <= 0) {
      return res.status(400).json({ error: 'Valid total amount is required' });
    }

    // Start transaction
    db.beginTransaction((transactionErr) => {
      if (transactionErr) {
        console.error('Transaction start error:', transactionErr);
        return res.status(500).json({ error: 'Failed to start transaction' });
      }

      // Function to handle address insertion or use existing
      const processAddress = (callback) => {
        if (address_id) {
          // Use existing address
          callback(null, { insertId: address_id });
        } else {
          // Create new address
          const addressQuery = `
            INSERT INTO address (
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
              created_at, 
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;
          const addressValues = [
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
            new Date(), 
            new Date()
          ];

          db.query(addressQuery, addressValues, callback);
        }
      };

      processAddress((addressErr, addressResult) => {
        if (addressErr) {
          return db.rollback(() => {
            console.error('Error with address:', addressErr);
            res.status(500).json({ 
              error: 'Failed to process address',
              details: addressErr.message 
            });
          });
        }

        const finalAddressId = addressResult.insertId;

        // Insert payment method
        const {
          method_type,
          provider = null,
          card_number = null,
          paypal_email = null,
          bank_account = null,
          bank_name = null
        } = payment_method;

        const paymentQuery = `
          INSERT INTO payment_method (
            company_code, 
            customer_id, 
            method_type, 
            provider, 
            card_number,  
            paypal_email, 
            bank_account, 
            bank_name, 
            created_at, 
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const paymentValues = [
          company_code, 
          customer_id, 
          method_type, 
          provider,
          card_number,  
          paypal_email,
          bank_account, 
          bank_name, 
          new Date(), 
          new Date()
        ];

        db.query(paymentQuery, paymentValues, (paymentErr, paymentResult) => {
          if (paymentErr) {
            return db.rollback(() => {
              console.error('Error inserting payment method:', paymentErr);
              res.status(500).json({ 
                error: 'Failed to insert payment method',
                details: paymentErr.message 
              });
            });
          }

          const paymentMethodId = paymentResult.insertId;
          
          // Generate order number
          const orderNumber = `ORD-${Date.now()}-${customer_id}`;

          // Insert order
          const orderQuery = `
            INSERT INTO orders (
              company_code, 
              customer_id, 
              order_number, 
              address_id, 
              payment_method_id, 
              subtotal, 
              shipping_fee, 
              tax_amount, 
              total_amount, 
              total_items,
              order_status, 
              order_notes, 
              created_at, 
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `;

          const orderValues = [
            company_code, 
            customer_id,
            orderNumber, 
            finalAddressId,
            paymentMethodId, 
            subtotal || 0, 
            shipping_fee || 0, 
            tax_amount || 0, 
            total_amount, 
            order_items.reduce((sum, item) => sum + item.quantity, 0), // Total items
            'Pending', 
            order_notes,
            new Date(), new Date()
          ];

          db.query(orderQuery, orderValues, (orderErr, orderResult) => {
            if (orderErr) {
              return db.rollback(() => {
                console.error('Error inserting order:', orderErr);
                res.status(500).json({ 
                  error: 'Failed to create order',
                  details: orderErr.message 
                });
              });
            }

            const orderId = orderResult.insertId;

            // Insert order items
            const orderItemsQuery = `
              INSERT INTO order_items (
                company_code,
                order_id, 
                customer_id,
                variant_id, 
                sku,
                style_number,
                quantity, 
                unit_price, 
                total_price, 
                created_at, 
                updated_at
              ) VALUES ?
            `;

            const orderItemsValues = order_items.map(item => [
              company_code, 
              orderId, 
              customer_id,
              item.variant_id, 
              item.sku,
              item.style_number,
              item.quantity,
              item.unit_price, 
              item.total_price, 
              new Date(), 
              new Date()
            ]);

            db.query(orderItemsQuery, [orderItemsValues], (itemsErr, itemsResult) => {
              if (itemsErr) {
                return db.rollback(() => {
                  console.error('Error inserting order items:', itemsErr);
                  res.status(500).json({ 
                    error: 'Failed to insert order items',
                    details: itemsErr.message 
                  });
                });
              }

              // Get the starting order_item_id from the insert result
              const startingOrderItemId = itemsResult.insertId;

              const bookingQuery = `
                INSERT INTO booking (
                  company_code,
                  variant_id,
                  order_id,
                  sku,
                  ordered_qty,
                  created_at,
                  order_item_id,
                  style_number
                ) VALUES ?
              `;

              // Map each order item to its corresponding order_item_id
              const bookingValues = order_items.map((item, index) => [
                company_code,
                item.variant_id,
                orderId,
                item.sku,
                item.quantity,
                new Date(),
                startingOrderItemId + index, // Calculate the actual order_item_id
                item.style_number,
              ]);

              db.query(bookingQuery, [bookingValues], (bookingErr, bookingResult) => {
                if (bookingErr) {
                  return db.rollback(() => {
                    console.error('Error inserting booking:', bookingErr);
                    res.status(500).json({ 
                      error: 'Failed to create booking',
                      details: bookingErr.message 
                    });
                  });
                }

                // insert into payment
                const paymentQuery = `
                  INSERT INTO payment (
                    company_code,
                    customer_id,
                    order_id,
                    payment_method_id,
                    subtotal,
                    tax,
                    shipping_fee,
                    total,
                    payment_date
                  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;

                const paymentValues = [
                  company_code,
                  customer_id,
                  orderId,
                  paymentMethodId,
                  subtotal || 0,
                  tax_amount || 0,       
                  shipping_fee || 0,
                  total_amount || 0,
                  new Date()
                ];

                db.query(paymentQuery, paymentValues, (paymentErr, paymentResult) => {
                  if (paymentErr) {
                    return db.rollback(() => {
                      console.error('Error inserting payment:', paymentErr);
                      res.status(500).json({
                        error: 'Failed to create payment',
                        details: paymentErr.message
                      });
                    });
                  }

                  // Generate invoice number and insert invoice record
                  const invoiceNumber = generateUniqueInvoiceNumber(orderId);
                  const invoiceDate = new Date();

                  const invoiceQuery = `
                    INSERT INTO invoices (
                      company_code, 
                      customer_id, 
                      order_id, 
                      invoice_number, 
                      invoice_date, 
                      total_amount, 
                      created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?)
                  `;

                  const invoiceValues = [
                    company_code,
                    customer_id,
                    orderId,
                    invoiceNumber,
                    invoiceDate,
                    total_amount,
                    new Date()
                  ];

                  db.query(invoiceQuery, invoiceValues, (invoiceErr, invoiceResult) => {
                    if (invoiceErr) {
                      return db.rollback(() => {
                        console.error('Error inserting invoice:', invoiceErr);
                        res.status(500).json({
                          error: 'Failed to create invoice',
                          details: invoiceErr.message
                        });
                      });
                    }

                    const invoiceId = invoiceResult.insertId;

                    // Commit transaction 
                    db.commit((commitErr) => {
                      if (commitErr) {
                        return db.rollback(() => {
                          console.error('Transaction commit error:', commitErr);
                          res.status(500).json({ error: 'Failed to complete order' });
                        });
                      }

                      // Get customer email for sending invoice
                      const customerQuery = `
                        SELECT first_name, last_name, email FROM customers 
                        WHERE customer_id = ? AND company_code = ?
                      `;
                      
                      db.query(customerQuery, [customer_id, company_code], async (custErr, custResults) => {
                        if (!custErr && custResults.length > 0) {
                          const customer = custResults[0];
                          
                          // Fetch complete order items with size and color information
                          const completeItemsQuery = `
                            SELECT 
                              oi.*,
                              s.name as style_name,
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
                          
                          db.query(completeItemsQuery, [orderId, company_code], async (itemsErr, completeItems) => {
                            if (itemsErr) {
                              console.error('Error fetching complete order items:', itemsErr);
                              // Fall back to original items if query fails
                              completeItems = order_items;
                            }
                            
                            try {
                              // Generate and send invoice email with PDF (pass complete invoice data)
                              const emailResult = await generateAndSendInvoice(
                                {
                                  orderId: orderId,
                                  orderNumber: orderNumber,
                                  orderDate: new Date(),
                                  totalAmount: total_amount,
                                  subtotal: subtotal || 0,
                                  taxAmount: tax_amount || 0,
                                  shippingFee: shipping_fee || 0,
                                  items: completeItems, // Use complete items with size and color
                                  company_code: company_code,
                                  customer_id: customer_id,
                                  shippingAddress: { address_id: finalAddressId } // Add shipping address info
                                },
                                {
                                  firstName: customer.first_name,
                                  lastName: customer.last_name,
                                  email: customer.email,
                                  customer_id: customer_id
                                },
                                {
                                  invoiceDate: invoiceDate,
                                  invoiceNumber: invoiceNumber, // Pass the already generated invoice number
                                  invoiceId: invoiceId
                                }
                              );
                            
                              if (emailResult.success) {
                                console.log('Invoice email sent successfully to:', customer.email);
                              } else {
                                console.error('Failed to send invoice email:', emailResult.error);
                              }
                              
                            } catch (emailError) {
                              console.error('Error sending emails:', emailError);
                            }
                            
                            // Success response
                            res.status(201).json({ 
                              message: 'Order created successfully',
                              order_id: orderId,
                              order_number: orderNumber,
                              address_id: finalAddressId,
                              payment_method_id: paymentMethodId,
                              total_amount: total_amount,
                              order_status: 'Pending',
                              booking_count: bookingResult.affectedRows,
                              payment_date: new Date(),
                              invoice_id: invoiceId,
                              invoice_number: invoiceNumber
                            });
                          });
                        } else {
                          // No customer found, but still send success response
                          res.status(201).json({ 
                            message: 'Order created successfully',
                            order_id: orderId,
                            order_number: orderNumber,
                            address_id: finalAddressId,
                            payment_method_id: paymentMethodId,
                            total_amount: total_amount,
                            order_status: 'Pending',
                            booking_count: bookingResult.affectedRows,
                            payment_date: new Date(),
                            invoice_id: invoiceId,
                            invoice_number: invoiceNumber
                          });
                        }
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }
}

module.exports = CheckoutController;
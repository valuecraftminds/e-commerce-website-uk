const db = require('../../config/database');

const cartController = {
  addToCart: (req, res) => {
    const { name, price, sku, style_code, variant_id, quantity = 1 } = req.body;
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;


    // if (!style_code || !variant_id || quantity < 1) {
    //   return res.status(400).json({
    //     success: false,
    //     message: 'style_code, variant_id, and valid quantity are required'
    //   });
    // }

    const cartSql = `
      SELECT * FROM cart 
      WHERE company_code = ? AND variant_id = ? AND (customer_id = ? OR customer_id IS NULL)
    `;

    db.query(cartSql, [company_code, variant_id, customer_id], (cartErr, cartItems) => {
      if (cartErr) return res.status(500).json({ success: false, message: 'Server error' });

      if (cartItems.length > 0) {
        const cartItem = cartItems[0];
        const newQty = cartItem.quantity + parseInt(quantity);
        const updateSql = `
          UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?
        `;

        db.query(updateSql, [newQty, cartItem.cart_id], (updateErr) => {
          if (updateErr) return res.status(500).json({ success: false, message: 'Server error' });
          return res.json({
            success: true,
            message: 'Cart updated successfully',
            data: {
              db_name: company_code,
              company_code,
              variant_id,
              customer_id,
              quantity: newQty,
              price,
              sku,
              name
              
            }
          });
        });
      } else {
        const insertSql = `
          INSERT INTO cart (company_code, customer_id, style_code, variant_id, quantity, price, sku, name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        db.query(insertSql, [company_code, customer_id, style_code, variant_id, quantity], (insertErr) => {
          if (insertErr) return res.status(500).json({ success: false, message: 'Server error' });
          return res.json({
            success: true,
            message: 'Item added to cart successfully',
            data: {
              db_name: company_code,
              company_code,
              variant_id,
              customer_id,
              quantity: parseInt(quantity),
              price,
              name,
              sku
            }
          });
        });
      }
    });
  },

  // Get cart items
  getCart: (req, res) => {
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    const sql = `
      SELECT 
        c.cart_id,
        c.style_code,
        c.variant_id,
        c.quantity,
        c.created_at,
        s.style_id,
        s.name as style_name,
        s.description,
        s.image,
        sv.price,
        sv.stock_quantity,
        sv.sku,
        col.color_name,
        sz.size_name,
        m.material_name,
        f.fit_name
      FROM cart c
      JOIN style_variants sv ON c.variant_id = sv.variant_id
      JOIN styles s ON c.style_code = s.style_code
      LEFT JOIN colors col ON sv.color_id = col.color_id
      LEFT JOIN sizes sz ON sv.size_id = sz.size_id
      LEFT JOIN materials m ON sv.material_id = m.material_id
      LEFT JOIN fits f ON sv.fit_id = f.fit_id
      WHERE c.company_code = ?
      AND c.customer_id ${customer_id ? '= ?' : 'IS NULL'}
      AND s.approved = 'yes'
      AND sv.is_active = 1
      ORDER BY c.created_at DESC
    `;

    const params = customer_id ? [company_code, customer_id] : [company_code];

    db.query(sql, params, (err, results) => {
      if (err) {
        console.error('Error fetching cart:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      const cartItems = results.map(item => ({
        ...item,
        total_price: parseFloat(item.price) * item.quantity
      }));

      const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
      const totalAmount = cartItems.reduce((sum, item) => sum + item.total_price, 0);

      res.json({
        success: true,
        cart: cartItems,
        summary: {
          total_items: totalItems,
          total_amount: totalAmount.toFixed(2)
        }
      });
    });
  },

  // Update cart item quantity
  updateCartItem: (req, res) => {
    const { cart_id } = req.params;
    const { quantity } = req.body;
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity is required'
      });
    }

    const sql = `
      UPDATE cart 
      SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
      WHERE cart_id = ? 
      AND company_code = ? 
      AND (customer_id = ? OR customer_id IS NULL)
    `;

    db.query(sql, [quantity, cart_id, company_code, customer_id], (err, result) => {
      if (err) {
        console.error('Error updating cart:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      res.json({
        success: true,
        message: 'Cart updated successfully'
      });
    });
  },

  // Remove item from cart
  removeFromCart: (req, res) => {
    const { cart_id } = req.params;
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    const sql = `
      DELETE FROM cart 
      WHERE cart_id = ? 
      AND company_code = ? 
      AND (customer_id = ? OR customer_id IS NULL)
    `;

    db.query(sql, [cart_id, company_code, customer_id], (err, result) => {
      if (err) {
        console.error('Error removing from cart:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({
          success: false,
          message: 'Cart item not found'
        });
      }

      res.json({
        success: true,
        message: 'Item removed from cart successfully'
      });
    });
  },

  // Clear entire cart
  clearCart: (req, res) => {
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    const sql = `
      DELETE FROM cart 
      WHERE company_code = ? 
      AND (customer_id = ? OR customer_id IS NULL)
    `;

    db.query(sql, [company_code, customer_id], (err, result) => {
      if (err) {
        console.error('Error clearing cart:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        cleared_items: result.affectedRows
      });
    });
  },

//merge guest cart 
mergeGuestCart: (req, res) => {
    const { guest_cart } = req.body;
    const { company_code } = req.query;
    const customer_id = req.user?.id;

    if (!customer_id) {
      return res.status(401).json({
        success: false,
        message: 'User must be logged in to merge cart'
      });
    }

    if (!guest_cart || !Array.isArray(guest_cart)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid guest cart data'
      });
    }

    if (guest_cart.length === 0) {
      return res.json({
        success: true,
        message: 'No guest cart items to merge',
        data: {
          db_name: company_code,
          company_code,
          customer_id,
          processed_items: 0
        }
      });
    }

    let processedItems = 0;
    let errors = [];
    let mergedItems = [];

    const processGuestItem = (guestItem, callback) => {
      const { style_code, variant_id, quantity } = guestItem;

      const checkCartSql = `
        SELECT * FROM cart 
        WHERE company_code = ? 
        AND variant_id = ? 
        AND customer_id = ?
      `;
      
      db.query(checkCartSql, [company_code, variant_id, customer_id], (cartErr, cartResults) => {
        if (cartErr) {
          errors.push(`Error checking cart for variant ${variant_id}: ${cartErr.message}`);
          return callback();
        }

        if (cartResults.length > 0) {
          const cartItem = cartResults[0];
          const newQuantity = cartItem.quantity + parseInt(quantity);
          const updateSql = `
            UPDATE cart 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE cart_id = ?
          `;

          db.query(updateSql, [newQuantity, cartItem.cart_id], (updateErr) => {
            if (updateErr) {
              errors.push(`Error updating cart for variant ${variant_id}: ${updateErr.message}`);
            } else {
              processedItems++;
              mergedItems.push({
                db_name: company_code,
                company_code,
                variant_id,
                customer_id,
                quantity: newQuantity
              });
            }
            callback();
          });
        } else {
          const insertSql = `
            INSERT INTO cart (company_code, customer_id, style_code, variant_id, quantity)
            VALUES (?, ?, ?, ?, ?)
          `;
          db.query(insertSql, [company_code, customer_id, style_code, variant_id, quantity], (insertErr) => {
            if (insertErr) {
              errors.push(`Error adding variant ${variant_id} to cart: ${insertErr.message}`);
            } else {
              processedItems++;
              mergedItems.push({
                db_name: company_code,
                company_code,
                variant_id,
                customer_id,
                quantity: parseInt(quantity)
              });
            }
            callback();
          });
        }
      });
    };

    // Start processing all items
    let completed = 0;
    guest_cart.forEach((item) => {
      processGuestItem(item, () => {
        completed++;
        if (completed === guest_cart.length) {
          const response = {
            success: true,
            message:
              errors.length > 0
                ? `Cart merged with ${processedItems} items. ${errors.length} items had errors.`
                : `Successfully merged ${processedItems} items to your cart`,
            data: {
              db_name: company_code,
              company_code,
              customer_id,
              processed_items: processedItems,
              merged_items: mergedItems
            }
          };
          
          if (errors.length > 0) {
            response.data.errors = errors;
            console.error('Cart merge errors:', errors);
          }

          return res.json(response);
        }
      });
    });
  }
};

module.exports = cartController;
const db = require('../../config/database');

const cartController = {
  // Add item to cart
  addToCart: (req, res) => {
    const { style_code, variant_id, quantity = 1 } = req.body;
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    if (!style_code || !variant_id || quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'style_code, variant_id, and valid quantity are required'
      });
    }

    // Verify variant exists
    const checkVariantSql = `
      SELECT sv.*, s.name as style_name, s.image, c.color_name, sz.size_name
      FROM style_variants sv
      JOIN styles s ON sv.style_code = s.style_code
      LEFT JOIN colors c ON sv.color_id = c.color_id
      LEFT JOIN sizes sz ON sv.size_id = sz.size_id
      WHERE sv.variant_id = ? 
      AND sv.style_code = ? 
      AND s.company_code = ?
      AND sv.is_active = 1
    `;

    db.query(checkVariantSql, [variant_id, style_code, company_code], (err, variantResults) => {
      if (err) {
        console.error('Error checking variant:', err);
        return res.status(500).json({ success: false, message: 'Server error' });
      }

      if (variantResults.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Product variant not found or not available'
        });
      }

      // Check if item exists in cart
      const checkCartSql = `
        SELECT * FROM cart 
        WHERE company_code = ? 
        AND variant_id = ? 
        AND (customer_id = ? OR customer_id IS NULL)
      `;

      db.query(checkCartSql, [company_code, variant_id, customer_id], (cartErr, cartResults) => {
        if (cartErr) {
          console.error('Error checking cart:', cartErr);
          return res.status(500).json({ success: false, message: 'Server error' });
        }

        if (cartResults.length > 0) {
          // Update existing cart item
          const newQuantity = cartResults[0].quantity + parseInt(quantity);
          const updateSql = `
            UPDATE cart 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE cart_id = ?
          `;

          db.query(updateSql, [newQuantity, cartResults[0].cart_id], (updateErr) => {
            if (updateErr) {
              console.error('Error updating cart:', updateErr);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            res.json({
              success: true,
              message: 'Cart updated successfully',
              cart_id: cartResults[0].cart_id,
              quantity: newQuantity
            });
          });
        } else {
          // Add new cart item
          const insertSql = `
            INSERT INTO cart (company_code, customer_id, style_code, variant_id, quantity)
            VALUES (?, ?, ?, ?, ?)
          `;

          db.query(insertSql, [company_code, customer_id, style_code, variant_id, quantity], (insertErr, result) => {
            if (insertErr) {
              console.error('Error adding to cart:', insertErr);
              return res.status(500).json({ success: false, message: 'Server error' });
            }

            res.json({
              success: true,
              message: 'Item added to cart successfully',
              cart_id: result.insertId,
              quantity: quantity
            });
          });
        }
      });
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
      message: 'No guest cart items to merge'
    });
  }

  // Process each guest cart item
  let processedItems = 0;
  let errors = [];

  const processGuestItem = (guestItem, callback) => {
    const { style_code, variant_id, quantity } = guestItem;

    // Verify variant exists and is active
    const checkVariantSql = `
      SELECT sv.*, s.name as style_name
      FROM style_variants sv
      JOIN styles s ON sv.style_code = s.style_code
      WHERE sv.variant_id = ? 
      AND sv.style_code = ? 
      AND s.company_code = ?
      AND sv.is_active = 1
    `;

    db.query(checkVariantSql, [variant_id, style_code, company_code], (err, variantResults) => {
      if (err) {
        errors.push(`Error checking variant ${variant_id}: ${err.message}`);
        return callback();
      }

      if (variantResults.length === 0) {
        errors.push(`Variant ${variant_id} not found or inactive`);
        return callback();
      }

      // Check if item already exists in user's cart
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
          // Update existing cart item
          const newQuantity = cartResults[0].quantity + parseInt(quantity);
          const updateSql = `
            UPDATE cart 
            SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
            WHERE cart_id = ?
          `;

          db.query(updateSql, [newQuantity, cartResults[0].cart_id], (updateErr) => {
            if (updateErr) {
              errors.push(`Error updating cart for variant ${variant_id}: ${updateErr.message}`);
            } else {
              processedItems++;
            }
            callback();
          });
        } else {
          // Add new cart item
          const insertSql = `
            INSERT INTO cart (company_code, customer_id, style_code, variant_id, quantity, name)
            VALUES (?, ?, ?, ?, ?, ?)
          `;

          db.query(insertSql, [company_code, customer_id, style_code, variant_id, quantity, name], (insertErr) => {
            if (insertErr) {
              errors.push(`Error adding variant ${variant_id} to cart: ${insertErr.message}`);
            } else {
              processedItems++;
            }
            callback();
          });
        }
      });
    });
  };

  // Process all guest cart items
  let completed = 0;
  guest_cart.forEach((guestItem) => {
    processGuestItem(guestItem, () => {
      completed++;
      if (completed === guest_cart.length) {
        // All items processed, send response
        if (errors.length > 0) {
          console.error('Cart merge errors:', errors);
          res.json({
            success: true,
            message: `Cart merged with ${processedItems} items. ${errors.length} items had errors.`,
            processed_items: processedItems,
            errors: errors
          });
        } else {
          res.json({
            success: true,
            message: `Successfully merged ${processedItems} items to your cart`,
            processed_items: processedItems
          });
        }
      }
    });
  });
}
}

module.exports = cartController;
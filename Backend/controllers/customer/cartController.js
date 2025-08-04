const db = require('../../config/database');

const cartController = {
  addToCart: async (req, res) => {
    const { name, price, sku, style_code, variant_id, quantity = 1 } = req.body;
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    try {
      const cartSql = `
        SELECT * FROM cart 
        WHERE company_code = ? AND variant_id = ? AND (customer_id = ? OR customer_id IS NULL)
      `;

      const [cartItems] = await db.query(cartSql, [company_code, variant_id, customer_id]);

      if (cartItems.length > 0) {
        const cartItem = cartItems[0];
        const newQty = cartItem.quantity + parseInt(quantity);
        const updateSql = `
          UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?
        `;

        await db.query(updateSql, [newQty, cartItem.cart_id]);
        
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
      } else {
        const insertSql = `
          INSERT INTO cart (company_code, customer_id, style_code, variant_id, quantity, price, sku, name)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;

        await db.query(insertSql, [company_code, customer_id, style_code, variant_id, quantity, price, sku, name]);
        
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
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Get cart items
  getCart: async (req, res) => {
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    try {
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
      const [results] = await db.query(sql, params);

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
    } catch (error) {
      console.error('Error fetching cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Update cart item quantity
  updateCartItem: async (req, res) => {
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

    try {
      const sql = `
        UPDATE cart 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE cart_id = ? 
        AND company_code = ? 
        AND (customer_id = ? OR customer_id IS NULL)
      `;

      const [result] = await db.query(sql, [quantity, cart_id, company_code, customer_id]);

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
    } catch (error) {
      console.error('Error updating cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Remove item from cart
  removeFromCart: async (req, res) => {
    const { cart_id } = req.params;
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    try {
      const sql = `
        DELETE FROM cart 
        WHERE cart_id = ? 
        AND company_code = ? 
        AND (customer_id = ? OR customer_id IS NULL)
      `;

      const [result] = await db.query(sql, [cart_id, company_code, customer_id]);

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
    } catch (error) {
      console.error('Error removing from cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Clear entire cart
  clearCart: async (req, res) => {
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    try {
      const sql = `
        DELETE FROM cart 
        WHERE company_code = ? 
        AND (customer_id = ? OR customer_id IS NULL)
      `;

      const [result] = await db.query(sql, [company_code, customer_id]);

      res.json({
        success: true,
        message: 'Cart cleared successfully',
        cleared_items: result.affectedRows
      });
    } catch (error) {
      console.error('Error clearing cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  // Merge guest cart 
  mergeGuestCart: async (req, res) => {
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

    try {
      for (const guestItem of guest_cart) {
        const { style_code, variant_id, quantity } = guestItem;

        try {
          const checkCartSql = `
            SELECT * FROM cart 
            WHERE company_code = ? 
            AND variant_id = ? 
            AND customer_id = ?
          `;
          
          const [cartResults] = await db.query(checkCartSql, [company_code, variant_id, customer_id]);

          if (cartResults.length > 0) {
            const cartItem = cartResults[0];
            const newQuantity = cartItem.quantity + parseInt(quantity);
            const updateSql = `
              UPDATE cart 
              SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
              WHERE cart_id = ?
            `;

            await db.query(updateSql, [newQuantity, cartItem.cart_id]);
            processedItems++;
            mergedItems.push({
              db_name: company_code,
              company_code,
              variant_id,
              customer_id,
              quantity: newQuantity
            });
          } else {
            const insertSql = `
              INSERT INTO cart (company_code, customer_id, style_code, variant_id, quantity)
              VALUES (?, ?, ?, ?, ?)
            `;
            await db.query(insertSql, [company_code, customer_id, style_code, variant_id, quantity]);
            processedItems++;
            mergedItems.push({
              db_name: company_code,
              company_code,
              variant_id,
              customer_id,
              quantity: parseInt(quantity)
            });
          }
        } catch (itemError) {
          errors.push(`Error processing variant ${variant_id}: ${itemError.message}`);
        }
      }

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
    } catch (error) {
      console.error('Error merging guest cart:', error);
      return res.status(500).json({ success: false, message: 'Server error during cart merge' });
    }
  }
};

module.exports = cartController;
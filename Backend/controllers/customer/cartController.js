const db = require('../../config/database'); // Ensure this uses mysql2/promise

const cartController = {
  addToCart: async (req, res) => {
    const {
      customer_id = req.user?.id,
      style_code,
      variant_id,
      quantity = 1,
      price,
      product_name,
      color_name = null,
      image = null
    } = req.body;

    const { company_code } = req.query;

    if (!company_code || !variant_id || !price || !product_name || !customer_id) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: company_code, variant_id, price, product_name, or customer_id'
      });
    }

    const currency = 'USD';
    const is_available = true;
    const product_url = null;
    const tax = 0.00;
    const shipping_fee = 0.00;
    const sku = style_code || null;

    try {
      const selectSql = `
        SELECT * FROM cart 
        WHERE company_code = ? AND variant_id = ? AND customer_id = ?
      `;
      const [existing] = await db.query(selectSql, [company_code, variant_id, customer_id]);

      if (existing.length > 0) {
        const existingItem = existing[0];
        const updatedQty = existingItem.quantity + Number(quantity);

        const updateSql = `
          UPDATE cart 
          SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE cart_id = ?
        `;
        await db.query(updateSql, [updatedQty, existingItem.cart_id]);

        return res.status(200).json({
          success: true,
          message: 'Cart item updated',
          data: { cart_id: existingItem.cart_id, company_code, customer_id, variant_id, quantity: updatedQty, price, product_name, sku }
        });
      } else {
        const insertSql = `
          INSERT INTO cart (
            company_code, customer_id, product_name, variant_id, quantity,
            color_name, price, image, currency, product_url, tax,
            shipping_fee, is_available, sku
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const insertParams = [company_code, customer_id, product_name, variant_id, quantity, color_name, price, image, currency, product_url, tax, shipping_fee, is_available, sku];
        const [result] = await db.query(insertSql, insertParams);

        return res.status(201).json({
          success: true,
          message: 'Cart item added',
          data: { cart_id: result.insertId, company_code, customer_id, variant_id, quantity, price, product_name, sku }
        });
      }
    } catch (error) {
      console.error('Error in addToCart:', error);
      return res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
    }
  },

  getCart: async (req, res) => {
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    if (!company_code) {
      return res.status(400).json({ success: false, message: 'company_code is required' });
    }

    try {
      const sql = `
        SELECT 
          c.*, s.style_id, s.style_code, s.name AS style_name, s.description AS style_description, s.image AS style_image,
          sv.price AS variant_price, sv.stock_quantity, sv.sku AS variant_sku,
          col.color_name AS variant_color, sz.size_name, m.material_name, f.fit_name
        FROM cart c
        JOIN style_variants sv ON c.variant_id = sv.variant_id
        JOIN styles s ON s.style_code = sv.style_code
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

      const cartItems = results.map(item => {
        const subtotal = item.price * item.quantity;
        const total = subtotal + (item.tax || 0) + (item.shipping_fee || 0);
        return { ...item, subtotal: subtotal.toFixed(2), total_price: total.toFixed(2) };
      });

      const totalItems = cartItems.reduce((sum, i) => sum + i.quantity, 0);
      const totalAmount = cartItems.reduce((sum, i) => sum + parseFloat(i.total_price), 0);

      return res.json({
        success: true,
        cart: cartItems,
        summary: { total_items: totalItems, total_amount: totalAmount.toFixed(2) }
      });
    } catch (error) {
      console.error('Error fetching cart:', error);
      return res.status(500).json({ success: false, message: 'Server error while retrieving cart', error: error.message });
    }
  },

  updateCartItem: async (req, res) => {
    const { cart_id } = req.params;
    const { quantity } = req.body;
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    if (!quantity || quantity < 1) {
      return res.status(400).json({ success: false, message: 'Valid quantity is required' });
    }

    try {
      const sql = `
        UPDATE cart 
        SET quantity = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE cart_id = ? AND company_code = ? AND (customer_id = ? OR customer_id IS NULL)
      `;
      const [result] = await db.query(sql, [quantity, cart_id, company_code, customer_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Cart item not found' });
      }

      res.json({ success: true, message: 'Cart updated successfully' });
    } catch (error) {
      console.error('Error updating cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  removeFromCart: async (req, res) => {
    const { cart_id } = req.params;
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    try {
      const sql = `
        DELETE FROM cart 
        WHERE cart_id = ? AND company_code = ? AND (customer_id = ? OR customer_id IS NULL)
      `;
      const [result] = await db.query(sql, [cart_id, company_code, customer_id]);

      if (result.affectedRows === 0) {
        return res.status(404).json({ success: false, message: 'Cart item not found' });
      }

      res.json({ success: true, message: 'Item removed from cart successfully' });
    } catch (error) {
      console.error('Error removing from cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  clearCart: async (req, res) => {
    const { company_code } = req.query;
    const customer_id = req.user?.id || null;

    try {
      const sql = `
        DELETE FROM cart 
        WHERE company_code = ? AND (customer_id = ? OR customer_id IS NULL)
      `;
      const [result] = await db.query(sql, [company_code, customer_id]);

      res.json({ success: true, message: 'Cart cleared successfully', cleared_items: result.affectedRows });
    } catch (error) {
      console.error('Error clearing cart:', error);
      return res.status(500).json({ success: false, message: 'Server error' });
    }
  },

  mergeGuestCart: async (req, res) => {
    const { guest_cart } = req.body;
    const { company_code } = req.query;
    const customer_id = req.user?.id;

    if (!customer_id) {
      return res.status(401).json({ success: false, message: 'User must be logged in to merge cart' });
    }

    if (!guest_cart || !Array.isArray(guest_cart)) {
      return res.status(400).json({ success: false, message: 'Invalid guest cart data' });
    }

    if (guest_cart.length === 0) {
      return res.json({
        success: true,
        message: 'No guest cart items to merge',
        data: { company_code, customer_id, processed_items: 0 }
      });
    }

    let processedItems = 0;
    let errors = [];
    let mergedItems = [];
    let bulkInsertValues = [];

    try {
      for (const item of guest_cart) {
        const { style_code, variant_id, quantity } = item;

        if (!style_code || !variant_id || !quantity) {
          errors.push(`Missing fields for variant_id: ${variant_id}`);
          continue;
        }

        const checkSql = `
          SELECT * FROM cart 
          WHERE company_code = ? AND variant_id = ? AND customer_id = ?
        `;
        const [existing] = await db.query(checkSql, [company_code, variant_id, customer_id]);

        if (existing.length > 0) {
          const existingItem = existing[0];
          const updatedQty = existingItem.quantity + parseInt(quantity);
          await db.query(
            `UPDATE cart SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE cart_id = ?`,
            [updatedQty, existingItem.cart_id]
          );

          mergedItems.push({ company_code, customer_id, variant_id, quantity: updatedQty, status: 'updated' });
          processedItems++;
        } else {
          bulkInsertValues.push([
            company_code, customer_id, item.product_name || null, variant_id, parseInt(quantity),
            item.color_name || null, item.price || 0.00, item.image || null, item.currency || 'USD',
            item.product_url || null, item.tax || 0.00, item.shipping_fee || 0.00,
            item.is_available !== undefined ? item.is_available : true, style_code
          ]);
          mergedItems.push({ company_code, customer_id, variant_id, quantity: parseInt(quantity), status: 'inserted' });
          processedItems++;
        }
      }

      if (bulkInsertValues.length > 0) {
        await db.query(`
          INSERT INTO cart (
            company_code, customer_id, product_name, variant_id, quantity,
            color_name, price, image, currency, product_url, tax,
            shipping_fee, is_available, sku
          ) VALUES ?
        `, [bulkInsertValues]);
      }

      const response = {
        success: true,
        message: errors.length
          ? `Cart merged with ${processedItems} items. ${errors.length} had issues.`
          : `Successfully merged ${processedItems} items.`,
        data: { company_code, customer_id, processed_items: processedItems, merged_items: mergedItems }
      };

      if (errors.length > 0) response.data.errors = errors;

      return res.json(response);
    } catch (error) {
      console.error('Error merging guest cart:', error);
      return res.status(500).json({ success: false, message: 'Server error during cart merge', error: error.message });
    }
  }
};

module.exports = cartController;

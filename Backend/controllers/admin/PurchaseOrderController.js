const db = require('../../config/database');

const PurchaseOrderController = {
    // Generate next PO number
    async generatePONumber(company_code) {
        return new Promise((resolve, reject) => {
            const sql = `
                SELECT po_number 
                FROM purchase_orders 
                WHERE company_code = ? 
                ORDER BY created_at DESC 
                LIMIT 1`;
            
            db.query(sql, [company_code], (err, results) => {
                if (err) return reject(err);
                
                let nextNumber = 1;
                if (results.length > 0) {
                    const lastNumber = parseInt(results[0].po_number.split('-')[1]);
                    nextNumber = lastNumber + 1;
                }
                
                resolve(`PO-${String(nextNumber).padStart(3, '0')}`);
            });
        });
    },

    // Get all purchase orders
    async getPurchaseOrders(req, res) {
        const { company_code, po_number, supplier_id, from_date, to_date } = req.query;
        
        let sql = `
            SELECT po.*, 
                   s.supplier_name,
                   COUNT(DISTINCT po.sku) as total_styles,
                   SUM(po.quantity) as total_quantity,
                   SUM(po.total_price) as total_cost
            FROM purchase_orders po
            LEFT JOIN suppliers s ON po.supplier_id = s.supplier_id
            WHERE po.company_code = ?
        `;
        
        const params = [company_code];

        if (po_number) {
            sql += ` AND po.po_number LIKE ?`;
            params.push(`%${po_number}%`);
        }
        if (supplier_id) {
            sql += ` AND po.supplier_id = ?`;
            params.push(supplier_id);
        }
        if (from_date) {
            sql += ` AND DATE(po.created_at) >= ?`;
            params.push(from_date);
        }
        if (to_date) {
            sql += ` AND DATE(po.created_at) <= ?`;
            params.push(to_date);
        }

        sql += ` GROUP BY po.po_number ORDER BY po.created_at DESC`;

        db.query(sql, params, (err, results) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching purchase orders',
                    error: err.message 
                });
            }
            res.json({ success: true, purchase_orders: results });
        });
    },

    // Create purchase order
    async createPurchaseOrder(req, res) {
        const { company_code, supplier_id, attention, remark, sku, quantity, unit_price } = req.body;

        if (!company_code || !supplier_id || !attention || !sku || !quantity || !unit_price) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required fields' 
            });
        }

        const total_price = quantity * unit_price;

        try {
            // First check for existing recent PO
            const checkSql = `
                SELECT po_number FROM purchase_orders 
                WHERE company_code = ? AND supplier_id = ? 
                AND created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR)
                ORDER BY created_at DESC LIMIT 1
            `;

            db.query(checkSql, [company_code, supplier_id], async (err, results) => {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error checking existing PO',
                        error: err.message 
                    });
                }

                let poNumber;
                if (results.length > 0) {
                    poNumber = results[0].po_number;
                } else {
                    try {
                        poNumber = await PurchaseOrderController.generatePONumber(company_code);
                    } catch (err) {
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error generating PO number',
                            error: err.message 
                        });
                    }
                }

                const sql = `
                    INSERT INTO purchase_orders (
                        company_code, po_number, attention, supplier_id, 
                        remark, sku, quantity, unit_price, total_price,
                        status, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending', NOW(), NOW())
                `;
                
                db.query(sql, [
                    company_code, poNumber, attention, supplier_id,
                    remark, sku, quantity, unit_price, total_price
                ], (err, result) => {
                    if (err) {
                        return res.status(500).json({ 
                            success: false, 
                            message: 'Error creating purchase order',
                            error: err.message 
                        });
                    }
                    res.json({ 
                        success: true, 
                        message: 'Purchase order line added', 
                        po_number: poNumber 
                    });
                });
            });
        } catch (err) {
            res.status(500).json({ 
                success: false, 
                message: 'Error processing purchase order',
                error: err.message 
            });
        }
    },

    // Update purchase order
    async updatePurchaseOrder(req, res) {
        const { po_number } = req.params;
        const { attention, supplier_id, remark, items, status } = req.body;

        try {
            // Delete existing items
            await new Promise((resolve, reject) => {
                db.query('DELETE FROM purchase_orders WHERE po_number = ?', 
                    [po_number], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
            });

            // Insert updated items
            const insertPromises = items.map(item => {
                return new Promise((resolve, reject) => {
                    const sql = `
                        INSERT INTO purchase_orders (
                            company_code, po_number, attention, supplier_id,
                            remark, sku, quantity, unit_price, total_price, status, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                    `;
                    
                    const total_price = item.quantity * item.unit_price;

                    db.query(sql, [
                        item.company_code, po_number, attention, supplier_id,
                        remark, item.sku, item.quantity, item.unit_price, total_price, status || 'Pending'
                    ], (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });
            });

            await Promise.all(insertPromises);
            res.json({ success: true, message: 'Purchase order updated' });
        } catch (err) {
            res.status(500).json({ 
                success: false, 
                message: 'Error updating purchase order',
                error: err.message 
            });
        }
    },

    // Delete purchase order
    deletePurchaseOrder(req, res) {
        const { po_number } = req.params;
        
        db.query('DELETE FROM purchase_orders WHERE po_number = ?', 
            [po_number], (err) => {
                if (err) {
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error deleting purchase order',
                        error: err.message 
                    });
                }
                res.json({ success: true, message: 'Purchase order deleted' });
            });
    },

    // Get purchase order details
    getPurchaseOrderDetails(req, res) {
        const { po_number } = req.params;
        
        const sql = `
            SELECT po.*,
                   sv.unit_price,
                   s.style_code,
                   s.name as style_name,
                   c.color_name,
                   sz.size_name,
                   f.fit_name
            FROM purchase_orders po
            LEFT JOIN style_variants sv ON po.sku = sv.sku
            LEFT JOIN styles s ON sv.style_code = s.style_code
            LEFT JOIN colors c ON sv.color_id = c.color_id
            LEFT JOIN sizes sz ON sv.size_id = sz.size_id
            LEFT JOIN fits f ON sv.fit_id = f.fit_id
            WHERE po.po_number = ?
        `;
        
        db.query(sql, [po_number], (err, results) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching purchase order details',
                    error: err.message 
                });
            }
            res.json({ success: true, details: results });
        });
    }
};

module.exports = PurchaseOrderController;
const db = require('../../config/database');
const PurchaseOrderController = require('./PurchaseOrderController');

class GRNController {
    // Get remaining_qty for a PO item with tolerance calculation
    static async getRemainingQty(req, res) {
        const { po_number, sku } = req.query;
        if (!po_number || !sku) {
            return res.status(400).json({ success: false, message: 'Missing po_number or sku' });
        }

        try {
            // Get PO details including tolerance_limit
            const poDetails = await new Promise((resolve, reject) => {
                const reqObj = { params: { po_number } };
                const resObj = {
                    json: (data) => resolve(data),
                    status: (code) => ({ json: (data) => reject(data) })
                };
                PurchaseOrderController.getPurchaseOrderDetails(reqObj, resObj);
            });

            if (!poDetails.success) {
                return res.status(404).json({ success: false, message: 'PO not found' });
            }

            // Find the specific item
            const poItem = poDetails.items.find(item => item.sku === sku);
            if (!poItem) {
                return res.status(404).json({ success: false, message: 'SKU not found in PO' });
            }

            const ordered_qty = poItem.quantity;
            const tolerance_limit = parseFloat(poDetails.header.tolerance_limit) || 0;
            const max_qty = Math.floor(ordered_qty + (ordered_qty * tolerance_limit / 100));

            // Get total received_qty from grn_items
            const sqlGRN = 'SELECT SUM(received_qty) as total_received FROM grn_items WHERE po_number = ? AND sku = ?';
            db.query(sqlGRN, [po_number, sku], (err, grnResults) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error fetching GRN items', error: err.message });
                }
                
                const total_received = grnResults[0]?.total_received || 0;
                const remaining_qty = max_qty - total_received;
                
                res.json({ 
                    success: true, 
                    po_number, 
                    sku, 
                    ordered_qty, 
                    tolerance_limit,
                    max_qty,
                    total_received, 
                    remaining_qty: Math.max(0, remaining_qty)
                });
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error fetching PO details', error: error.message });
        }
    }

    // Search PO numbers
    static async searchPO(req, res) {
        const { company_code, po_number } = req.query;
        let sql = `SELECT po_number, supplier_id, created_at FROM purchase_order_headers WHERE company_code = ?`;
        const params = [company_code];
        
        if (po_number) {
            sql += ' AND po_number LIKE ?';
            params.push(`%${po_number}%`);
        }
        
        sql += ' ORDER BY created_at DESC LIMIT 10';
        
        db.query(sql, params, (err, results) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error searching PO numbers', error: err.message });
            }
            res.json({ success: true, purchase_orders: results });
        });
    }

    // Get PO details (reuse PurchaseOrderController)
    static async getPODetails(req, res) {
        return PurchaseOrderController.getPurchaseOrderDetails(req, res);
    }

    // Validate GRN item before adding
    static async validateGRNItem(req, res) {
        const { po_number, sku, received_qty, company_code } = req.body;
        // Add error logging for debugging
        console.log('validateGRNItem called with:', req.body);

        // Defensive: ensure received_qty is a valid integer
        const receivedQty = parseInt(received_qty);

        if (!po_number || !sku || isNaN(receivedQty) || receivedQty <= 0 || !company_code) {
            console.error('Missing or invalid fields:', { po_number, sku, received_qty, company_code });
            return res.status(400).json({ 
                success: false, 
                message: 'Missing or invalid required fields: po_number, sku, received_qty (>0), company_code' 
            });
        }

        try {
            // Get remaining quantity with tolerance
            const remainingResponse = await new Promise((resolve, reject) => {
                const reqObj = { query: { po_number, sku } };
                const resObj = {
                    json: (data) => resolve(data),
                    status: (code) => ({ json: (data) => reject(data) })
                };
                GRNController.getRemainingQty(reqObj, resObj);
            });

            if (!remainingResponse.success) {
                console.error('getRemainingQty failed:', remainingResponse);
                return res.status(400).json(remainingResponse);
            }

            const { remaining_qty, max_qty, ordered_qty, tolerance_limit } = remainingResponse;

            // Validation checks
            if (receivedQty > remaining_qty) {
                console.error(`Received quantity (${receivedQty}) exceeds remaining (${remaining_qty})`);
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot receive ${receivedQty} items. Only ${remaining_qty} items remaining (Max: ${max_qty}, Ordered: ${ordered_qty}, Tolerance: ${tolerance_limit}%)` 
                });
            }

            res.json({ 
                success: true, 
                message: 'Item validated successfully',
                validation_details: {
                    ordered_qty,
                    max_qty,
                    tolerance_limit,
                    remaining_qty,
                    received_qty: receivedQty
                }
            });

        } catch (error) {
            console.error('Error in validateGRNItem:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error validating GRN item', 
                error: error.message 
            });
        }
    }

    // Create GRN record (header + items)
    static async createGRN(req, res) {
        const { 
            po_number, 
            grn_items, 
            warehouse_user_id, 
            company_code, 
            received_date, 
            batch_number, 
            invoice_number 
        } = req.body;

        // Validation
        if (!po_number || !Array.isArray(grn_items) || grn_items.length === 0 || !warehouse_user_id || !company_code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing required GRN data' 
            });
        }

        // Generate GRN ID
        const generateGRNId = async () => {
            return new Promise((resolve, reject) => {
                const sql = `SELECT grn_id FROM grn WHERE company_code = ? ORDER BY created_at DESC LIMIT 1`;
                db.query(sql, [company_code], (err, results) => {
                    if (err) return reject(err);
                    
                    let nextNumber = 1;
                    if (results.length > 0) {
                        const lastGrnId = results[0].grn_id;
                        const parts = lastGrnId.split('-');
                        const numberPart = parts[2];
                        if (numberPart && !isNaN(parseInt(numberPart))) {
                            nextNumber = parseInt(numberPart) + 1;
                        }
                    }
                    const newGrnId = `GRN-${company_code}-${String(nextNumber).padStart(3, '0')}`;
                    resolve(newGrnId);
                });
            }); 
        };

        // Validate all items before processing
        for (let idx = 0; idx < grn_items.length; idx++) {
            const item = grn_items[idx];
            if (!item.sku || !item.style_code || isNaN(parseInt(item.received_qty)) || parseInt(item.received_qty) <= 0) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Invalid GRN item at index ${idx}. Check SKU, style_code, and received_qty` 
                });
            }
        }

        // Get PO details for tolerance validation
        let poDetails;
        try {
            poDetails = await new Promise((resolve, reject) => {
                const reqObj = { params: { po_number } };
                const resObj = {
                    json: (data) => resolve(data),
                    status: (code) => ({ json: (data) => reject(data) })
                };
                PurchaseOrderController.getPurchaseOrderDetails(reqObj, resObj);
            });
        } catch (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error fetching PO details', 
                error: err.message 
            });
        }

        if (!poDetails.success) {
            return res.status(404).json({ 
                success: false, 
                message: 'Purchase Order not found' 
            });
        }

        // Create maps for validation
        const orderedQtyMap = {};
        const tolerance_limit = parseFloat(poDetails.header.tolerance_limit) || 0;

        poDetails.items.forEach(item => {
            orderedQtyMap[item.sku] = {
                ordered_qty: item.quantity,
                max_qty: Math.floor(item.quantity + (item.quantity * tolerance_limit / 100))
            };
        });

        // Generate GRN ID
        let grn_id;
        try {
            grn_id = await generateGRNId();
        } catch (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Error generating GRN ID', 
                error: err.message 
            });
        }

        const grnReceivedDate = received_date ? new Date(received_date) : new Date();

        // Start transaction
        db.beginTransaction(async (err) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error starting transaction', 
                    error: err.message 
                });
            }

            try {
                // Validate each item against remaining quantities
                for (const item of grn_items) {
                    const remainingResponse = await new Promise((resolve, reject) => {
                        const reqObj = { query: { po_number, sku: item.sku } };
                        const resObj = {
                            json: (data) => resolve(data),
                            status: (code) => ({ json: (data) => reject(data) })
                        };
                        GRNController.getRemainingQty(reqObj, resObj);
                    });

                    if (!remainingResponse.success) {
                        throw new Error(`Error getting remaining quantity for SKU ${item.sku}: ${remainingResponse.message}`);
                    }

                    if (parseInt(item.received_qty) > remainingResponse.remaining_qty) {
                        throw new Error(`Cannot receive ${item.received_qty} of SKU ${item.sku}. Only ${remainingResponse.remaining_qty} remaining.`);
                    }
                }

                // Determine GRN status
                let grnStatus = 'partial';
                const allItemsComplete = grn_items.every(item => {
                    const itemData = orderedQtyMap[item.sku];
                    return parseInt(item.received_qty) === itemData.max_qty;
                });
                
                if (allItemsComplete) {
                    grnStatus = 'completed';
                }

                // Insert GRN header
                const headerSql = `INSERT INTO grn (
                    grn_id, company_code, warehouse_user_id, po_number, received_date, 
                    batch_number, invoice_number, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
                
                const headerValues = [
                    grn_id, company_code, warehouse_user_id, po_number, grnReceivedDate,
                    batch_number || '', invoice_number || '', grnStatus
                ];

                await new Promise((resolve, reject) => {
                    db.query(headerSql, headerValues, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                // Insert GRN items and update stock
                for (const item of grn_items) {
                    const received_qty = parseInt(item.received_qty);
                    const itemData = orderedQtyMap[item.sku];
                    
                    // Get current received quantity
                    const currentReceived = await new Promise((resolve, reject) => {
                        const sql = 'SELECT SUM(received_qty) as total FROM grn_items WHERE po_number = ? AND sku = ?';
                        db.query(sql, [po_number, item.sku], (err, results) => {
                            if (err) reject(err);
                            else resolve(results[0]?.total || 0);
                        });
                    });

                    const new_total = currentReceived + received_qty;
                    const remaining_qty = itemData.max_qty - new_total;
                    
                    // Determine item status
                    let itemStatus = 'partial';
                    if (new_total >= itemData.max_qty) {
                        itemStatus = 'received';
                    } else if (new_total === 0) {
                        itemStatus = 'pending';
                    }


                // Insert GRN item (add po_number column)
                const itemSql = `INSERT INTO grn_items (
                    grn_id, company_code, po_number, style_code, sku, ordered_qty, 
                    received_qty, remaining_qty, status, location, notes, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;

                const itemValues = [
                    grn_id, company_code, po_number, item.style_code, item.sku, itemData.ordered_qty,
                    received_qty, Math.max(0, remaining_qty), itemStatus, 
                    item.location || '', item.notes || ''
                ];

                await new Promise((resolve, reject) => {
                    db.query(itemSql, itemValues, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                    // Update style_variants stock
                    const updateStockSql = `UPDATE style_variants 
                                          SET stock_quantity = COALESCE(stock_quantity, 0) + ?, updated_at = NOW()
                                          WHERE style_code = ? AND sku = ? AND company_code = ?`;
                    
                    const updateResult = await new Promise((resolve, reject) => {
                        db.query(updateStockSql, [received_qty, item.style_code, item.sku, company_code], (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });

                    // If no rows updated, insert new style_variant
                    if (updateResult.affectedRows === 0) {
                        const insertVariantSql = `INSERT INTO style_variants 
                                                (style_code, sku, company_code, stock_quantity, created_at, updated_at) 
                                                VALUES (?, ?, ?, ?, NOW(), NOW())`;
                        
                        await new Promise((resolve, reject) => {
                            db.query(insertVariantSql, [item.style_code, item.sku, company_code, received_qty], (err, result) => {
                                if (err) reject(err);
                                else resolve(result);
                            });
                        });
                    }
                }

                // Commit transaction
                db.commit((err) => {
                    if (err) {
                        return db.rollback(() => {
                            res.status(500).json({ 
                                success: false, 
                                message: 'Error committing transaction', 
                                error: err.message 
                            });
                        });
                    }
                    
                    res.json({ 
                        success: true, 
                        message: 'GRN created successfully', 
                        grn_id, 
                        status: grnStatus,
                        items_count: grn_items.length
                    });
                });

            } catch (error) {
                db.rollback(() => {
                    res.status(500).json({ 
                        success: false, 
                        message: error.message || 'Error processing GRN', 
                        error: error.message 
                    });
                });
            }
        });
    }

    // Get GRN history for a PO
    static async getGRNHistory(req, res) {
        const { po_number } = req.params;
        const { company_code } = req.query;

        if (!po_number || !company_code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing po_number or company_code' 
            });
        }

        const sql = `SELECT g.grn_id, g.received_date, g.status, g.batch_number, g.invoice_number,
                           gi.sku, gi.style_code, gi.received_qty, gi.location, gi.notes
                    FROM grn g 
                    LEFT JOIN grn_items gi ON g.grn_id = gi.grn_id
                    WHERE g.po_number = ? AND g.company_code = ?
                    ORDER BY g.created_at DESC, gi.sku`;

        db.query(sql, [po_number, company_code], (err, results) => {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching GRN history', 
                    error: err.message 
                });
            }

            // Group results by GRN ID
            const grnHistory = {};
            results.forEach(row => {
                if (!grnHistory[row.grn_id]) {
                    grnHistory[row.grn_id] = {
                        grn_id: row.grn_id,
                        received_date: row.received_date,
                        status: row.status,
                        batch_number: row.batch_number,
                        invoice_number: row.invoice_number,
                        items: []
                    };
                }
                
                if (row.sku) {
                    grnHistory[row.grn_id].items.push({
                        sku: row.sku,
                        style_code: row.style_code,
                        received_qty: row.received_qty,
                        location: row.location,
                        notes: row.notes
                    });
                }
            });

            res.json({ 
                success: true, 
                grn_history: Object.values(grnHistory) 
            });
        });
    }
}

module.exports = GRNController;
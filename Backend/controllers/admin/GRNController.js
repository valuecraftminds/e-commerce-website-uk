const db = require('../../config/database');
const PurchaseOrderController = require('./PurchaseOrderController');

class GRNController {
    // Get purchase orders with GRN status
    static async getPurchaseOrdersWithGRNStatus(req, res) {
        const { company_code, po_number, supplier_id, from_date, to_date, status } = req.query;
        
        if (!company_code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing company_code' 
            });
        }

        try {
            let sql = `
                SELECT poh.*, 
                       s.supplier_name,
                       COUNT(DISTINCT poi.sku) as total_styles,
                       SUM(poi.quantity) as total_quantity,
                       SUM(poi.total_price) as total_cost,
                       CASE 
                           WHEN latest_grn.po_number IS NULL THEN 'pending'
                           ELSE latest_grn.status
                       END as grn_status,
                       GROUP_CONCAT(DISTINCT gh.grn_id ORDER BY gh.received_date DESC) as grn_ids,
                       latest_grn.received_date as latest_grn_date
                FROM purchase_order_headers poh
                LEFT JOIN suppliers s ON poh.supplier_id = s.supplier_id AND poh.company_code = s.company_code
                LEFT JOIN purchase_order_items poi ON poh.po_number = poi.po_number AND poh.company_code = poi.company_code
                LEFT JOIN grn_headers gh ON poh.po_number = gh.po_number AND poh.company_code = gh.company_code
                LEFT JOIN (
                    SELECT gh1.po_number, gh1.company_code, gh1.status, gh1.received_date
                    FROM grn_headers gh1
                    INNER JOIN (
                        SELECT po_number, company_code, MAX(received_date) as max_date
                        FROM grn_headers
                        GROUP BY po_number, company_code
                    ) gh2 ON gh1.po_number = gh2.po_number 
                         AND gh1.company_code = gh2.company_code 
                         AND gh1.received_date = gh2.max_date
                ) latest_grn ON poh.po_number = latest_grn.po_number AND poh.company_code = latest_grn.company_code
                WHERE poh.company_code = ?
            `;

            const params = [company_code];

            // Add filters
            if (po_number) {
                sql += ` AND poh.po_number LIKE ?`;
                params.push(`%${po_number}%`);
            }
            if (supplier_id) {
                sql += ` AND poh.supplier_id = ?`;
                params.push(supplier_id);
            }
            if (from_date) {
                sql += ` AND DATE(poh.created_at) >= ?`;
                params.push(from_date);
            }
            if (to_date) {
                sql += ` AND DATE(poh.created_at) <= ?`;
                params.push(to_date);
            }

            sql += ` GROUP BY poh.po_number`;

            // Add status filter after grouping
            if (status) {
                sql += ` HAVING grn_status = ?`;
                params.push(status);
            }

            sql += ` ORDER BY poh.created_at DESC`;

            db.query(sql, params, (err, results) => {
                if (err) {
                    console.error('Error fetching purchase orders with GRN status:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error fetching purchase orders',
                        error: err.message 
                    });
                }

                res.json({ 
                    success: true, 
                    purchase_orders: results 
                });
            });
        } catch (error) {
            console.error('Error in getPurchaseOrdersWithGRNStatus:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching purchase orders', 
                error: error.message 
            });
        }
    }

    // Get remaining_qty for a PO item with tolerance calculation
    static async getRemainingQty(req, res) {
        const { po_number, sku, company_code } = req.query;
        if (!po_number || !sku || !company_code) {
            return res.status(400).json({ success: false, message: 'Missing po_number, sku, or company_code' });
        }

        try {
            // Get PO details including tolerance_limit
            const poDetails = await new Promise((resolve, reject) => {
                const reqObj = { params: { po_number }, query: { company_code } };
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
            const unit_price = poItem.unit_price;

            // Get total received_qty from grn_items
            const sqlGRN = 'SELECT SUM(received_qty) as total_received FROM grn_items WHERE po_number = ? AND sku = ? AND company_code = ?';
            db.query(sqlGRN, [po_number, sku, company_code], (err, grnResults) => {
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
                    remaining_qty: Math.max(0, remaining_qty),
                    unit_price
                });
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Error fetching PO details', error: error.message });
        }
    }

    // Search PO numbers
static async searchPO(req, res) {
    const { company_code, po_number } = req.query;
    
    if (!company_code) {
        return res.status(400).json({ 
            success: false, 
            message: 'Missing company_code' 
        });
    }

    try {
        // Base query for purchase orders
        let sql = `
            SELECT poh.po_number, poh.supplier_id, poh.created_at,
                   s.supplier_name
            FROM purchase_order_headers poh
            LEFT JOIN suppliers s ON poh.supplier_id = s.supplier_id 
                AND poh.company_code = s.company_code
            WHERE poh.company_code = ?
        `;
        
        const params = [company_code];
        
        // Add PO number filter if provided
        if (po_number) {
            sql += ' AND poh.po_number LIKE ?';
            params.push(`%${po_number}%`);
        }
        
        sql += ' ORDER BY poh.created_at DESC LIMIT 10';
        
        // Execute query
        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Error searching PO numbers:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error searching PO numbers', 
                    error: err.message 
                });
            }
            
            // Format results with supplier info
            const formattedResults = results.map(po => ({
                po_number: po.po_number,
                supplier_id: po.supplier_id,
                supplier_name: po.supplier_name || 'Unknown Supplier',
                supplier_code: po.supplier_code || '',
                created_at: po.created_at
            }));
            
            res.json({ 
                success: true, 
                purchase_orders: formattedResults 
            });
        });
    } catch (error) {
        console.error('Error in searchPO:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Error searching PO numbers', 
            error: error.message 
        });
    }
}

    // Get PO details (reuse PurchaseOrderController)
    static async getPODetails(req, res) {
        return PurchaseOrderController.getPurchaseOrderDetails(req, res);
    }

    // Get GRN details by ID
    static async getGRNDetails(req, res) {
        const { grn_id } = req.params;
        const { company_code } = req.query;

        if (!grn_id || !company_code) {
            return res.status(400).json({ success: false, message: 'Missing grn_id or company_code' });
        }

        try {
            // Get GRN header with supplier name
            const headerSql = `
                SELECT gh.*, s.supplier_name
                FROM grn_headers gh
                LEFT JOIN suppliers s ON gh.supplier_id = s.supplier_id AND gh.company_code = s.company_code
                WHERE gh.grn_id = ? AND gh.company_code = ?
            `;
            const headerResult = await new Promise((resolve, reject) => {
                db.query(headerSql, [grn_id, company_code], (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0]);
                });
            });

            if (!headerResult) {
                return res.status(404).json({ success: false, message: 'GRN not found' });
            }

            // Get GRN items with location info
            const itemsSql = `
                SELECT gi.*, l.location_name
                FROM grn_items gi
                LEFT JOIN locations l ON gi.location_id = l.location_id AND gi.company_code = l.company_code
                WHERE gi.grn_id = ?
            `;
            const itemsResult = await new Promise((resolve, reject) => {
                db.query(itemsSql, [grn_id], (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            // Ensure notes and location_name are present for each item
            const itemsWithNotes = itemsResult.map(item => ({
                ...item,
                notes: item.notes || '',
                location: item.location_name || ''
            }));

            res.json({
                success: true,
                header: headerResult,
                items: itemsWithNotes
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching GRN details', 
                error: error.message 
            });
        }
    }

    // Get all GRNs for a company (ignore PO param, always show all)
    static async getGRNHistory(req, res) {
        const { company_code, page = 1, limit = 10, search = '', status = '', from_date = '', to_date = '' } = req.query;

        if (!company_code) {
            return res.status(400).json({ success: false, message: 'Missing company_code' });
        }

        try {
            // Calculate offset for pagination
            const offset = (page - 1) * limit;

            // Base query
            let sql = `
                SELECT gh.grn_id, gh.po_number, gh.supplier_id, gh.received_date, 
                       gh.status, gh.total_items, gh.total_qty, gh.batch_number,
                       s.supplier_name,
                       COUNT(gi.id) as items_count
                FROM grn_headers gh
                LEFT JOIN grn_items gi ON gh.grn_id = gi.grn_id
                LEFT JOIN suppliers s ON gh.supplier_id = s.supplier_id AND gh.company_code = s.company_code
                WHERE gh.company_code = ?
            `;
            const params = [company_code];

            // Add search filter if provided
            if (search) {
                sql += ` AND (gh.grn_id LIKE ? OR gh.po_number LIKE ? OR gh.batch_number LIKE ? OR s.supplier_name LIKE ?)`;
                params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }

            // Add status filter if provided
            if (status) {
                sql += ` AND gh.status = ?`;
                params.push(status);
            }

            // Add date range filters if provided
            if (from_date) {
                sql += ` AND DATE(gh.received_date) >= ?`;
                params.push(from_date);
            }
            if (to_date) {
                sql += ` AND DATE(gh.received_date) <= ?`;
                params.push(to_date);
            }

            // Group and order
            sql += ` GROUP BY gh.grn_id ORDER BY gh.received_date DESC LIMIT ? OFFSET ?`;
            params.push(parseInt(limit), offset);

            // Execute query
            const results = await new Promise((resolve, reject) => {
                db.query(sql, params, (err, results) => {
                    if (err) reject(err);
                    else resolve(results);
                });
            });

            // Get total count for pagination with same filters
            let countSql = `
                SELECT COUNT(DISTINCT gh.grn_id) as total 
                FROM grn_headers gh
                LEFT JOIN suppliers s ON gh.supplier_id = s.supplier_id AND gh.company_code = s.company_code
                WHERE gh.company_code = ?
            `;
            const countParams = [company_code];
            
            // Apply same filters to count query
            if (search) {
                countSql += ` AND (gh.grn_id LIKE ? OR gh.po_number LIKE ? OR gh.batch_number LIKE ? OR s.supplier_name LIKE ?)`;
                countParams.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
            }
            if (status) {
                countSql += ` AND gh.status = ?`;
                countParams.push(status);
            }
            if (from_date) {
                countSql += ` AND DATE(gh.received_date) >= ?`;
                countParams.push(from_date);
            }
            if (to_date) {
                countSql += ` AND DATE(gh.received_date) <= ?`;
                countParams.push(to_date);
            }

            const countResult = await new Promise((resolve, reject) => {
                db.query(countSql, countParams, (err, results) => {
                    if (err) reject(err);
                    else resolve(results[0].total);
                });
            });

            res.json({
                success: true,
                grns: results,
                total: countResult,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(countResult / limit)
            });
        } catch (error) {
            res.status(500).json({ 
                success: false, 
                message: 'Error fetching GRN history', 
                error: error.message 
            });
        }
    }

    // Validate GRN item before adding
    static async validateGRNItem(req, res) {
        const { po_number, sku, received_qty, company_code } = req.body;
        
        if (!po_number || !sku || isNaN(received_qty) || received_qty <= 0 || !company_code) {
            return res.status(400).json({ 
                success: false, 
                message: 'Missing or invalid required fields: po_number, sku, received_qty (>0), company_code' 
            });
        }

        try {
            // Get remaining quantity with tolerance
            const remainingResponse = await new Promise((resolve, reject) => {
                const reqObj = { query: { po_number, sku, company_code } };
                const resObj = {
                    json: (data) => resolve(data),
                    status: (code) => ({ json: (data) => reject(data) })
                };
                GRNController.getRemainingQty(reqObj, resObj);
            });

            if (!remainingResponse.success) {
                return res.status(400).json(remainingResponse);
            }

            const { remaining_qty, max_qty, ordered_qty, tolerance_limit } = remainingResponse;

            // Validation checks
            if (received_qty > remaining_qty) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Cannot receive ${received_qty} items. Only ${remaining_qty} items remaining (Max: ${max_qty}, Ordered: ${ordered_qty}, Tolerance: ${tolerance_limit}%)` 
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
                    received_qty: parseInt(received_qty)
                }
            });

        } catch (error) {
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
            invoice_number,
            reference,
            supplier_id
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
                const sql = `SELECT grn_id FROM grn_headers WHERE company_code = ? ORDER BY created_at DESC LIMIT 1`;
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
                    const newGrnId = `GRN-${company_code}-${String(nextNumber).padStart(4, '0')}`;
                    resolve(newGrnId);
                });
            }); 
        };

        // Validate all items before processing
        for (let idx = 0; idx < grn_items.length; idx++) {
            const item = grn_items[idx];
            if (!item.sku || !item.style_number || isNaN(parseInt(item.received_qty)) || parseInt(item.received_qty) <= 0 || !item.location_id) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Invalid GRN item at index ${idx}. Check SKU, style_number, received_qty, and location_id` 
                });
            }
        }

        // Get PO details for tolerance validation
        let poDetails;
        try {
            poDetails = await new Promise((resolve, reject) => {
                const reqObj = { params: { po_number }, query: { company_code } };
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
                        const reqObj = { query: { po_number, sku: item.sku, company_code } };
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

                // Use status from request body for GRN header
                let grnStatus = req.body.status || 'partial';

                // Insert GRN header
                const headerSql = `INSERT INTO grn_headers (
                    grn_id, company_code, supplier_id, warehouse_user_id, po_number, received_date, 
                    batch_number, invoice_number, reference, status, created_at, updated_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`;
                
                const headerValues = [
                    grn_id, company_code, supplier_id || poDetails.header.supplier_id, 
                    warehouse_user_id, po_number, grnReceivedDate,
                    batch_number || '', invoice_number || '', reference || '', grnStatus
                ];

                await new Promise((resolve, reject) => {
                    db.query(headerSql, headerValues, (err, result) => {
                        if (err) reject(err);
                        else resolve(result);
                    });
                });

                // Insert GRN items
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
                    // Use status from item (provided by frontend)
                    let itemStatus = item.status || 'pending';
                    // Insert GRN item
                    const itemSql = `INSERT INTO grn_items (
                        grn_id, company_code, po_number, style_number, sku,batch_number, lot_no,
                        ordered_qty, received_qty, remaining_qty,
                        location_id, notes, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?,?, NOW(), NOW())`;
                    const itemValues = [
                        grn_id, company_code, po_number, 
                        item.style_number, item.sku,batch_number, item.lot_no || '',
                        itemData.ordered_qty, received_qty, 
                        Math.max(0, remaining_qty),
                        item.location_id || '', item.notes || ''
                    ];
                    await new Promise((resolve, reject) => {
                        db.query(itemSql, itemValues, (err, result) => {
                            if (err) reject(err);
                            else resolve(result);
                        });
                    });
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
}

module.exports = GRNController;
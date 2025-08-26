const db = require('../../config/database');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const PurchaseOrderController = {
    generatePONumber(company_code, callback) {
        console.log('Generating PO number for company:', company_code);
        
        const sql = `
            SELECT po_number 
            FROM purchase_order_headers 
            WHERE company_code = ? 
            ORDER BY created_at DESC LIMIT 1
        `;
        
        db.query(sql, [company_code], (err, results) => {
            if (err) {
                console.error('Error generating PO number:', err);
                return callback(err);
            }

            let nextNumber = 1;
            if (results.length > 0) {
                const lastPoNumber = results[0].po_number;
                console.log('Last PO number found:', lastPoNumber);
                
                // Extract number from PO-001 format
                const numberPart = lastPoNumber.split('-')[1];
                if (numberPart) {
                    nextNumber = parseInt(numberPart) + 1;
                }
            }

            const newPoNumber = `PO-${String(nextNumber).padStart(3, '0')}`;
            console.log('Generated new PO number:', newPoNumber);
            callback(null, newPoNumber);
        });
    },

    getPurchaseOrders(req, res) {
        const { company_code, po_number, supplier_id, from_date, to_date } = req.query;
        console.log('Fetching purchase orders with filters:', req.query);

        let sql = `
            SELECT poh.*, 
                   s.supplier_name,
                   COUNT(DISTINCT poi.sku) as total_styles,
                   SUM(poi.quantity) as total_quantity,
                   SUM(poi.total_price) as total_cost
            FROM purchase_order_headers poh
            LEFT JOIN suppliers s ON poh.supplier_id = s.supplier_id
            LEFT JOIN purchase_order_items poi ON poh.po_number = poi.po_number
            WHERE poh.company_code = ?
        `;

        const params = [company_code];

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

        sql += ` GROUP BY poh.po_number ORDER BY poh.created_at DESC`;

        console.log('Executing SQL:', sql);
        console.log('With parameters:', params);

        db.query(sql, params, (err, results) => {
            if (err) {
                console.error('Error fetching purchase orders:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching purchase orders',
                    error: err.message 
                });
            }

            console.log('Found purchase orders:', results.length);
            res.json({ success: true, purchase_orders: results });
        });
    },

    createPurchaseOrder(req, res) {
        console.log('Creating purchase order with data:', JSON.stringify(req.body, null, 2));
        
    const { company_code, supplier_id, attention, remark, items, status, tolerance_limit, delivery_date } = req.body;

        // Enhanced Validation
        if (!company_code || typeof company_code !== 'string') {
            console.error('Invalid or missing company_code:', company_code);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or missing company_code' 
            });
        }
        
        if (!supplier_id || isNaN(parseInt(supplier_id))) {
            console.error('Invalid or missing supplier_id:', supplier_id);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or missing supplier_id' 
            });
        }
        
        if (!attention || typeof attention !== 'string' || !attention.trim()) {
            console.error('Invalid or missing attention field:', attention);
            return res.status(400).json({ 
                success: false, 
                message: 'Invalid or missing attention field' 
            });
        }
        
        if (!items || !Array.isArray(items) || items.length === 0) {
            console.error('Missing or empty items array:', items);
            return res.status(400).json({ 
                success: false, 
                message: 'Missing items or items array is empty' 
            });
        }

        // Validate each item with enhanced checks
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            
            if (!item.sku || typeof item.sku !== 'string') {
                console.error(`Item ${i} has invalid SKU:`, item);
                return res.status(400).json({ 
                    success: false, 
                    message: `Item ${i + 1} has invalid SKU` 
                });
            }
            
            const quantity = parseInt(item.quantity);
            if (isNaN(quantity) || quantity <= 0) {
                console.error(`Item ${i} has invalid quantity:`, item);
                return res.status(400).json({ 
                    success: false, 
                    message: `Item ${i + 1} has invalid quantity` 
                });
            }
            
            const unitPrice = parseFloat(item.unit_price);
            if (isNaN(unitPrice) || unitPrice < 0) {
                console.error(`Item ${i} has invalid unit_price:`, item);
                return res.status(400).json({ 
                    success: false, 
                    message: `Item ${i + 1} has invalid unit_price` 
                });
            }
            
            // Update the item with validated values
            items[i].quantity = quantity;
            items[i].unit_price = unitPrice;
        }

        console.log('Enhanced validation passed, generating PO number...');

        // Generate new PO number
        PurchaseOrderController.generatePONumber(company_code, (err, newPoNumber) => {
            if (err) {
                console.error('Error generating PO number:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error generating PO number', 
                    error: err.message 
                });
            }

            console.log('Starting transaction for PO:', newPoNumber);

            // Start transaction
            db.beginTransaction((err) => {
                if (err) {
                    console.error('Error starting transaction:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error starting database transaction', 
                        error: err.message 
                    });
                }

                console.log('Transaction started, inserting header...');

                // Insert header with validated data
                const headerSql = `
                    INSERT INTO purchase_order_headers (
                        po_number, company_code, supplier_id, attention, 
                        remark, status, tolerance_limit, delivery_date, created_at, updated_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
                `;

                const headerValues = [
                    newPoNumber, 
                    company_code, 
                    parseInt(supplier_id), 
                    attention.trim(), 
                    (remark || '').trim(),
                    status || 'Pending',
                    parseFloat(tolerance_limit) || 0,
                    delivery_date || null
                ];
                
                console.log('Header SQL:', headerSql);
                console.log('Header values:', headerValues);

                db.query(headerSql, headerValues, (err, headerResult) => {
                    if (err) {
                        console.error('Error inserting PO header:', err);
                        return db.rollback(() => {
                            res.status(500).json({ 
                                success: false, 
                                message: 'Error inserting PO header', 
                                error: err.message,
                                sql: headerSql,
                                values: headerValues
                            });
                        });
                    }

                    console.log('Header inserted successfully, inserting items...');

                    // Insert items with better error handling
                    let completed = 0;
                    let hasError = false;

                    const insertItem = (item, index) => {
                        const total_price = item.quantity * item.unit_price;
                        
                        console.log(`Inserting item ${index + 1}:`, {
                            sku: item.sku,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            total_price: total_price
                        });

                        const itemSql = `
                            INSERT INTO purchase_order_items (
                                company_code, po_number, sku, quantity, 
                                unit_price, total_price, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                        `;

                        const itemValues = [
                            company_code, 
                            newPoNumber, 
                            item.sku, 
                            item.quantity, 
                            item.unit_price, 
                            total_price
                        ];

                        console.log(`Item ${index + 1} SQL:`, itemSql);
                        console.log(`Item ${index + 1} values:`, itemValues);

                        db.query(itemSql, itemValues, (err, itemResult) => {
                            if (err && !hasError) {
                                hasError = true;
                                console.error(`Error inserting item ${index + 1}:`, err);
                                return db.rollback(() => {
                                    res.status(500).json({ 
                                        success: false, 
                                        message: `Error inserting item ${index + 1}: ${err.message}`, 
                                        error: err.message,
                                        sql: itemSql,
                                        values: itemValues,
                                        item: item
                                    });
                                });
                            }

                            if (!hasError) {
                                completed++;
                                console.log(`Item ${index + 1} inserted successfully. Completed: ${completed}/${items.length}`);
                                
                                if (completed === items.length) {
                                    console.log('All items inserted, committing transaction...');
                                    
                                    db.commit((err) => {
                                        if (err) {
                                            console.error('Error committing transaction:', err);
                                            return db.rollback(() => {
                                                res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error committing transaction', 
                                                    error: err.message 
                                                });
                                            });
                                        }

                                        console.log('Purchase order created successfully:', newPoNumber);
                                        res.json({ 
                                            success: true, 
                                            message: 'Purchase order created successfully', 
                                            po_number: newPoNumber 
                                        });
                                    });
                                }
                            }
                        });
                    };

                    // Insert all items
                    items.forEach(insertItem);
                });
            });
        });
    },



    updatePurchaseOrder(req, res) {
        console.log('Updating purchase order:', req.params.po_number);
        console.log('Update data:', JSON.stringify(req.body, null, 2));
        
        const { po_number } = req.params;
    const { attention, supplier_id, remark, items, status, tolerance_limit, delivery_date } = req.body;

        if (!items || !Array.isArray(items) || items.length === 0) {
            console.error('Missing or empty items array for update');
            return res.status(400).json({ 
                success: false, 
                message: 'Missing items or items array is empty' 
            });
        }

        // Start transaction
        db.beginTransaction((err) => {
            if (err) {
                console.error('Error starting update transaction:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error starting transaction', 
                    error: err.message 
                });
            }

            // Update header
            const updateHeaderSql = `
                UPDATE purchase_order_headers 
                SET attention = ?, supplier_id = ?, remark = ?, status = ?, tolerance_limit = ?, delivery_date = ?, updated_at = NOW()
                WHERE po_number = ?
            `;

            const headerValues = [attention, supplier_id, remark || '', status || 'Pending', parseFloat(tolerance_limit) || 0, delivery_date || null, po_number];
            console.log('Updating header with values:', headerValues);

            db.query(updateHeaderSql, headerValues, (err, updateResult) => {
                if (err) {
                    console.error('Error updating PO header:', err);
                    return db.rollback(() => {
                        res.status(500).json({ 
                            success: false, 
                            message: 'Error updating PO header', 
                            error: err.message 
                        });
                    });
                }

                console.log('Header updated, deleting existing items...');

                // Delete existing items
                db.query('DELETE FROM purchase_order_items WHERE po_number = ?', [po_number], (err, deleteResult) => {
                    if (err) {
                        console.error('Error deleting existing items:', err);
                        return db.rollback(() => {
                            res.status(500).json({ 
                                success: false, 
                                message: 'Error deleting existing items', 
                                error: err.message 
                            });
                        });
                    }

                    console.log('Existing items deleted, inserting new items...');

                    // Insert new items
                    let completed = 0;
                    let hasError = false;

                    items.forEach((item, index) => {
                        const total_price = parseFloat(item.quantity) * parseFloat(item.unit_price);

                        const itemSql = `
                            INSERT INTO purchase_order_items (
                                company_code, po_number, sku, quantity, 
                                unit_price, total_price, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
                        `;

                        const itemValues = [
                            item.company_code || req.body.company_code, 
                            po_number, 
                            item.sku, 
                            parseInt(item.quantity), 
                            parseFloat(item.unit_price), 
                            total_price
                        ];

                        db.query(itemSql, itemValues, (err) => {
                            if (err && !hasError) {
                                hasError = true;
                                console.error(`Error updating item ${index + 1}:`, err);
                                return db.rollback(() => {
                                    res.status(500).json({ 
                                        success: false, 
                                        message: 'Error inserting updated item', 
                                        error: err.message 
                                    });
                                });
                            }

                            if (!hasError) {
                                completed++;
                                if (completed === items.length) {
                                    db.commit((err) => {
                                        if (err) {
                                            console.error('Error committing update transaction:', err);
                                            return db.rollback(() => {
                                                res.status(500).json({ 
                                                    success: false, 
                                                    message: 'Error committing transaction', 
                                                    error: err.message 
                                                });
                                            });
                                        }

                                        console.log('Purchase order updated successfully:', po_number);
                                        res.json({ 
                                            success: true, 
                                            message: 'Purchase order updated successfully' 
                                        });
                                    });
                                }
                            }
                        });
                    });
                });
            });
        });
    },

    deletePurchaseOrder(req, res) {
        const { po_number } = req.params;
        console.log('Deleting purchase order:', po_number);

        // Start transaction
        db.beginTransaction((err) => {
            if (err) {
                console.error('Error starting delete transaction:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error starting transaction', 
                    error: err.message 
                });
            }

            // Delete items first (foreign key constraint)
            db.query('DELETE FROM purchase_order_items WHERE po_number = ?', [po_number], (err, itemsResult) => {
                if (err) {
                    console.error('Error deleting purchase order items:', err);
                    return db.rollback(() => {
                        res.status(500).json({ 
                            success: false, 
                            message: 'Error deleting purchase order items',
                            error: err.message 
                        });
                    });
                }

                console.log('Items deleted, deleting header...');

                // Delete header
                db.query('DELETE FROM purchase_order_headers WHERE po_number = ?', [po_number], (err, headerResult) => {
                    if (err) {
                        console.error('Error deleting purchase order header:', err);
                        return db.rollback(() => {
                            res.status(500).json({ 
                                success: false, 
                                message: 'Error deleting purchase order header',
                                error: err.message 
                            });
                        });
                    }

                    db.commit((err) => {
                        if (err) {
                            console.error('Error committing delete transaction:', err);
                            return db.rollback(() => {
                                res.status(500).json({ 
                                    success: false, 
                                    message: 'Error committing transaction', 
                                    error: err.message 
                                });
                            });
                        }

                        console.log('Purchase order deleted successfully:', po_number);
                        res.json({ 
                            success: true, 
                            message: 'Purchase order deleted successfully' 
                        });
                    });
                });
            });
        });
    },

    getPurchaseOrderDetails(req, res) {
        const { po_number } = req.params;
        const { company_code } = req.query;
        console.log('Fetching details for PO:', po_number, 'Company:', company_code);

        if (!company_code) {
            return res.status(400).json({
                success: false,
                message: 'Company code is required'
            });
        }

        const sql = `
            SELECT poh.*, s.supplier_name,
                   poi.id as item_id,
                   poi.sku,
                   poi.quantity,
                   poi.unit_price,
                   poi.total_price,
                   sv.unit_price,
                   st.style_number,
                   st.name as style_name,
                   c.color_name,
                   sz.size_name,
                   f.fit_name,
                   m.material_name
                  , poh.tolerance_limit
            FROM purchase_order_headers poh
            LEFT JOIN suppliers s ON poh.supplier_id = s.supplier_id
            LEFT JOIN purchase_order_items poi ON poh.po_number = poi.po_number
            LEFT JOIN style_variants sv ON poi.sku = sv.sku AND sv.company_code = poh.company_code
            LEFT JOIN styles st ON sv.style_number = st.style_number AND st.company_code = sv.company_code
            LEFT JOIN colors c ON sv.color_id = c.color_id AND c.company_code = sv.company_code
            LEFT JOIN sizes sz ON sv.size_id = sz.size_id AND sz.company_code = sv.company_code
            LEFT JOIN fits f ON sv.fit_id = f.fit_id AND f.company_code = sv.company_code
            LEFT JOIN materials m ON sv.material_id = m.material_id AND m.company_code = sv.company_code
            WHERE poh.po_number = ? AND poh.company_code = ?
            ORDER BY poi.id
        `;

        console.log('Details SQL:', sql);

        db.query(sql, [po_number, company_code], (err, results) => {
            if (err) {
                console.error('Error fetching purchase order details:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching purchase order details',
                    error: err.message 
                });
            }

            if (results.length === 0) {
                console.log('Purchase order not found:', po_number, 'for company:', company_code);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Purchase order not found for this company' 
                });
            }

            console.log('Found PO details, results count:', results.length);

            // Structure the response with header and items
            const header = {
                po_number: results[0].po_number,
                company_code: results[0].company_code,
                supplier_id: results[0].supplier_id,
                supplier_name: results[0].supplier_name,
                attention: results[0].attention,
                remark: results[0].remark,
                status: results[0].status,
                created_at: results[0].created_at,
                updated_at: results[0].updated_at,
                tolerance_limit: results[0].tolerance_limit || 0,
                delivery_date: results[0].delivery_date || null
            };

            const tolerance = parseFloat(header.tolerance_limit) || 0;
            const items = results.filter(row => row.item_id).map(row => {
                const ordered_qty = parseFloat(row.quantity || 0);
                const max_qty = ordered_qty + (ordered_qty * tolerance / 100);
                return {
                    item_id: row.item_id,
                    sku: row.sku,
                    quantity: row.quantity,
                    unit_price: row.unit_price,
                    total_price: row.total_price,
                    style_number: row.style_number,
                    style_name: row.style_name,
                    color_name: row.color_name,
                    size_name: row.size_name,
                    fit_name: row.fit_name,
                    material_name: row.material_name,
                    max_qty: parseFloat(max_qty.toFixed(2))
                };
            });

            const total_amount = items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);

            console.log('Structured response - Header:', header);
            console.log('Structured response - Items count:', items.length);
            console.log('Structured response - Total amount:', total_amount);

            res.json({ 
                success: true, 
                header,
                items,
                total_amount
            });
        });
    },

    downloadPurchaseOrder(req, res) {
        const { po_number } = req.params;
        const { company_code } = req.query; // Get company_code from query params
        
        console.log('Generating PDF for PO:', po_number, 'Company:', company_code);

        if (!company_code) {
            return res.status(400).json({
                success: false,
                message: 'Company code is required'
            });
        }

        // First get the header and company info
        const headerSql = `
            SELECT poh.*, s.supplier_name, s.address as supplier_address,
                   co.company_name, co.company_address, co.company_phone, co.company_email, co.currency
            FROM purchase_order_headers poh
            LEFT JOIN suppliers s ON poh.supplier_id = s.supplier_id AND s.company_code = poh.company_code
            LEFT JOIN companies co ON poh.company_code = co.company_code
            WHERE poh.po_number = ? AND poh.company_code = ?
        `;

        console.log('Executing header SQL:', headerSql);
        console.log('Parameters:', [po_number, company_code]);

        db.query(headerSql, [po_number, company_code], (err, headerResults) => {
            if (err) {
                console.error('Error fetching PO header:', err);
                return res.status(500).json({ 
                    success: false, 
                    message: 'Error fetching purchase order header',
                    error: err.message 
                });
            }

            if (headerResults.length === 0) {
                console.log('Purchase order not found:', po_number, 'for company:', company_code);
                return res.status(404).json({ 
                    success: false, 
                    message: 'Purchase order not found for this company' 
                });
            }

            console.log('Found PO header:', headerResults[0].po_number);

            // Now get the items for this specific PO
            const itemsSql = `
                SELECT poi.id as item_id, poi.sku, poi.quantity, poi.unit_price, poi.total_price,
                       sv.unit_price,
                       st.style_number, st.name as style_name,
                       c.color_name, sz.size_name, f.fit_name, m.material_name
                FROM purchase_order_items poi
                LEFT JOIN style_variants sv ON poi.sku = sv.sku AND sv.company_code = poi.company_code
                LEFT JOIN styles st ON sv.style_number = st.style_number AND st.company_code = sv.company_code
                LEFT JOIN colors c ON sv.color_id = c.color_id AND c.company_code = sv.company_code
                LEFT JOIN sizes sz ON sv.size_id = sz.size_id AND sz.company_code = sv.company_code
                LEFT JOIN fits f ON sv.fit_id = f.fit_id AND f.company_code = sv.company_code
                LEFT JOIN materials m ON sv.material_id = m.material_id AND m.company_code = sv.company_code
                WHERE poi.po_number = ? AND poi.company_code = ?
                ORDER BY poi.id
            `;

            console.log('Executing items SQL:', itemsSql);

            db.query(itemsSql, [po_number, company_code], (err, itemsResults) => {
                if (err) {
                    console.error('Error fetching PO items:', err);
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Error fetching purchase order items',
                        error: err.message 
                    });
                }

                console.log(`Found ${itemsResults.length} items for PO ${po_number}`);

                const headerData = headerResults[0];

                // Structure the data
                const header = {
                    po_number: headerData.po_number,
                    company_code: headerData.company_code,
                    supplier_id: headerData.supplier_id,
                    supplier_name: headerData.supplier_name,
                    supplier_address: headerData.supplier_address,
                    attention: headerData.attention,
                    remark: headerData.remark,
                    status: headerData.status,
                    created_at: headerData.created_at,
                    updated_at: headerData.updated_at
                };

                // Company details from companies table
                const company = {
                    company_name: headerData.company_name || 'CLUB TEX MARK (PVT) LTD',
                    company_address: headerData.company_address || 'NO 145 DUTUGEMU MAWATHA, PELIYAGODA, SRI LANKA',
                    company_phone: headerData.company_phone || '011-2943115 011-2943718',
                    company_email: headerData.company_email || '',
                    currency: headerData.currency || 'Rs' // <-- Add this line
                };

                const items = itemsResults.map(row => ({
                    item_id: row.item_id,
                    sku: row.sku,
                    quantity: row.quantity,
                    unit_price: row.unit_price,
                    total_price: row.total_price,
                    style_number: row.style_number,
                    style_name: row.style_name,
                    color_name: row.color_name,
                    size_name: row.size_name,
                    fit_name: row.fit_name,
                    material_name: row.material_name
                }));

                console.log(`Final items for PDF generation:`, items.length);
                console.log('Item details:', items.map(item => ({ sku: item.sku, quantity: item.quantity })));

                PurchaseOrderController.generatePDF(res, po_number, header, company, items);
            });
        });
    },

    generatePDF(res, po_number, header, company, items) {
        // Generate PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        
        // Set response headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="PO-${po_number}.pdf"`);
        
        // Pipe the PDF to the response
        doc.pipe(res);

        // Company Header
        doc.fontSize(16)
           .font('Helvetica-Bold')
           .text(company.company_name, 50, 50, { align: 'center' });
        
        doc.fontSize(10)
           .font('Helvetica')
           .text(company.company_address, 50, 75, { align: 'center' });
        
        // Build contact info line
        let contactInfo = '';
        if (company.company_phone) {
            contactInfo += `TEL: ${company.company_phone}`;
        }
        if (company.company_email) {
            if (contactInfo) contactInfo += ' ';
            contactInfo += `EMAIL: ${company.company_email}`;
        }
        if (contactInfo) {
            doc.text(contactInfo, 50, 90, { align: 'center' });
        }

        // Purchase Order Title
        doc.fontSize(14)
           .font('Helvetica-Bold')
           .text('PURCHASE ORDER', 50, 120, { align: 'center' });

        // PO Number and Date
        doc.fontSize(10)
           .font('Helvetica')
           .text(`PO Number: ${header.po_number}`, 450, 120);
        
        const orderDate = new Date(header.created_at);
        doc.text(`Date: ${orderDate.toLocaleDateString('en-GB')}`, 450, 135);

        // Supplier Information
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Supplier Information', 50, 170);

        doc.fontSize(10)
           .font('Helvetica')
           .text(`Attention: ${header.attention}`, 50, 190);
        
        doc.text(`Supplier: ${header.supplier_name}`, 50, 205);
        
        if (header.supplier_address) {
            doc.text(`Address: ${header.supplier_address}`, 50, 220);
        }

        // Order Details Header
        doc.fontSize(12)
           .font('Helvetica-Bold')
           .text('Order Details', 50, 260);

        // Table Headers (Style Name before SKU, no Color/Size, improved spacing)
        const tableTop = 290;
        const col1X = 50;   // #
        const col2X = 75;   // Style Name
        const col3X = 180;  // SKU
        const col4X = 320;  // Qty
        const col5X = 370;  // Unit Price
        const col6X = 450;  // Total

        doc.fontSize(10)
           .font('Helvetica-Bold');

        doc.text('#', col1X, tableTop, { width: 20, align: 'left' });
        doc.text('Style Name', col2X, tableTop, { width: 100, align: 'left' });
        doc.text('SKU', col3X, tableTop, { width: 120, align: 'left' });
        doc.text('Qty', col4X, tableTop, { width: 40, align: 'right' });
        doc.text('Unit Price', col5X, tableTop, { width: 70, align: 'right' });
        doc.text('Total', col6X, tableTop, { width: 80, align: 'right' });

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
                currentY = 50;
            }

            doc.text((index + 1).toString(), col1X, currentY, { width: 20, align: 'left' });
            doc.text(item.style_name || '', col2X, currentY, { width: 100, align: 'left' });
            doc.text(item.sku || '', col3X, currentY, { width: 120, align: 'left' });
            doc.text(item.quantity?.toString() || '0', col4X, currentY, { width: 40, align: 'right' });
            doc.text(`${parseFloat(item.unit_price || 0).toFixed(2)}`, col5X, currentY, { width: 70, align: 'right' });
            doc.text(`${parseFloat(item.total_price || 0).toFixed(2)}`, col6X, currentY, { width: 80, align: 'right' });

            currentY += 18;
        });

        // Draw bottom line
        doc.moveTo(50, currentY)
           .lineTo(580, currentY)
           .stroke();

        // Totals
        const totalItems = items.length;
        const totalQuantity = items.reduce((sum, item) => sum + parseInt(item.quantity || 0), 0);
        const totalCost = items.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0);

        currentY += 20;
        doc.font('Helvetica-Bold');
        doc.text(`Total Items: ${totalItems}`, 400, currentY);
        doc.text(`Total Quantity: ${totalQuantity}`, 400, currentY + 15);
        doc.text(`Total Cost (${company.currency || 'Rs'}): ${totalCost.toFixed(2)}`, 400, currentY + 30);

        // Remarks
        if (header.remark) {
            currentY += 70;
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .text('* Remarks', 50, currentY);
            
            doc.font('Helvetica')
               .text(header.remark, 50, currentY + 15);
        } else {
            currentY += 70;
            doc.fontSize(10)
               .font('Helvetica-Bold')
               .text('* Remarks', 50, currentY);
            
            doc.font('Helvetica')
               .text('25% ADVANCE PAYMENT & BALANCE 75% AT FINAL COLLECTION DATE TO BE PAID. DELIVERY NEEDS - 23/7 ONWARDS', 50, currentY + 15);
        }

        // Signature section
        currentY += 80;
        doc.text('Prepared By: ________________', 50, currentY);
        doc.text('Approved By: ________________', 300, currentY);

        // Finalize the PDF
        doc.end();
    },

    approvePurchaseOrder(req, res) {
        const { po_number } = req.params;
        if (!po_number) {
            return res.status(400).json({ success: false, message: 'PO number is required' });
        }
        const sql = `UPDATE purchase_order_headers SET status = 'Approved', updated_at = NOW() WHERE po_number = ?`;
        db.query(sql, [po_number], (err, result) => {
            if (err) {
                return res.status(500).json({ success: false, message: 'Error approving PO', error: err.message });
            }
            res.json({ success: true, message: 'Purchase order approved successfully' });
        });
    }

    
};

module.exports = PurchaseOrderController;
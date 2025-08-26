const db = require('../../config/database');

const SupplierController = {
    getSupplier(req, res) {
        const { company_code } = req.query;
        if (!company_code) {
            return res.status(400).json({ success: false, message: 'Company code is required' });
        }

        db.query(
            'SELECT * FROM suppliers WHERE company_code = ? ORDER BY supplier_name',
            [company_code],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error fetching suppliers' });
                }
                res.json({ success: true, suppliers: results });
            }
        );
    },

    addSupplier(req, res) {
        const { 
            company_code, 
            supplier_name, 
            email, 
            phone, 
            address, 
            brn, 
            vat,
            bank_name,
            branch,
            account_number,
            payment_terms,
            credit_period,
            advance_percentage,
            created_by,
            currency_id
        } = req.body;

        if (!company_code || !supplier_name || !payment_terms || !created_by) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        // Validate payment terms specific fields
        if (payment_terms === 'Credit' && !credit_period) {
            return res.status(400).json({ success: false, message: 'Credit period is required for credit payment terms' });
        }

        if (payment_terms === 'Advance' && !advance_percentage) {
            return res.status(400).json({ success: false, message: 'Advance percentage is required for advance payment terms' });
        }

        // Check for duplicate supplier by name and company
        db.query(
            'SELECT * FROM suppliers WHERE company_code = ? AND supplier_name = ?',
            [company_code, supplier_name],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error checking duplicates' });
                }

                if (results.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Supplier with this name already exists for this company'
                    });
                }


                // Insert new supplier
                db.query(
                    `INSERT INTO suppliers (
                        company_code, 
                        supplier_name, 
                        email, 
                        phone, 
                        address, 
                        brn, 
                        vat,
                        bank_name,
                        branch,
                        account_number,
                        payment_terms,
                        credit_period,
                        advance_percentage,
                        created_by,
                        currency_id
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        company_code, 
                        supplier_name, 
                        email, 
                        phone, 
                        address, 
                        brn, 
                        vat,
                        bank_name,
                        branch,
                        account_number,
                        payment_terms,
                        credit_period,
                        advance_percentage,
                        created_by,
                        currency_id
                    ],
                    (err, result) => {
                        if (err) {
                            console.error('Error adding supplier:', err);
                            return res.status(500).json({ success: false, message: 'Error adding supplier', error: err.message });
                        }
                        res.json({ success: true , message: 'Supplier added successfully', supplier_id: result.insertId });
                    }
                );
            }
        );
    },

    updateSupplier(req, res) {
        const { supplier_id } = req.params;
        const { 
            supplier_name, 
            email, 
            phone, 
            address, 
            brn, 
            vat,
            bank_name,
            branch,
            account_number,
            payment_terms,
            credit_period,
            advance_percentage,
            company_code,
            currency_id
        } = req.body;

        if (!supplier_name || !payment_terms || !company_code) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
        }

        // Validate payment terms specific fields
        if (payment_terms === 'Credit' && !credit_period) {
            return res.status(400).json({ success: false, message: 'Credit period is required for credit payment terms' });
        }

        if (payment_terms === 'Advance' && !advance_percentage) {
            return res.status(400).json({ success: false, message: 'Advance percentage is required for advance payment terms' });
        }

        db.query(
            'SELECT * FROM suppliers WHERE company_code = ? AND supplier_name = ? AND supplier_id != ?',
            [company_code, supplier_name, supplier_id],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error checking duplicates' });
                }

                if (results.length > 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'Another supplier with this name already exists for this company'
                    });
                }

                db.query(
                    `UPDATE suppliers SET 
                        supplier_name = ?, 
                        email = ?, 
                        phone = ?, 
                        address = ?, 
                        brn = ?, 
                        vat = ?,
                        bank_name = ?,
                        branch = ?,
                        account_number = ?,
                        payment_terms = ?,
                        credit_period = ?,
                        advance_percentage = ?,
                        company_code = ?, 
                        currency_id = ?,
                        updated_at = NOW() 
                    WHERE supplier_id = ?`,
                    [
                        supplier_name, 
                        email, 
                        phone, 
                        address, 
                        brn, 
                        vat,
                        bank_name,
                        branch,
                        account_number,
                        payment_terms,
                        credit_period,
                        advance_percentage,
                        company_code, 
                        currency_id,
                        supplier_id
                    ],
                    (err, result) => {
                        if (err) {
                            return res.status(500).json({ success: false, message: 'Error updating supplier' });
                        }
                        if (result.affectedRows === 0) {
                            return res.status(404).json({ success: false, message: 'Supplier not found' });
                        }
                        res.json({ success: true, message: 'Supplier updated successfully' });
                    }
                );
            }
        );
    },

    deleteSupplier(req, res) {
        const { supplier_id } = req.params;

        if (!supplier_id) {
            return res.status(400).json({ success: false, message: 'Supplier ID is required' });
        }

        db.query(
            'DELETE FROM suppliers WHERE supplier_id = ?',
            [supplier_id],
            (err, result) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error deleting supplier' });
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'Supplier not found' });
                }
                res.json({ success: true, message: 'Supplier deleted successfully' });
            }
        );
    }
};

module.exports = SupplierController;

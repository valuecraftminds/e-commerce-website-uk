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
        const { company_code, supplier_name, email, phone, address, brn, payment, created_by } = req.body;

        if (!company_code || !supplier_name || !payment || !created_by) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
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
                    'INSERT INTO suppliers (company_code, supplier_name, email, phone, address, brn, payment, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                    [company_code, supplier_name, email, phone, address, brn, payment, created_by],
                    (err, result) => {
                        if (err) {
                            console.error('Error adding supplier:', err);
                            return res.status(500).json({ success: false, message: 'Error adding supplier', error: err.message });
                        }
                        res.json({ success: true, supplier_id: result.insertId });
                    }
                );
            }
        );
    },

    updateSupplier(req, res) {
        const { supplier_id } = req.params;
        const { supplier_name, email, phone, address, brn, payment, company_code } = req.body;

        if (!supplier_name || !payment || !company_code) {
            return res.status(400).json({ success: false, message: 'Required fields are missing' });
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
                    'UPDATE suppliers SET supplier_name = ?, email = ?, phone = ?, address = ?, brn = ?, payment = ?, company_code = ?, updated_at = NOW() WHERE supplier_id = ?',
                    [supplier_name, email, phone, address, brn, payment, company_code, supplier_id],
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

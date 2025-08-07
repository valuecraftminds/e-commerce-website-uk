const db = require('../../config/database');

const CurrencyController = {
    getCurrency(req, res) {
        const { company_code } = req.query;
        if (!company_code) {
            return res.status(400).json({ success: false, message: 'Company code is required' });
        }

        db.query(
            'SELECT * FROM currencies WHERE company_code = ? ORDER BY currency_name',
            [company_code],
            (err, results) => {
                if (err) {
                    res.status(500).json({ success: false, message: 'Error fetching currencies' });
                    return;
                }
                res.json({ success: true, currencies: results });
            }
        );
    },
    
    addCurrency(req, res) {
        const { company_code, currency_name, short_name, created_by } = req.body;
        
        if (!company_code || !currency_name || !short_name || !created_by) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check for duplicates first
        db.query(
            'SELECT * FROM currencies WHERE company_code = ? AND (currency_name = ? OR short_name = ?)',
            [company_code, currency_name, short_name],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error checking duplicates' });
                }

                if (results.length > 0) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Currency with this name or short name already exists for this company' 
                    });
                }

                // If no duplicates, proceed with insertion
                db.query(
                    'INSERT INTO currencies (company_code, currency_name, short_name, created_by) VALUES (?, ?, ?, ?)',
                    [company_code, currency_name, short_name, created_by],
                    (err, result) => {
                        if (err) {
                            console.error('Error adding currency:', err);
                            res.status(500).json({ success: false, message: 'Error adding currency', error: err.message });
                            return;
                        }
                        res.json({ success: true, currency_id: result.insertId });
                    }
                );
            }
        );
    },
    
    updateCurrency(req, res) {
        const { currency_id } = req.params;
        const { currency_name, short_name, company_code } = req.body;
        
        if (!currency_name || !short_name || !company_code) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check for duplicates excluding current record
        db.query(
            'SELECT * FROM currencies WHERE company_code = ? AND (currency_name = ? OR short_name = ?) AND currency_id != ?',
            [company_code, currency_name, short_name, currency_id],
            (err, results) => {
                if (err) {
                    return res.status(500).json({ success: false, message: 'Error checking duplicates' });
                }

                if (results.length > 0) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Currency with this name or short name already exists for this company' 
                    });
                }

                // If no duplicates, proceed with update
                db.query(
                    'UPDATE currencies SET currency_name = ?, short_name = ?, company_code = ?, updated_at = NOW() WHERE currency_id = ?',
                    [currency_name, short_name, company_code, currency_id],
                    (err, result) => {
                        if (err) {
                            res.status(500).json({ success: false, message: 'Error updating currency' });
                            return;
                        }
                        if (result.affectedRows === 0) {
                            return res.status(404).json({ success: false, message: 'Currency not found' });
                        }
                        res.json({ success: true, message: 'Currency updated successfully' });
                    }
                );
            }
        );
    },
    
    deleteCurrency(req, res) {
        const { currency_id } = req.params;
        
        if (!currency_id) {
            return res.status(400).json({ success: false, message: 'Currency ID is required' });
        }

        db.query(
            'DELETE FROM currencies WHERE currency_id = ?',
            [currency_id],
            (err, result) => {
                if (err) {
                    res.status(500).json({ success: false, message: 'Error deleting currency' });
                    return;
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ success: false, message: 'Currency not found' });
                }
                res.json({ success: true, message: 'Currency deleted successfully' });
            }
        );
    }
}

module.exports = CurrencyController;
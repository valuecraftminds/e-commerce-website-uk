const db = require('../../config/database');

const TaxController = {
    // Get all tax rates
    getAllTaxRates: async (req, res) => {
        const { company_code } = req.query;
        
        if (!company_code) {
            return res.status(400).json({ error: 'Company code is required.' });
        }

        const sql = 'SELECT tax_id, country, tax_rate FROM tax WHERE company_code = ?';

        db.query(sql, [company_code], (err, results) => {
            if (err) {
                console.error('Error fetching tax rates:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(results);
        });
    },

    // Add tax rate
    addTaxRate: async (req, res) => {
        const { company_code, country, tax_rate } = req.body;

        if (!company_code || !country || tax_rate == null) {
            return res.status(400).json({ error: 'Company code, country, and tax rate are required.' });
        }
        const sql = `
            INSERT INTO tax (company_code, country, tax_rate) 
            VALUES (?, ?, ?)
            ;`;

        db.query(sql, [company_code, country, tax_rate], (err) => {
            if (err) {
                console.error('Error adding tax rate:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json({ message: 'Tax rate added successfully' });
        });
    },

    // Update tax rate
    updateTaxRate: async (req, res) => {
        const { company_code, country, tax_rate } = req.body;
        const tax_id = req.params.tax_id;

        if (!company_code || !country || tax_rate == null) {
            return res.status(400).json({ error: 'Company code, country, and tax rate are required.' });
        }

        if (!tax_id){
            return res.status(400).json({ error: 'Tax ID is required.' });
        }

        const sql = `
            UPDATE tax 
            SET tax_rate = ? 
            WHERE company_code = ? AND tax_id = ?
        `;

        db.query(sql, [tax_rate, company_code, tax_id], (err, results) => {
            if (err) {
                console.error('Error updating tax rate:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Tax rate not found for the specified country and company code.' });
            }
            res.json({ message: 'Tax rate updated successfully' });
        }
        );
    }
};
module.exports = TaxController;
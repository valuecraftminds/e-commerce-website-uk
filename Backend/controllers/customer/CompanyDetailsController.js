const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

const companyDetailsController = {
    // GET company details
    getCompanyDetails: (req, res) => {
        const { company_code } = req.query;

        if (!company_code) {
            return res.status(400).json({ error: 'Company code is required' });
        }

        const sql = `SELECT company_code, company_name, company_address, company_logo FROM companies WHERE company_code = ?`;
        db.query(sql, [company_code], (err, results) => {
            if (err) {
                console.error('Error retrieving company details:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Company not found' });
            }
            res.status(200).json(results[0]);
        });
    },

    getCompanyLogo: (req, res) => {
        const { company_code } = req.query;

        if (!company_code) {
            return res.status(400).json({ error: 'Company code is required' });
        }

        const sql = `SELECT company_logo FROM companies WHERE company_code = ?`;
        db.query(sql, [company_code], (err, results) => {
            if (err) {
                console.error('Error retrieving company logo:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'Company not found' });
            }
            res.status(200).json(results[0]);
        });
    }
};

module.exports = companyDetailsController;

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

const companyDetailsController = {
    // GET company details
    getCompanyDetails: (req, res) => {
        console.log('getCompanyDetails called');
        console.log('Query params:', req.query);

        const { company_code } = req.query;

        if (!company_code) {
            console.log('ERROR: No company_code provided');
            return res.status(400).json({ error: 'Company code is required' });
        }

        const sql = `SELECT company_code, company_name, company_address, company_logo FROM companies WHERE company_code = ?`;
        db.query(sql, [company_code], (err, results) => {
            if (err) {
                console.error('Error retrieving company details:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            if (results.length === 0) {
                console.log(`No company found for code: ${company_code}`);
                return res.status(404).json({ error: 'Company not found' });
            }

            console.log('Company details retrieved successfully');
            res.status(200).json(results[0]);
        });
    },

    getCompanyLogo: (req, res) => {
        console.log('getCompanyLogo called');
        console.log('Query params:', req.query);

        const { company_code } = req.query;

        if (!company_code) {
            console.log('ERROR: No company_code provided');
            return res.status(400).json({ error: 'Company code is required' });
        }

        const sql = `SELECT company_logo FROM companies WHERE company_code = ?`;
        db.query(sql, [company_code], (err, results) => {
            if (err) {
                console.error('Error retrieving company logo:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            if (results.length === 0) {
                console.log(`No company found for code: ${company_code}`);
                return res.status(404).json({ error: 'Company not found' });
            }

            console.log('Company logo retrieved successfully');
            res.status(200).json(results[0]);
        });
    }
};

module.exports = companyDetailsController;

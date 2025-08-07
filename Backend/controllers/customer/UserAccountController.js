const db = require('../../config/database');
const path = require('path');
const fs = require('fs');
const { off } = require('process');

const UserAccountController = {
    // GET user account details
    getUserAccountDetails: (req, res) => {
        const  customer_id = req.user?.id;
        const { company_code } = req.query;

        if(!company_code) {
            return res.status(400).json({error: 'company code required'});
        }

        if (!customer_id) {
            return res.status(400).json({ error: 'Customer ID required' });
        }

        const sql = `
            SELECT * FROM customers 
            WHERE customer_id = ? AND company_code = ?
        `;
        
        db.query(sql, [customer_id, company_code], (err, results) => {
            if (err) {
                console.error('Error retrieving user account details:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json(results[0]);
        });
    }
};

module.exports = UserAccountController;
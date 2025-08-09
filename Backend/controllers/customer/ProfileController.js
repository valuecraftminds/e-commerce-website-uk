const db = require('../../config/database');
const path = require('path');
const fs = require('fs');
const { off } = require('process');

// image upload directory


const ProfileController = {
    // GET user profile details
    getProfileDetails: (req, res) => {
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
    },

    // Update profile details
    updateProfileDetails: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code } = req.query;
        const { first_name, last_name, email, phone, password} = req.body;
        const profile_image = req.file ? req.file.filename : null;

        if (!company_code) {
            return res.status(400).json({ error: 'Company code required' });
        }

        if (!customer_id) {
            return res.status(400).json({ error: 'Customer ID required' });
        }

        const sql = `
            UPDATE customers 
            SET first_name = ?, last_name = ?, email = ?, phone = ?, password = ?, profile_image = ?
            WHERE customer_id = ? AND company_code = ?
        `;

        db.query(sql, [first_name, last_name, email, phone, password, profile_image, customer_id, company_code], (err, results) => {
            if (err) {
                console.error('Error updating user account details:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found or no changes made' });
            }
            res.json({
                message: 'Profile updated successfully',
                profile: {
                    first_name,
                    last_name,
                    email,
                    phone,
                    profile_image: profile_image
                }
            })
        });
    }

};

module.exports = ProfileController;
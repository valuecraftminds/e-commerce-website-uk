const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

const AddressController = {
    // GET user addresses
    getAddresses: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code } = req.query;

        if (!company_code) {
            return res.status(400).json({ error: 'Company code required' });
        }

        if (!customer_id) {
            return res.status(400).json({ error: 'Customer ID required' });
        }

        const sql = `
            SELECT * FROM address 
            WHERE customer_id = ? AND company_code = ?
        `;

        db.query(sql, [customer_id, company_code], (err, results) => {
            if (err) {
                console.error('Error retrieving addresses:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            res.status(200).json(results);
        });
    },

    // Add a new address
    // addAddress: (req, res) => {
    //     const customer_id = req.user?.id;
    //     const { company_code } = req.query;
    //     const { address_line1, address_line2, city, state, postal_code, country } = req.body;

    //     if (!company_code) {
    //         return res.status(400).json({ error: 'Company code required' });
    //     }

    //     if (!customer_id) {
    //         return res.status(400).json({ error: 'Customer ID required' });
    //     }

    //     const sql = `
    //         INSERT INTO addresses (customer_id, company_code, address_line1, address_line2, city, state, postal_code, country)
    //         VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    //     `;

    //     db.query(sql, [customer_id, company_code, address_line1, address_line2, city, state, postal_code, country], (err, results) => {
    //         if (err) {
    //             console.error('Error adding address:', err);
    //             return res.status(500).json({ error: 'Server error' });
    //         }
    //         res.status(201).json({ message: 'Address added successfully', addressId: results.insertId });
    //     });
    // }
};

module.exports = AddressController;

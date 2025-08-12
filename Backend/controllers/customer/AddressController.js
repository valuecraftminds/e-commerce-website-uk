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

    // SET default address
    setDefaultAddress: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code, address_id } = req.body;

        if (!customer_id) return res.status(400).json({ error: 'Customer ID required' });
        if (!company_code) return res.status(400).json({ error: 'Company code required' });
        if (!address_id) return res.status(400).json({ error: 'Address ID required' });

        const resetSql = `
            UPDATE address 
            SET is_default = 0 
            WHERE customer_id = ? AND company_code = ? AND address_id <> ?
        `;

        const setSql = `
            UPDATE address 
            SET is_default = 1 
            WHERE address_id = ? AND customer_id = ? AND company_code = ?
        `;

        // First reset all others
        db.query(resetSql, [customer_id, company_code, address_id], (err) => {
            if (err) {
                console.error('Error resetting default addresses:', err);
                return res.status(500).json({ error: 'Server error while resetting defaults' });
            }

            // Then set the chosen one
            db.query(setSql, [address_id, customer_id, company_code], (err2, result) => {
                if (err2) {
                    console.error('Error setting default address:', err2);
                    return res.status(500).json({ error: 'Server error while setting default' });
                }

                if (result.affectedRows === 0) {
                    return res.status(404).json({ error: 'Address not found' });
                }

                return res.status(200).json({ message: 'Default address updated successfully' });
            });
        });
    },

    // DELETE address
    deleteAddress: (req, res) => {  
        const customer_id = req.user?.id;
        const { company_code } = req.query;
        const { address_id } = req.body;

        if (!customer_id) return res.status(400).json({ error: 'Customer ID required' });
        if (!company_code) return res.status(400).json({ error: 'Company code required' });
        if (!address_id) return res.status(400).json({ error: 'Address ID required' });

        const sql = `
            DELETE FROM address 
            WHERE address_id = ? AND customer_id = ? AND company_code = ?
        `;

        db.query(sql, [address_id, customer_id, company_code], (err, result) => {
            if (err) {
                console.error('Error deleting address:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Address not found' });
            }
            res.status(200).json({ message: 'Address deleted successfully' });
        });
    },


    // ADD address
    addAddress: (req, res) => {
    const customer_id = req.user?.id;
    // accept company_code from body or query (frontend sends in body)
    const company_code = req.body.company_code || req.query.company_code;

    const {
        first_name, last_name, house,
        address_line_1, address_line_2,
        city, state, country, postal_code,
        phone,
        set_shipping_as_default
    } = req.body;

    if (!customer_id) return res.status(400).json({ error: 'Customer ID required' });
    if (!company_code) return res.status(400).json({ error: 'Company code required' });

    // basic requireds (match frontend)
    const required = { first_name, last_name, house, address_line_1, city, state, country, postal_code, phone };
    const missing = Object.entries(required).filter(([_, v]) => !String(v || '').trim()).map(([k]) => k);
    if (missing.length) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const insertSql = `
        INSERT INTO address
        (customer_id, company_code, first_name, last_name, house,
        address_line_1, address_line_2, city, state, country, postal_code, phone, is_default)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;

    const params = [
        customer_id, company_code, first_name, last_name, house,
        address_line_1, address_line_2 || null, city, state, country, postal_code, phone
    ];

    db.query(insertSql, params, (err, result) => {
        if (err) {
        console.error('Error adding address:', err);
        return res.status(500).json({ error: 'Server error while adding address' });
        }

        const newId = result.insertId;

        // optionally make it default
        if (set_shipping_as_default) {
        const resetSql = `
            UPDATE address SET is_default = 0
            WHERE customer_id = ? AND company_code = ? AND address_id <> ?
        `;
        const setSql = `
            UPDATE address SET is_default = 1
            WHERE address_id = ? AND customer_id = ? AND company_code = ?
        `;
        db.query(resetSql, [customer_id, company_code, newId], (e1) => {
            if (e1) {
            console.warn('Failed to reset defaults after add:', e1);
            // still return success for add
            return res.status(201).json({
                message: 'Address added (default not updated)',
                address_id: newId,
                address: {
                address_id: newId, customer_id, company_code, first_name, last_name, house,
                address_line_1, address_line_2: address_line_2 || null, city, state, country, postal_code, phone,
                is_default: 0
                }
            });
            }
            db.query(setSql, [newId, customer_id, company_code], (e2) => {
            if (e2) {
                console.warn('Failed to set default after add:', e2);
            }
            return res.status(201).json({
                message: 'Address added successfully',
                address_id: newId,
                address: {
                address_id: newId, customer_id, company_code, first_name, last_name, house,
                address_line_1, address_line_2: address_line_2 || null, city, state, country, postal_code, phone,
                is_default: 1
                }
            });
            });
        });
        } else {
        return res.status(201).json({
            message: 'Address added successfully',
            address_id: newId,
            address: {
            address_id: newId, customer_id, company_code, first_name, last_name, house,
            address_line_1, address_line_2: address_line_2 || null, city, state, country, postal_code, phone,
            is_default: 0
            }
        });
        }
    });
    },

};

module.exports = AddressController;

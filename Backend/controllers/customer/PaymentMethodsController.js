const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../../config/database');

const PaymentMethodsController = {
    // GET user payment methods
    getPaymentMethods: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code } = req.query;

        if (!company_code) {
            return res.status(400).json({ error: 'Company code required' });
        }

        if (!customer_id) {
            return res.status(400).json({ error: 'Customer ID required' });
        }

        const sql = `
            SELECT * FROM payment_method
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

    };

module.exports = PaymentMethodsController;

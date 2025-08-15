const db = require('../../config/database');

const wishlistController = {

    // Add to wishlist
    setWishlist: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code } = req.query || req.params;
        const { 
            style_code, 
            image, 
            name
        } = req.body;

        if (!customer_id) {
        return res.status(400).json({ error: 'customer ID is required' });
        }
        if (!company_code) {
        return res.status(400).json({ error: 'Company code is required' });
        }
        
        if (!style_code) {
        return res.status(400).json({ error: "Style code is required" });
        }

        const sql = `
        INSERT INTO wishlist (
            company_code, 
            customer_id, 
            style_code, 
            name, 
            image,
            updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE image = VALUES(image), updated_at = NOW()
        `;

        db.query(sql, [company_code, customer_id, style_code, name, image], (err) => {
        if (err) {
            console.error('Error adding to wishlist:', err);
            return res.status(500).json({ error: 'Server error' });
        }
        res.status(200).json({ success: true, message: 'Added to wishlist' });
        });
    },

    // fetch wishlist data
    getWishlist: (req, res) => {
    const customer_id = req.user?.id;
    const { company_code } = req.query;

    if (!customer_id) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }
    if (!company_code) {
        return res.status(400).json({ error: 'Company code is required' });
    }

    const sql = `
        SELECT
            w.company_code, 
            w.customer_id, 
            w.style_code, 
            w.name,
            w.image,
            w.updated_at,
            sv.price,
            s.description,
            s.style_id
        FROM wishlist w
        JOIN styles s 
            ON w.style_code = s.style_code
        JOIN style_variants sv
            ON sv.style_code = s.style_code
        WHERE w.customer_id = ?
        AND w.company_code = ?
        GROUP BY
             w.company_code, 
            w.customer_id, 
            w.style_code, 
            w.name, 
            w.image, 
            w.updated_at, 
            s.description
        ORDER BY w.updated_at DESC
    `;

    db.query(sql, [customer_id, company_code], (err, results) => {
        if (err) {
        console.error('Error fetching wishlist:', err);
        return res.status(500).json({ error: 'Server error' });
        }
        res.status(200).json(results);
    });
    },

    // remove items from checklist
    removeFromWishlist: (req, res) => {
    const customer_id = req.user?.id;
    const { style_code } = req.body;
    const { company_code } = req.query;

    if (!customer_id) {
        return res.status(400).json({ error: 'Customer ID is required' });
    }
    if (!style_code) {
        return res.status(400).json({ error: 'Style code is required' });
    }

    const sql = `
        DELETE FROM wishlist 
        WHERE customer_id = ? AND style_code = ?
        ${company_code ? 'AND company_code = ?' : ''}
    `;
    
    const params = company_code ? 
        [customer_id, style_code, company_code] : 
        [customer_id, style_code];

    db.query(sql, params, (err, results) => {
        if (err) {
        console.error('Error removing from wishlist:', err);
        return res.status(500).json({ error: 'Server error' });
        }
        res.status(200).json({ 
        success: true, 
        message: 'Removed from wishlist',
        affected: results.affectedRows 
        });
    });
    },

    // Check if item is in wishlist
    checkWishlist: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code, style_code } = req.query || req.params;

        if (!customer_id || !company_code || !style_code) {
            return res.status(400).json({ error: 'Missing required parameters' });
        }

        const sql = `
            SELECT EXISTS(
                SELECT 1
                FROM wishlist
                WHERE customer_id = ?
                AND company_code = ?
                AND style_code = ?
            ) AS in_wishlist
        `;

        db.query(sql, [customer_id, company_code, style_code], (err, results) => {
            if (err) {
                console.error('Error checking wishlist:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            res.status(200).json({ in_wishlist: results[0].in_wishlist === 1 });
        });
    }


};

module.exports = wishlistController;

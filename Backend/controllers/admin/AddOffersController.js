const db = require('../../config/database');

class AddOffersController{
    // get product details
    getProductDetailsWithDate(req, res){
        const { company_code } = req.query;

        // Validate input
        if (!company_code) {
            return res.status(400).json({ error: 'Company code is required.' });
        }

        // Fetch product details from the database
        const sql = `
            SELECT
                ms.style_number,
                ms.sku,
                s.name AS style_name,
                ms.batch_number,
                ms.lot_no,
                ms.unit_price,
                ms.main_stock_qty,
                ms.created_at,
                sv.sale_price,
                sv.offer_price,
                sv.offer_start_date,
                sv.offer_end_date
            FROM main_stock ms
            JOIN styles s ON ms.style_number = s.style_number
            JOIN style_variants sv ON ms.sku = sv.sku
            WHERE ms.company_code = ?
        `;

        db.query(sql, [company_code], (error, results) => {
            if (error) {
                console.error('Error fetching product details:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                return res.status(404).json({ error: 'No products found' });
            }

            res.json({ products: results });
        });
    }
}

module.exports = new AddOffersController();
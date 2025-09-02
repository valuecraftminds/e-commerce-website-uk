const db = require('../../config/database');

class AddOffersController{
    // get product details
    getProductDetailsWithDate(req, res){
        const { company_code, page = 1, limit = 15 } = req.query;

        // Validate input
        if (!company_code) {
            return res.status(400).json({ error: 'Company code is required.' });
        }

        // Parse pagination parameters
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const offset = (pageNumber - 1) * limitNumber;

        // Validate pagination parameters
        if (pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({ error: 'Invalid pagination parameters' });
        }

        // First, get the total count
        const countSql = `
            SELECT COUNT(*) as total
            FROM main_stock ms
            JOIN styles s ON ms.style_number = s.style_number
            JOIN style_variants sv ON ms.sku = sv.sku
            WHERE ms.company_code = ?
        `;

        db.query(countSql, [company_code], (countError, countResults) => {
            if (countError) {
                console.error('Error counting products:', countError);
                return res.status(500).json({ error: 'Internal server error' });
            }

            const totalItems = countResults[0].total;
            const totalPages = Math.ceil(totalItems / limitNumber);

            // Fetch product details with pagination
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
                ORDER BY ms.created_at DESC
                LIMIT ? OFFSET ?
            `;

            db.query(sql, [company_code, limitNumber, offset], (error, results) => {
                if (error) {
                    console.error('Error fetching product details:', error);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                res.json({ 
                    products: results,
                    pagination: {
                        currentPage: pageNumber,
                        totalPages: totalPages,
                        totalItems: totalItems,
                        itemsPerPage: limitNumber,
                        hasNextPage: pageNumber < totalPages,
                        hasPreviousPage: pageNumber > 1
                    }
                });
            });
        });
    }
}

module.exports = new AddOffersController();
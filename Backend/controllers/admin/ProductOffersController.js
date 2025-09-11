const db = require('../../config/database');

class ProductOffersController{
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
                    sv.unit_price,
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

    createOffer(req, res) {
        const { company_code, sku, offer_price, offer_start_date, offer_end_date } = req.body;

        // Validate input
        if (!sku || !offer_price || !company_code) {
            return res.status(400).json({ error: 'Missing required fields: sku, offer_price, and company_code are required.' });
        }

        const sql = `
            UPDATE style_variants 
            SET offer_price = ?, 
                offer_start_date = ?, 
                offer_end_date = ?
            WHERE sku = ? AND company_code = ?
        `;

        db.query(sql, [offer_price, offer_start_date, offer_end_date, sku, company_code], (error, results) => {
            if (error) {
                console.error('Error creating/updating offer:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Product not found or no changes made.' });
            }

            res.json({ success: true, message: 'Offer created/updated successfully.' });
        });
    }

    //remove offer
    removeOffer(req, res) {
        const { company_code, sku } = req.body;

        // Validate input
        if (!sku || !company_code) {
            return res.status(400).json({ error: 'Missing required fields: sku and company_code are required.' });
        }

        const sql = `
            UPDATE style_variants
            SET offer_price = NULL,
                offer_start_date = NULL,
                offer_end_date = NULL
            WHERE sku = ? AND company_code = ?
        `;

        db.query(sql, [sku, company_code], (error, results) => {
            if (error) {
                console.error('Error removing offer:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'Product not found or no changes made.' });
            }

            res.json({ success: true, message: 'Offer removed successfully.' });
        });
    }

    // search products by style name or style number
    searchProducts(req, res) {
        const { company_code, searchInput } = req.query;

        // Validate input
        if (!company_code || !searchInput) {
            return res.status(400).json({ error: 'Missing required query parameters: company_code and searchInput are required.' });
        }
        const searchTerm = `%${searchInput}%`;
        const sql = `
            SELECT
                    ms.style_number,
                    ms.sku,
                    s.name AS style_name,
                    ms.batch_number,
                    ms.lot_no,
                    sv.unit_price,
                    ms.main_stock_qty,
                    ms.created_at,
                    sv.sale_price,
                    sv.offer_price,
                    sv.offer_start_date,
                    sv.offer_end_date
                FROM main_stock ms
                JOIN styles s ON ms.style_number = s.style_number
                JOIN style_variants sv ON ms.sku = sv.sku
                WHERE ms.company_code = ? AND (s.name LIKE ? OR ms.style_number LIKE ?)
                ORDER BY ms.created_at DESC
        `;
        db.query(sql, [company_code, searchTerm, searchTerm], (error, results) => {
            if (error) {
                console.error('Error searching products:', error);
                return res.status(500).json({ error: 'Internal server error' });
            }
            res.json(results);
        });
    }

    // Filter product offers by type with pagination
    filterProductOffers(req, res) {
        const { company_code, page = 1, limit = 10, filter = 'all' } = req.query;

        if (!company_code) {
            return res.status(400).json({ error: 'Company code is required.' });
        }

        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);
        const offset = (pageNumber - 1) * limitNumber;

        // Get current date in YYYY-MM-DD format
        const currentDate = new Date().toISOString().split('T')[0];

        let whereClause = 'ms.company_code = ?';
        let params = [company_code];

        // Date only comparisons for filtering
        if (filter === 'active_offers') {
            // Active: started already AND not yet ended
            whereClause += ' AND DATE(sv.offer_start_date) <= ? AND DATE(sv.offer_end_date) >= ?';
            params.push(currentDate, currentDate);
        } else if (filter === 'upcoming_offers') {
            // Upcoming: start date is in the future
            whereClause += ' AND DATE(sv.offer_start_date) > ?';
            params.push(currentDate);
        } else if (filter === 'expired_offers') {
            // Expired: end date is in the past
            whereClause += ' AND DATE(sv.offer_end_date) < ?';
            params.push(currentDate);
        }

        // Count query
        const countSql = `
            SELECT COUNT(*) as total
            FROM main_stock ms
            JOIN styles s ON ms.style_number = s.style_number
            JOIN style_variants sv ON ms.sku = sv.sku
            WHERE ${whereClause}
        `;

        db.query(countSql, params, (countError, countResults) => {
            if (countError) {
                console.error('Error counting filtered products:', countError);
                return res.status(500).json({ error: 'Internal server error' });
            }
            const totalItems = countResults[0].total;
            const totalPages = Math.ceil(totalItems / limitNumber);

            // Data query
            const dataSql = `
                SELECT
                    ms.style_number,
                    ms.sku,
                    s.name AS style_name,
                    ms.batch_number,
                    ms.lot_no,
                    sv.unit_price,
                    ms.main_stock_qty,
                    ms.created_at,
                    sv.sale_price,
                    sv.offer_price,
                    sv.offer_start_date,
                    sv.offer_end_date
                FROM main_stock ms
                JOIN styles s ON ms.style_number = s.style_number
                JOIN style_variants sv ON ms.sku = sv.sku
                WHERE ${whereClause}
                ORDER BY ms.created_at DESC
                LIMIT ? OFFSET ?
            `;
            
            db.query(dataSql, [...params, limitNumber, offset], (error, results) => {
                if (error) {
                    console.error('Error fetching filtered product offers:', error);
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

module.exports = new ProductOffersController();
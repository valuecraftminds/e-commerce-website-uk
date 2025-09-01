const db = require('../../config/database'); 

const FeedbackController = {
    // get reviews
    getReview: (req, res) => {
    const { style_id } = req.params;
    const { company_code } = req.query;

    if (!company_code) {
        return res.status(400).json({ error: 'Company code is required' });
    }

    // Convert string to integer for database query
    const styleId = parseInt(style_id);

    const sql = `
        SELECT 
        r.review_id,
        r.customer_id,
        r.order_id,
        r.style_id,
        r.style_number,
        c.first_name AS customer_name,
        r.review,
        r.rating,
        r.sku,
        r.created_at
        FROM reviews r
        INNER JOIN customers c ON r.customer_id = c.customer_id
        INNER JOIN styles s ON r.style_id = s.style_id
        WHERE r.style_id = ? AND r.company_code = ?
        ORDER BY r.created_at DESC
    ;`

    db.query(sql, [styleId, company_code], (err, results) => {
        if (err) {
        console.error('Error retrieving product reviews:', err);
        return res.status(500).json({ error: 'Server error' });
        }
    // Calculate rating
        let stats = { average: 0, total: results.length };
        
        if (results.length > 0) {
        const totalRating = results.reduce((sum, review) => sum + (review.rating || 0), 0);
        stats.average = parseFloat((totalRating / results.length).toFixed(1));
        
        // Calculate rating distribution
        const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        results.forEach(review => {
            if (review.rating >= 1 && review.rating <= 5) {
            distribution[review.rating]++;
            }
        });
        stats.distribution = distribution;
        }

        // Transform the data to match frontend expectations
        const transformedReviews = results.map(review => ({
        review_id: review.review_id,
        user_name: review.customer_name,
        comment: review.review,
        rating: review.rating || 5,
        created_at: review.created_at,
        sku: review.sku
        }));

        // Return in the structure your frontend expects
        res.status(200).json({
        reviews: transformedReviews,
        stats: stats
        });
    });
    },

    addReview: (req, res) => {
        const customer_id = req.user?.id;
        const { order_id, style_id, style_number, review, rating, sku } = req.body;
        const { company_code } = req.query;

        if (!company_code) {
            return res.status(400).json({ error: 'Company code is required' });
        }

        if (!customer_id || !order_id || !style_id || !style_number || !review || !rating) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const sql = `
            INSERT INTO reviews (customer_id, order_id, style_id, style_number, review, rating, company_code, created_at, sku)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        ;`;

        db.query(sql, [customer_id, order_id, style_id, style_number, review, rating, company_code, sku], (err, result) => {
            if (err) {
                console.error('Error adding review:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            res.status(201).json({ review_id: result.insertId });
        });
    },
    
    // Get customer's feedback history
    getFeedbackHistory: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code } = req.query;

        if (!company_code) {
            return res.status(400).json({ error: 'Company code is required' });
        }

        if (!customer_id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const sql = `
            SELECT 
                r.review_id,
                r.order_id,
                r.style_id,
                r.style_number,
                r.review,
                r.rating,
                r.created_at,
                r.company_code,
                s.name,
                s.image,
                r.sku
            FROM reviews r
            INNER JOIN styles s ON r.style_id = s.style_id
            WHERE r.customer_id = ? AND r.company_code = ?
            ORDER BY created_at DESC
        `;

        db.query(sql, [customer_id, company_code], (err, results) => {
            if (err) {
                console.error('Error retrieving feedback history:', err);
                return res.status(500).json({ error: 'Server error' });
            }

            res.status(200).json({ feedback: results });
        });
    }
}

module.exports = FeedbackController;
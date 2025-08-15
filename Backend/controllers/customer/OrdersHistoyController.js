const db = require('../../config/database');

const OrdersHistoryController = {
    // Get all orders
    getAllOrders: async (req, res) => {
        const customerId = req.user?.id;
        const { company_code } = req.query;
        
        const query = `
            SELECT 
                order_id,
                order_number,
                order_status,
                order_notes,
                subtotal,
                tax_amount,
                shipping_fee,
                total_amount,
                total_items,
                created_at,
                customer_id,
                address_id,
                payment_method_id,
                company_code
            FROM orders 
            WHERE customer_id = ? AND company_code = ?
            ORDER BY created_at DESC
        `;
        
        db.query(query, [customerId, company_code], (error, results) => {
            if (error) {
                console.error('Error fetching orders:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message
                });
            }
            if (results.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No orders found for this customer'
                });
            }
            res.json({
                success: true,
                data: results,
                count: results.length
            });
        });
    },

    // Get orders by status
    getOrdersByStatus: async (req, res) => {
        const customerId = req.user?.id;
        const { company_code } = req.query;
        const status = req.query.status;

        if (!status) {
            return res.status(400).json({
                success: false,
                message: 'Status parameter is required'
            });
        }

        // Handle multiple statuses
        let statuses = [];
        if (Array.isArray(status)) {
            statuses = status;
        } else if (typeof status === 'string') {
            statuses = status.split(',').map(s => s.trim());
        }

        // Create placeholders for the IN clause
        const placeholders = statuses.map(() => '?').join(',');

        const query = `
            SELECT 
                order_id,
                order_number,
                order_status,
                order_notes,
                subtotal,
                tax_amount,
                shipping_fee,
                total_amount,
                total_items,
                created_at,
                customer_id,
                address_id,
                payment_method_id,
                company_code
            FROM orders 
            WHERE customer_id = ?
            AND company_code = ?
            AND order_status IN (${placeholders})
            ORDER BY created_at DESC
        `;

        // Build the parameters array correctly
        const params = [customerId, company_code, ...statuses];

        db.query(query, params, (error, results) => {
            if (error) {
                console.error('Error fetching orders by status:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message
                });
            }
            
            if (results.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: 'No orders found for this customer with given status',
                    data: [],
                    count: 0,
                    filters: {
                        statuses
                    }
                });
            }
            
            res.json({
                success: true,
                data: results,
                count: results.length,
                filters: {
                    statuses
                }
            });
        });
    }


    //
};

module.exports = OrdersHistoryController;

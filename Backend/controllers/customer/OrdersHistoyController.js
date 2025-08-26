const db = require('../../config/database');

const OrdersHistoryController = {
    // Get all orders with items and derived booking status
    getAllOrders: async (req, res) => {
        const customerId = req.user?.id;
        const { company_code } = req.query;
        
        // Updated query to include booking status logic
        const ordersQuery = `
            SELECT 
                o.order_id,
                o.order_number,
                o.order_status as original_order_status,
                o.order_notes,
                o.subtotal,
                o.tax_amount,
                o.shipping_fee,
                o.total_amount,
                o.total_items,
                o.created_at,
                o.customer_id,
                o.address_id,
                o.payment_method_id,
                o.company_code,
                CASE 
                    WHEN COUNT(CASE WHEN b.status = 'pending' THEN 1 END) = COUNT(*) THEN 'pending'
                    WHEN COUNT(CASE WHEN b.status = 'issued' THEN 1 END) = COUNT(*) THEN 'issued'
                    WHEN COUNT(CASE WHEN b.status = 'issued' THEN 1 END) > 0 AND COUNT(CASE WHEN b.status = 'pending' THEN 1 END) > 0 THEN 'partially_issued'
                    ELSE 'unknown'
                END as derived_order_status
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN booking b ON oi.booking_id = b.booking_id
            WHERE o.customer_id = ? AND o.company_code = ? AND o.company_code = oi.company_code
            GROUP BY o.order_id, o.company_code, o.customer_id, o.order_number, o.address_id, 
                     o.payment_method_id, o.subtotal, o.shipping_fee, o.tax_amount, o.total_amount, 
                     o.total_items, o.order_status, o.order_notes, o.created_at
            ORDER BY o.created_at DESC
        `;

        const itemsQuery = `
            SELECT 
                oi.order_id,
                oi.order_item_id,
                s.name as product_name,
                s.image as image_url,
                oi.quantity,
                b.status as booking_status
            FROM order_items oi
            INNER JOIN style_variants sv ON oi.variant_id = sv.variant_id
            INNER JOIN styles s ON sv.style_number = s.style_number
            INNER JOIN booking b ON oi.booking_id = b.booking_id
            WHERE oi.order_id IN (?) AND oi.company_code = ?
            ORDER BY oi.order_item_id
        `;
        
        db.query(ordersQuery, [customerId, company_code], (error, orderResults) => {
            if (error) {
                console.error('Error fetching orders:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message
                });
            }
            
            if (orderResults.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'No orders found for this customer'
                });
            }

            // Get order IDs for fetching items
            const orderIds = orderResults.map(order => order.order_id);
            
            // Fetch items for all orders
            db.query(itemsQuery, [orderIds, company_code], (itemError, itemResults) => {
                if (itemError) {
                    console.error('Error fetching order items:', itemError);
                    return res.status(500).json({
                        success: false,
                        message: 'Internal server error',
                        error: itemError.message
                    });
                }

                // Group items by order_id
                const itemsByOrder = {};
                itemResults.forEach(item => {
                    if (!itemsByOrder[item.order_id]) {
                        itemsByOrder[item.order_id] = [];
                    }
                    itemsByOrder[item.order_id].push({
                        order_item_id: item.order_item_id,
                        product_name: item.product_name,
                        image_url: item.image_url,
                        quantity: item.quantity,
                        booking_status: item.booking_status
                    });
                });

                // Add items to each order
                const ordersWithItems = orderResults.map(order => ({
                    ...order,
                    order_status: order.derived_order_status, // Use derived status
                    items: itemsByOrder[order.order_id] || []
                }));

                res.json({
                    success: true,
                    data: ordersWithItems,
                    count: ordersWithItems.length
                });
            });
        });
    },

    // Get orders by status with items (updated to work with derived booking status)
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

        // Updated query to filter by derived booking status
        const ordersQuery = `
            SELECT 
                o.order_id,
                o.order_number,
                o.order_status as original_order_status,
                o.order_notes,
                o.subtotal,
                o.tax_amount,
                o.shipping_fee,
                o.total_amount,
                o.total_items,
                o.created_at,
                o.customer_id,
                o.address_id,
                o.payment_method_id,
                o.company_code,
                CASE 
                    WHEN COUNT(CASE WHEN b.status = 'pending' THEN 1 END) = COUNT(*) THEN 'pending'
                    WHEN COUNT(CASE WHEN b.status = 'issued' THEN 1 END) = COUNT(*) THEN 'issued'
                    WHEN COUNT(CASE WHEN b.status = 'issued' THEN 1 END) > 0 AND COUNT(CASE WHEN b.status = 'pending' THEN 1 END) > 0 THEN 'partially_issued'
                    ELSE 'unknown'
                END as derived_order_status
            FROM orders o
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN booking b ON oi.booking_id = b.booking_id
            WHERE o.customer_id = ? AND o.company_code = ? AND o.company_code = oi.company_code
            GROUP BY o.order_id, o.company_code, o.customer_id, o.order_number, o.address_id, 
                     o.payment_method_id, o.subtotal, o.shipping_fee, o.tax_amount, o.total_amount, 
                     o.total_items, o.order_status, o.order_notes, o.created_at
            HAVING derived_order_status IN (${statuses.map(() => '?').join(',')})
            ORDER BY o.created_at DESC
        `;

        const itemsQuery = `
            SELECT 
                oi.order_id,
                oi.order_item_id,
                s.name as product_name,
                s.image as image_url,
                oi.quantity,
                b.status as booking_status
            FROM order_items oi
            INNER JOIN style_variants sv ON oi.variant_id = sv.variant_id
            INNER JOIN styles s ON sv.style_number = s.style_number
            INNER JOIN booking b ON oi.booking_id = b.booking_id
            WHERE oi.order_id IN (?) AND oi.company_code = ?
            ORDER BY oi.order_item_id
        `;

        // Build the parameters array correctly
        const params = [customerId, company_code, ...statuses];

        db.query(ordersQuery, params, (error, orderResults) => {
            if (error) {
                console.error('Error fetching orders by status:', error);
                return res.status(500).json({
                    success: false,
                    message: 'Internal server error',
                    error: error.message
                });
            }
            
            if (orderResults.length === 0) {
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

            // Get order IDs for fetching items
            const orderIds = orderResults.map(order => order.order_id);
            
            // Fetch items for all orders
            db.query(itemsQuery, [orderIds, company_code], (itemError, itemResults) => {
                if (itemError) {
                    console.error('Error fetching order items:', itemError);
                    return res.status(500).json({
                        success: false,
                        message: 'Internal server error',
                        error: itemError.message
                    });
                }

                // Group items by order_id
                const itemsByOrder = {};
                itemResults.forEach(item => {
                    if (!itemsByOrder[item.order_id]) {
                        itemsByOrder[item.order_id] = [];
                    }
                    itemsByOrder[item.order_id].push({
                        order_item_id: item.order_item_id,
                        product_name: item.product_name,
                        image_url: item.image_url,
                        quantity: item.quantity,
                        booking_status: item.booking_status
                    });
                });

                // Add items to each order
                const ordersWithItems = orderResults.map(order => ({
                    ...order,
                    order_status: order.derived_order_status, // Use derived status
                    items: itemsByOrder[order.order_id] || []
                }));
            
                res.json({
                    success: true,
                    data: ordersWithItems,
                    count: ordersWithItems.length,
                    filters: {
                        statuses
                    }
                });
            });
        });
    },

    // Get specific order details with booking status
    getOrderDetails: async (req, res) => {
        const orderId = req.params.id;
        const customerId = req.user?.id;
        const { company_code } = req.query;

        if (!orderId) {
            return res.status(400).json({
                success: false,
                message: 'Order ID is required'
            });
        }

        if (!customerId) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized access'
            });
        }

        if (!company_code) {
            return res.status(400).json({
                success: false,
                message: 'Company code is required'
            });
        }

        // Get order details with shipping address and derived booking status
        const orderQuery = `
            SELECT 
                o.order_id,
                o.order_number,
                o.order_status as original_order_status,
                o.order_notes,
                o.subtotal,
                o.tax_amount,
                o.shipping_fee,
                o.total_amount,
                o.total_items,
                o.created_at,
                o.address_id,
                a.address_line_1,
                a.address_line_2,
                a.city,
                a.state,
                a.postal_code,
                a.country,
                a.phone,
                CONCAT(a.first_name, ' ', a.last_name) as shipping_name,
                CASE 
                    WHEN COUNT(CASE WHEN b.status = 'pending' THEN 1 END) = COUNT(*) THEN 'pending'
                    WHEN COUNT(CASE WHEN b.status = 'issued' THEN 1 END) = COUNT(*) THEN 'issued'
                    WHEN COUNT(CASE WHEN b.status = 'issued' THEN 1 END) > 0 AND COUNT(CASE WHEN b.status = 'pending' THEN 1 END) > 0 THEN 'partially_issued'
                    ELSE 'unknown'
                END as derived_order_status
            FROM orders o
            LEFT JOIN address a ON o.address_id = a.address_id
            JOIN order_items oi ON o.order_id = oi.order_id
            JOIN booking b ON oi.booking_id = b.booking_id
            WHERE o.order_id = ? AND o.customer_id = ? AND o.company_code = ?
            GROUP BY o.order_id, o.order_number, o.order_status, o.order_notes, o.subtotal, 
                     o.tax_amount, o.shipping_fee, o.total_amount, o.total_items, o.created_at, 
                     o.address_id, a.address_line_1, a.address_line_2, a.city, a.state, 
                     a.postal_code, a.country, a.phone, a.first_name, a.last_name
        `;

        // Get order items with style details, images, and booking status
        const itemsQuery = `
            SELECT 
                oi.order_item_id,
                oi.quantity,
                oi.unit_price,
                oi.total_price,
                oi.variant_id,
                sv.sku,
                sv.sale_price as variant_price,
                sv.offer_price,
                sv.style_number,
                s.style_id,
                s.name as style_name,
                s.description as style_description,
                s.image as style_image,
                b.status as booking_status
            FROM order_items oi
            INNER JOIN style_variants sv ON oi.variant_id = sv.variant_id
            INNER JOIN styles s ON sv.style_number = s.style_number
            INNER JOIN booking b ON oi.booking_id = b.booking_id
            WHERE oi.order_id = ? AND oi.company_code = ?
            ORDER BY oi.order_item_id
        `;

        try {
            // Get order details
            db.query(orderQuery, [orderId, customerId, company_code], (error, orderResults) => {
                if (error) {
                    console.error('Error fetching specific order:', error);
                    return res.status(500).json({
                        success: false,
                        message: 'Internal server error',
                        error: error.message
                    });
                }

                if (orderResults.length === 0) {
                    return res.status(404).json({
                        success: false,
                        message: 'Order not found for this customer'
                    });
                }

                // Get order items
                db.query(itemsQuery, [orderId, company_code], (itemError, itemResults) => {
                    if (itemError) {
                        console.error('Error fetching order items:', itemError);
                        return res.status(500).json({
                            success: false,
                            message: 'Internal server error',
                            error: itemError.message
                        });
                    }

                    const orderResult = orderResults[0];
                    
                    const orderData = {
                        order_id: orderResult.order_id,
                        order_number: orderResult.order_number,
                        order_status: orderResult.derived_order_status, // Use derived status
                        original_order_status: orderResult.original_order_status,
                        order_notes: orderResult.order_notes,
                        subtotal: orderResult.subtotal,
                        tax_amount: orderResult.tax_amount,
                        shipping_fee: orderResult.shipping_fee,
                        total_amount: orderResult.total_amount,
                        total_items: orderResult.total_items,
                        created_at: orderResult.created_at,
                        address: orderResult.address_id ? {
                            address_id: orderResult.address_id,
                            full_name: orderResult.shipping_name,
                            address_line_1: orderResult.address_line_1,
                            address_line_2: orderResult.address_line_2,
                            city: orderResult.city,
                            state: orderResult.state,
                            postal_code: orderResult.postal_code,
                            country: orderResult.country,
                            phone: orderResult.phone
                        } : null,
                        items: itemResults.map(item => ({
                            order_item_id: item.order_item_id,
                            quantity: item.quantity,
                            unit_price: item.unit_price,
                            total_price: item.total_price,
                            booking_status: item.booking_status,
                            variant: {
                                variant_id: item.variant_id,
                                sku: item.sku,
                                sale_price: item.variant_price,
                                offer_price: item.offer_price,
                            },
                            style: {
                                style_id: item.style_id,
                                style_number: item.style_number,
                                name: item.style_name,
                                description: item.style_description,
                                image: item.style_image
                            }
                        }))
                    };

                    res.json({
                        success: true,
                        data: orderData
                    });
                });
            });
        } catch (error) {
            console.error('Unexpected error:', error);
            return res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    },
};

module.exports = OrdersHistoryController;
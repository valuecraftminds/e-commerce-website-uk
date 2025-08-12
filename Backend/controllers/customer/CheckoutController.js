const db = require('../../config/database');

const CheckoutController = {
  submitCheckout: (req, res) => {
    const  customer_id = req.user?.id;
    const { company_code } = req.query;
    console.log('Company Code:', company_code);
    console.log('Customer ID:', req.user);

    const {
      first_name,
      last_name,
      house,
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      postal_code,
      phone,
      payment_method
    } = req.body;

    // Validate required fields
    if (!customer_id) {
      return res.status(401).json({ error: 'BE: User not authenticated' });
    }

    if (!payment_method || !payment_method.method_type) {
      return res.status(400).json({ error: 'Payment method is required' });
    }

    // Insert into address table
    const addressQuery = `
      INSERT INTO address (
        company_code, 
        customer_id, 
        first_name, 
        last_name, 
        house, 
        address_line_1, 
        address_line_2, 
        city, 
        state, 
        country, 
        postal_code, 
        phone,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const addressValues = [
      company_code,
      customer_id,
      first_name,
      last_name,
      house,
      address_line_1,
      address_line_2,
      city,
      state,
      country,
      postal_code,
      phone,
      new Date(),
      new Date()
    ];

    db.query(addressQuery, addressValues, (addressErr, addressResult) => {
      if (addressErr) {
        console.error('Error inserting address:', addressErr);
        return res.status(500).json({ 
          error: 'Failed to insert address',
          details: addressErr.message 
        });
      }

      // Extract payment method details with proper defaults
      const {
        method_type,
        provider = null,
        card_number = null,
        card_expiry_date = null,
        card_cvv = null,
        paypal_email = null,
        bank_account = null,
        bank_name = null
      } = payment_method;

      const paymentQuery = `
        INSERT INTO payment_method (
          company_code, 
          customer_id, 
          method_type, 
          provider, 
          card_number, 
          card_expiry_date, 
          card_cvv, 
          paypal_email, 
          bank_account, 
          bank_name, 
          created_at, 
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const paymentValues = [
        company_code,
        customer_id, 
        method_type,
        provider,
        card_number,
        card_expiry_date,
        card_cvv,
        paypal_email,
        bank_account,
        bank_name,
        new Date(),
        new Date()
      ];

      db.query(paymentQuery, paymentValues, (paymentErr, paymentResult) => {
        if (paymentErr) {
          console.error('Error inserting payment method:', paymentErr);
          return res.status(500).json({ 
            error: 'Failed to insert payment method',
            details: paymentErr.message 
          });
        }

        res.status(201).json({ 
          message: 'Checkout details submitted successfully',
          address_id: addressResult.insertId,
          payment_method_id: paymentResult.insertId
        });
      });
    });
  }
};

module.exports = CheckoutController;
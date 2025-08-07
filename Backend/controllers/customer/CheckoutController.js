const db = require('../../config/database');

const CheckoutController = {
  submitCheckout: (req, res) => {
    const { company_code } = req.query;
    const {
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
      payment_method
    } = req.body;

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
        phone
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
      phone
    ];

    db.query(addressQuery, addressValues, (addressErr, addressResult) => {
      if (addressErr) {
        console.error('Error inserting address:', addressErr);
        return res.status(500).json({ error: 'Failed to insert address' });
      }

      // Destructure payment method with defaults
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
      const now = new Date();
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
          return res.status(500).json({ error: 'Failed to insert payment method' });
        }

        res.json({ message: 'Checkout details submitted successfully' });
      });
    });
  }
};

module.exports = CheckoutController;

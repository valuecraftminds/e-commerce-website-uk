const db = require('../../config/database');

const CheckoutController = {
    submitCheckout: async (req, res) => {
  try {
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
    await db.query(
      `INSERT INTO address
      (company_code, customer_id, first_name, last_name, house, address_line_1, address_line_2, city, state, country, postal_code, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
      ]
    );

    // Destructure payment method fields with defaults
    let {
      method_type,
      provider = null,
      card_number = null,
      card_expiry_date = null,
      card_cvv = null,
      paypal_email = null,
      bank_account = null,
      bank_name = null
    } = payment_method;

    // Insert into payment_method table
    await db.query(
      `INSERT INTO payment_method
      (company_code, customer_id, method_type, provider, card_number, card_expiry_date, card_cvv, paypal_email, bank_account, bank_name, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
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
        new Date(), // created_at
        new Date()  // updated_at
      ]
    );

    res.json({ message: 'Checkout details submitted successfully' });
  } catch (error) {
    console.error('Error submitting checkout details:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
};

module.exports = CheckoutController;

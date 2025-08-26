const db = require('../../config/database');



class IssuingController {
  // Get all bookings for a company (include style_number)
  getBookings(req, res) {
    const { company_code } = req.query;
    db.query(
      'SELECT booking_id, company_code, order_item_id, sku, style_number, ordered_qty, status, created_at FROM booking WHERE company_code = ?',
      [company_code],
      (err, results) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(results);
        }
      }
    );
  }

  // Get main stock for a company, style_number, and sku
  getMainStock(req, res) {
    const { company_code, style_number, sku } = req.query;
    db.query(
      'SELECT * FROM main_stock WHERE company_code = ? AND style_number = ? AND sku = ?',
      [company_code, style_number, sku],
      (err, results) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(results);
        }
      }
    );
  }

  // Issue stock (main_stock_qty updated by trigger)
  issueStock(req, res) {
    const { company_code, style_number, sku, batch_number, lot_no, unit_price, issuing_qty, booking_id } = req.body;
    db.query(
      'INSERT INTO stock_issuing (company_code, style_number, sku, batch_number, lot_no, unit_price, issuing_qty) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [company_code, style_number, sku, batch_number, lot_no, unit_price, issuing_qty],
      (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          // Update booking status to Issued
          if (booking_id) {
            db.query(
              'UPDATE booking SET status = ? WHERE booking_id = ?',
              ['Issued', booking_id],
              (err2) => {
                if (err2) {
                  res.status(500).json({ error: err2.message });
                } else {
                  res.json({ success: true });
                }
              }
            );
          } else {
            res.json({ success: true });
          }
        }
      }
    );
  }
}

module.exports = new IssuingController();

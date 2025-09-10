const db = require('../../config/database');

// Get footer data for customer side
const getCustomerFooter = (req, res) => {
  const { company_code } = req.query;

  if (!company_code) {
    return res.status(400).json({
      success: false,
      message: 'Company code is required'
    });
  }

  const query = `
    SELECT 
      cf.footer_id,
      cf.section_title,
      cfi.item_id,
      cfi.item_title,
      cfi.item_url,
      cfi.is_external_link
    FROM custom_footer cf
    LEFT JOIN custom_footer_items cfi ON cf.footer_id = cfi.footer_id
    WHERE cf.company_code = ? 
      AND cf.is_active = TRUE 
      AND (cfi.is_active = TRUE OR cfi.is_active IS NULL)
    ORDER BY cf.footer_id ASC, cfi.item_id ASC
  `;

  db.query(query, [company_code], (err, results) => {
    if (err) {
      console.error('Error fetching customer footer:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching footer data'
      });
    }

    // Group results by footer section
    const footerSections = {};
    
    results.forEach(row => {
      if (!footerSections[row.footer_id]) {
        footerSections[row.footer_id] = {
          footer_id: row.footer_id,
          section_title: row.section_title,
          items: []
        };
      }

      if (row.item_id) {
        footerSections[row.footer_id].items.push({
          item_id: row.item_id,
          item_title: row.item_title,
          item_url: row.item_url,
          is_external_link: row.is_external_link
        });
      }
    });

    const sectionsArray = Object.values(footerSections);

    res.json({
      success: true,
      data: sectionsArray
    });
  });
};

module.exports = {
  getCustomerFooter
};

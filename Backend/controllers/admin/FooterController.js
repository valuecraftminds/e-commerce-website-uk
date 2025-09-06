const db = require('../../config/database');

// Get all footer sections with their items
const getFooterSections = (req, res) => {
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
      cf.section_order,
      cf.is_active as section_active,
      cf.created_at,
      cf.updated_at,
      cfi.item_id,
      cfi.item_title,
      cfi.item_url,
      cfi.item_order,
      cfi.is_external_link,
      cfi.is_active as item_active
    FROM custom_footer cf
    LEFT JOIN custom_footer_items cfi ON cf.footer_id = cfi.footer_id
    WHERE cf.company_code = ?
    ORDER BY cf.section_order ASC, cfi.item_order ASC
  `;

  db.query(query, [company_code], (err, results) => {
    if (err) {
      console.error('Error fetching footer sections:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching footer sections'
      });
    }

    // Group results by footer section
    const footerSections = {};
    
    results.forEach(row => {
      if (!footerSections[row.footer_id]) {
        footerSections[row.footer_id] = {
          footer_id: row.footer_id,
          section_title: row.section_title,
          section_order: row.section_order,
          section_active: row.section_active,
          created_at: row.created_at,
          updated_at: row.updated_at,
          items: []
        };
      }

      if (row.item_id) {
        footerSections[row.footer_id].items.push({
          item_id: row.item_id,
          item_title: row.item_title,
          item_url: row.item_url,
          item_order: row.item_order,
          is_external_link: row.is_external_link,
          item_active: row.item_active
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

// Create new footer section
const createFooterSection = (req, res) => {
  const { company_code, section_title, section_order = 1 } = req.body;

  if (!company_code || !section_title) {
    return res.status(400).json({
      success: false,
      message: 'Company code and section title are required'
    });
  }

  const query = `
    INSERT INTO custom_footer (company_code, section_title, section_order)
    VALUES (?, ?, ?)
  `;

  db.query(query, [company_code, section_title, section_order], (err, result) => {
    if (err) {
      console.error('Error creating footer section:', err);
      return res.status(500).json({
        success: false,
        message: 'Error creating footer section'
      });
    }

    res.json({
      success: true,
      message: 'Footer section created successfully',
      footer_id: result.insertId
    });
  });
};

// Update footer section
const updateFooterSection = (req, res) => {
  const { footer_id } = req.params;
  const { section_title, section_order, is_active } = req.body;

  if (!footer_id) {
    return res.status(400).json({
      success: false,
      message: 'Footer ID is required'
    });
  }

  const query = `
    UPDATE custom_footer 
    SET section_title = ?, section_order = ?, is_active = ?
    WHERE footer_id = ?
  `;

  db.query(query, [section_title, section_order, is_active, footer_id], (err, result) => {
    if (err) {
      console.error('Error updating footer section:', err);
      return res.status(500).json({
        success: false,
        message: 'Error updating footer section'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Footer section not found'
      });
    }

    res.json({
      success: true,
      message: 'Footer section updated successfully'
    });
  });
};

// Delete footer section
const deleteFooterSection = (req, res) => {
  const { footer_id } = req.params;

  if (!footer_id) {
    return res.status(400).json({
      success: false,
      message: 'Footer ID is required'
    });
  }

  const query = 'DELETE FROM custom_footer WHERE footer_id = ?';

  db.query(query, [footer_id], (err, result) => {
    if (err) {
      console.error('Error deleting footer section:', err);
      return res.status(500).json({
        success: false,
        message: 'Error deleting footer section'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Footer section not found'
      });
    }

    res.json({
      success: true,
      message: 'Footer section deleted successfully'
    });
  });
};

// Create footer item
const createFooterItem = (req, res) => {
  const { footer_id, item_title, item_url, item_order = 1, is_external_link = false } = req.body;

  if (!footer_id || !item_title) {
    return res.status(400).json({
      success: false,
      message: 'Footer ID and item title are required'
    });
  }

  const query = `
    INSERT INTO custom_footer_items (footer_id, item_title, item_url, item_order, is_external_link)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(query, [footer_id, item_title, item_url, item_order, is_external_link], (err, result) => {
    if (err) {
      console.error('Error creating footer item:', err);
      return res.status(500).json({
        success: false,
        message: 'Error creating footer item'
      });
    }

    res.json({
      success: true,
      message: 'Footer item created successfully',
      item_id: result.insertId
    });
  });
};

// Update footer item
const updateFooterItem = (req, res) => {
  const { item_id } = req.params;
  const { item_title, item_url, item_order, is_external_link, is_active } = req.body;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: 'Item ID is required'
    });
  }

  const query = `
    UPDATE custom_footer_items 
    SET item_title = ?, item_url = ?, item_order = ?, is_external_link = ?, is_active = ?
    WHERE item_id = ?
  `;

  db.query(query, [item_title, item_url, item_order, is_external_link, is_active, item_id], (err, result) => {
    if (err) {
      console.error('Error updating footer item:', err);
      return res.status(500).json({
        success: false,
        message: 'Error updating footer item'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Footer item not found'
      });
    }

    res.json({
      success: true,
      message: 'Footer item updated successfully'
    });
  });
};

// Delete footer item
const deleteFooterItem = (req, res) => {
  const { item_id } = req.params;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: 'Item ID is required'
    });
  }

  const query = 'DELETE FROM custom_footer_items WHERE item_id = ?';

  db.query(query, [item_id], (err, result) => {
    if (err) {
      console.error('Error deleting footer item:', err);
      return res.status(500).json({
        success: false,
        message: 'Error deleting footer item'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Footer item not found'
      });
    }

    res.json({
      success: true,
      message: 'Footer item deleted successfully'
    });
  });
};

module.exports = {
  getFooterSections,
  createFooterSection,
  updateFooterSection,
  deleteFooterSection,
  createFooterItem,
  updateFooterItem,
  deleteFooterItem
};
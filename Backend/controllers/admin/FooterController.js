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

// Create footer item with optional page content
const createFooterItem = (req, res) => {
  const { 
    footer_id, 
    item_title, 
    item_url, 
    item_order = 1, 
    is_external_link = false,
    page_title,
    page_description,
    page_content
  } = req.body;

  if (!footer_id || !item_title) {
    return res.status(400).json({
      success: false,
      message: 'Footer ID and item title are required'
    });
  }

  // For external links, URL is required
  if (is_external_link && !item_url) {
    return res.status(400).json({
      success: false,
      message: 'URL is required for external links'
    });
  }

  // For internal links, page content should be provided
  if (!is_external_link && (!page_title || !page_content)) {
    return res.status(400).json({
      success: false,
      message: 'Page title and content are required for internal links'
    });
  }

  // Generate slug for internal pages
  let page_slug = null;
  if (!is_external_link) {
    page_slug = item_title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }

  const final_url = is_external_link ? item_url : `/${page_slug}`;

  const itemQuery = `
    INSERT INTO custom_footer_items (footer_id, item_title, item_url, item_order, is_external_link)
    VALUES (?, ?, ?, ?, ?)
  `;

  db.query(itemQuery, [footer_id, item_title, final_url, item_order, is_external_link], (err, result) => {
    if (err) {
      console.error('Error creating footer item:', err);
      return res.status(500).json({
        success: false,
        message: 'Error creating footer item'
      });
    }

    const item_id = result.insertId;

    // If it's an internal link, create page content
    if (!is_external_link) {
      const pageQuery = `
        INSERT INTO footer_page_content (item_id, page_title, page_description, page_slug, page_content)
        VALUES (?, ?, ?, ?, ?)
      `;

      db.query(pageQuery, [item_id, page_title, page_description, page_slug, page_content], (err, pageResult) => {
        if (err) {
          console.error('Error creating page content:', err);
          // Delete the item if page creation fails
          db.query('DELETE FROM custom_footer_items WHERE item_id = ?', [item_id]);
          return res.status(500).json({
            success: false,
            message: 'Error creating page content'
          });
        }

        res.json({
          success: true,
          message: 'Footer item and page content created successfully',
          item_id: item_id,
          page_id: pageResult.insertId,
          page_url: final_url
        });
      });
    } else {
      res.json({
        success: true,
        message: 'Footer item created successfully',
        item_id: item_id
      });
    }
  });
};

// Update footer item
const updateFooterItem = (req, res) => {
  const { item_id } = req.params;
  const { 
    item_title, 
    item_url, 
    item_order, 
    is_external_link, 
    is_active,
    page_title,
    page_description,
    page_content 
  } = req.body;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: 'Item ID is required'
    });
  }

  // Update the basic item information
  const itemQuery = `
    UPDATE custom_footer_items 
    SET item_title = ?, item_url = ?, item_order = ?, is_external_link = ?, is_active = ?
    WHERE item_id = ?
  `;

  db.query(itemQuery, [item_title, item_url, item_order, is_external_link, is_active, item_id], (err, result) => {
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

    // If it's an internal link, update or create page content
    if (!is_external_link && page_title && page_content) {
      // Check if page content exists
      const checkPageQuery = 'SELECT page_id FROM footer_page_content WHERE item_id = ?';
      
      db.query(checkPageQuery, [item_id], (err, pageResults) => {
        if (err) {
          console.error('Error checking page content:', err);
          return res.status(500).json({
            success: false,
            message: 'Error checking page content'
          });
        }

        if (pageResults.length > 0) {
          // Update existing page content
          const updatePageQuery = `
            UPDATE footer_page_content 
            SET page_title = ?, page_description = ?, page_content = ?
            WHERE item_id = ?
          `;
          
          db.query(updatePageQuery, [page_title, page_description, page_content, item_id], (err) => {
            if (err) {
              console.error('Error updating page content:', err);
              return res.status(500).json({
                success: false,
                message: 'Error updating page content'
              });
            }

            res.json({
              success: true,
              message: 'Footer item and page content updated successfully'
            });
          });
        } else {
          // Create new page content
          const page_slug = item_title.toLowerCase()
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .trim();

          const createPageQuery = `
            INSERT INTO footer_page_content (item_id, page_title, page_description, page_slug, page_content)
            VALUES (?, ?, ?, ?, ?)
          `;
          
          db.query(createPageQuery, [item_id, page_title, page_description, page_slug, page_content], (err) => {
            if (err) {
              console.error('Error creating page content:', err);
              return res.status(500).json({
                success: false,
                message: 'Error creating page content'
              });
            }

            res.json({
              success: true,
              message: 'Footer item updated and page content created successfully'
            });
          });
        }
      });
    } else {
      // For external links, delete any existing page content
      if (is_external_link) {
        db.query('DELETE FROM footer_page_content WHERE item_id = ?', [item_id], (err) => {
          if (err) {
            console.error('Error deleting page content:', err);
          }
        });
      }

      res.json({
        success: true,
        message: 'Footer item updated successfully'
      });
    }
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

// Get page content by slug
const getPageContent = (req, res) => {
  const { slug } = req.params;

  if (!slug) {
    return res.status(400).json({
      success: false,
      message: 'Page slug is required'
    });
  }

  const query = `
    SELECT 
      fpc.*,
      cfi.item_title,
      cfi.is_external_link,
      cf.company_code
    FROM footer_page_content fpc
    JOIN custom_footer_items cfi ON fpc.item_id = cfi.item_id
    JOIN custom_footer cf ON cfi.footer_id = cf.footer_id
    WHERE fpc.page_slug = ? AND fpc.is_published = TRUE
  `;

  db.query(query, [slug], (err, results) => {
    if (err) {
      console.error('Error fetching page content:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching page content'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    const page = results[0];

    res.json({
      success: true,
      data: {
        page_id: page.page_id,
        page_title: page.page_title,
        page_description: page.page_description,
        page_slug: page.page_slug,
        page_content: page.page_content,
        company_code: page.company_code,
        created_at: page.created_at,
        updated_at: page.updated_at
      }
    });
  });
};

// Update page content
const updatePageContent = (req, res) => {
  const { page_id } = req.params;
  const { page_title, page_description, page_content, is_published } = req.body;

  if (!page_id) {
    return res.status(400).json({
      success: false,
      message: 'Page ID is required'
    });
  }

  const query = `
    UPDATE footer_page_content 
    SET page_title = ?, page_description = ?, page_content = ?, is_published = ?
    WHERE page_id = ?
  `;

  db.query(query, [page_title, page_description, page_content, is_published, page_id], (err, result) => {
    if (err) {
      console.error('Error updating page content:', err);
      return res.status(500).json({
        success: false,
        message: 'Error updating page content'
      });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: 'Page not found'
      });
    }

    res.json({
      success: true,
      message: 'Page content updated successfully'
    });
  });
};

// Get page content for editing (admin)
const getPageContentForEdit = (req, res) => {
  const { item_id } = req.params;

  if (!item_id) {
    return res.status(400).json({
      success: false,
      message: 'Item ID is required'
    });
  }

  const query = `
    SELECT 
      fpc.*,
      cfi.item_title,
      cfi.item_url,
      cfi.is_external_link
    FROM footer_page_content fpc
    JOIN custom_footer_items cfi ON fpc.item_id = cfi.item_id
    WHERE fpc.item_id = ?
  `;

  db.query(query, [item_id], (err, results) => {
    if (err) {
      console.error('Error fetching page content for edit:', err);
      return res.status(500).json({
        success: false,
        message: 'Error fetching page content'
      });
    }

    if (results.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Page content not found'
      });
    }

    const page = results[0];

    res.json({
      success: true,
      data: page
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
  deleteFooterItem,
  getPageContent,
  updatePageContent,
  getPageContentForEdit
};
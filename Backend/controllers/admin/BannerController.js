const db = require('../../config/database');
const path = require('path');
const fs = require('fs');

class BannerController {
  // Utility function to delete banner image file
  static deleteImageFile(filename, operation = 'delete') {
    if (!filename) return;
    
    const imagePath = path.join(__dirname, '../../uploads/banners', filename);
    try {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
        console.log(`✅ Banner image ${operation}d: ${filename}`);
      } else {
        console.log(`⚠️ Banner image not found during ${operation}: ${filename}`);
      }
    } catch (deleteErr) {
      console.error(`❌ Error ${operation}ing banner image: ${filename}`, deleteErr);
      // Don't throw error - log and continue
    }
  }
  // Get all banners for a company
  static getBanners(req, res) {
    const { company_code } = req.query;
    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
    }

    const sql = `
      SELECT 
        cb.*,
        CASE 
          WHEN cb.category_id IS NULL THEN 'Home Page'
          ELSE c.category_name
        END as category_name
      FROM custom_banners cb
      LEFT JOIN categories c ON cb.category_id = c.category_id
      WHERE cb.company_code = ?
      ORDER BY 
        CASE WHEN cb.category_id IS NULL THEN 0 ELSE 1 END,
        c.category_name ASC, 
        cb.created_at DESC
    `;

    db.query(sql, [company_code], (err, results) => {
      if (err) {
        console.error('Error fetching banners:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching banners' 
        });
      }
      res.json({ success: true, banners: results });
    });
  }

  // Get banners by category
  static getBannersByCategory(req, res) {
    const { category_id } = req.params;
    const { company_code } = req.query;
    
    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
    }

    let sql;
    if (category_id === 'home' || category_id === '0' || category_id === 0) {
      sql = `
        SELECT 
          *,
          'Home Page' as category_name
        FROM custom_banners 
        WHERE category_id IS NULL AND company_code = ?
        ORDER BY created_at DESC
      `;
    } else {
      sql = `
        SELECT 
          cb.*,
          c.category_name
        FROM custom_banners cb
        LEFT JOIN categories c ON cb.category_id = c.category_id
        WHERE cb.category_id = ? AND cb.company_code = ?
        ORDER BY cb.created_at DESC
      `;
    }

    db.query(sql, [category_id, company_code], (err, results) => {
      if (err) {
        console.error('Error fetching category banners:', err);
        return res.status(500).json({ 
          success: false, 
          message: 'Error fetching category banners' 
        });
      }
      res.json({ success: true, banners: results });
    });
  }

  // Add new banner
  static addBanner(req, res) {
    const { company_code, category_id } = req.body;
    const bannerImage = req.file ? req.file.filename : null;

    if (!company_code || !category_id || !bannerImage) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code, category ID, and banner image are required' 
      });
    }

    // Check if category exists and belongs to the company (or is special "home" category)
    if (category_id === 'home' || category_id === '0' || category_id === 0) {
      // Special case for home page banners - use category_id = NULL
      const sql = `
        INSERT INTO custom_banners (company_code, category_id, banner_url, created_at, updated_at)
        VALUES (?, ?, ?, NOW(), NOW())
      `;

      db.query(sql, [company_code, null, bannerImage], (err, result) => {
        if (err) {
          console.error('Error adding home banner:', err);
          // Clean up uploaded file if database insert fails
          BannerController.deleteImageFile(bannerImage, 'cleanup');
          return res.status(500).json({ 
            success: false, 
            message: 'Error adding banner' 
          });
        }

        res.json({ 
          success: true, 
          message: 'Home banner added successfully',
          banner_id: result.insertId,
          banner_url: bannerImage
        });
      });
    } else {
      // Regular category validation
      db.query(
        'SELECT category_id FROM categories WHERE category_id = ? AND company_code = ? AND parent_id IS NULL',
        [category_id, company_code],
      (err, categoryResults) => {
        if (err) {
          console.error('Error checking category:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Error validating category' 
          });
        }

        if (categoryResults.length === 0) {
          return res.status(400).json({ 
            success: false, 
            message: 'Invalid category or category does not belong to your company' 
          });
        }

        // Insert banner
        const sql = `
          INSERT INTO custom_banners (company_code, category_id, banner_url, created_at, updated_at)
          VALUES (?, ?, ?, NOW(), NOW())
        `;

        db.query(sql, [company_code, category_id, bannerImage], (err, result) => {
          if (err) {
            console.error('Error adding banner:', err);
            // Clean up uploaded file if database insert fails
            BannerController.deleteImageFile(bannerImage, 'cleanup');
            return res.status(500).json({ 
              success: false, 
              message: 'Error adding banner' 
            });
          }

          res.json({ 
            success: true, 
            message: 'Banner added successfully',
            banner_id: result.insertId,
            banner_url: bannerImage
          });
        });
      }
    );
    } // Close the else block
  }

  // Update banner
  static updateBanner(req, res) {
    const { banner_id } = req.params;
    const { company_code, category_id } = req.body;
    const bannerImage = req.file ? req.file.filename : null;

    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
    }

    // Get existing banner
    db.query(
      'SELECT * FROM custom_banners WHERE banner_id = ? AND company_code = ?',
      [banner_id, company_code],
      (err, bannerResults) => {
        if (err) {
          console.error('Error fetching banner:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Error fetching banner' 
          });
        }

        if (bannerResults.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Banner not found' 
          });
        }

        const existingBanner = bannerResults[0];
        const updateFields = [];
        const updateValues = [];

        if (category_id) {
          updateFields.push('category_id = ?');
          updateValues.push(category_id);
        }

        if (bannerImage) {
          updateFields.push('banner_url = ?');
          updateValues.push(bannerImage);
        }

        updateFields.push('updated_at = NOW()');
        updateValues.push(banner_id, company_code);

        const updateSql = `
          UPDATE custom_banners 
          SET ${updateFields.join(', ')}
          WHERE banner_id = ? AND company_code = ?
        `;

        db.query(updateSql, updateValues, (err) => {
          if (err) {
            console.error('Error updating banner:', err);
            // Clean up new uploaded file if database update fails
            if (bannerImage) {
              BannerController.deleteImageFile(bannerImage, 'cleanup');
            }
            return res.status(500).json({ 
              success: false, 
              message: 'Error updating banner' 
            });
          }

          // Delete old image if new one was uploaded (only after successful update)
          if (bannerImage && existingBanner.banner_url) {
            BannerController.deleteImageFile(existingBanner.banner_url, 'replac');
          }

          res.json({ 
            success: true, 
            message: 'Banner updated successfully' 
          });
        });
      }
    );
  }

  // Delete banner
  static deleteBanner(req, res) {
    const { banner_id } = req.params;
    const { company_code } = req.query;

    if (!company_code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Company code is required' 
      });
    }

    // Get banner details before deletion
    db.query(
      'SELECT banner_url FROM custom_banners WHERE banner_id = ? AND company_code = ?',
      [banner_id, company_code],
      (err, results) => {
        if (err) {
          console.error('Error fetching banner:', err);
          return res.status(500).json({ 
            success: false, 
            message: 'Error fetching banner' 
          });
        }

        if (results.length === 0) {
          return res.status(404).json({ 
            success: false, 
            message: 'Banner not found' 
          });
        }

        const bannerUrl = results[0].banner_url;

        // Delete from database
        db.query(
          'DELETE FROM custom_banners WHERE banner_id = ? AND company_code = ?',
          [banner_id, company_code],
          (err) => {
            if (err) {
              console.error('Error deleting banner:', err);
              return res.status(500).json({ 
                success: false, 
                message: 'Error deleting banner' 
              });
            }

            // Delete image file
            BannerController.deleteImageFile(bannerUrl, 'delet');

            res.json({ 
              success: true, 
              message: 'Banner deleted successfully' 
            });
          }
        );
      }
    );
  }
}

module.exports = BannerController;
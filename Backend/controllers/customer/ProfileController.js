const db = require('../../config/database');
const path = require('path');
const fs = require('fs');
const { off } = require('process');

const ProfileController = {
    // GET user profile details
    getProfileDetails: (req, res) => {
        const  customer_id = req.user?.id;
        const { company_code } = req.query;

        if(!company_code) {
            return res.status(400).json({error: 'company code required'});
        }

        if (!customer_id) {
            return res.status(400).json({ error: 'Customer ID required' });
        }

        const sql = `
            SELECT * FROM customers 
            WHERE customer_id = ? AND company_code = ?
        `;
        
        db.query(sql, [customer_id, company_code], (err, results) => {
            if (err) {
                console.error('Error retrieving user account details:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            if (results.length === 0) {
                return res.status(404).json({ error: 'User not found' });
            }
            res.status(200).json(results[0]);
        });
    },

    // Update profile details
    updateProfileDetails: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code } = req.query;
        const { first_name, last_name, email, phone, password} = req.body;
        
        if (!company_code) {
            return res.status(400).json({ error: 'Company code required' });
        }

        if (!customer_id) {
            return res.status(400).json({ error: 'Customer ID required' });
        }

        const sql = `
            UPDATE customers 
            SET first_name = ?, last_name = ?, email = ?, phone = ?, password = ?
            WHERE customer_id = ? AND company_code = ?
        `;

        db.query(sql, [first_name, last_name, email, phone, password, customer_id, company_code], (err, results) => {
            if (err) {
                console.error('Error updating user account details:', err);
                return res.status(500).json({ error: 'Server error' });
            }
            if (results.affectedRows === 0) {
                return res.status(404).json({ error: 'User not found or no changes made' });
            }
            res.json({
                message: 'Profile updated successfully',
                profile: {
                    first_name,
                    last_name,
                    email,
                    phone
                }
            })
        });
    },

    // update profile image
    uploadProfileImage: (req, res) => {
        const customer_id = req.user?.id;
        const { company_code } = req.query;

        if (!company_code) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Company code required' });
        }

        if (!customer_id) {
            if (req.file) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Customer ID required' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No image file uploaded' });
        }

        // Get current profile image
        const getCurrentImageSql = `
            SELECT profile_image FROM customers 
            WHERE company_code = ? AND customer_id = ?
        `;

        db.query(getCurrentImageSql, [company_code, customer_id], (err, results) => {
            if (err) {
                console.error('Error getting current image:', err);
                fs.unlinkSync(req.file.path);
                return res.status(500).json({ error: 'Server error' });
            }

            if (results.length === 0) {
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ error: 'User not found' });
            }

            const oldImage = results[0].profile_image;

            // Update database with new image
            const updateSql = `
                UPDATE customers 
                SET profile_image = ?, updated_at = NOW()
                WHERE customer_id = ? AND company_code = ?
            `;

            db.query(updateSql, [req.file.filename, customer_id, company_code], (updateErr) => {
                if (updateErr) {
                    console.error('Error updating profile image:', updateErr);
                    fs.unlinkSync(req.file.path);
                    return res.status(500).json({ error: 'Server error' });
                }

                // Delete old image if exists
                if (oldImage) {
                    const oldImagePath = path.join('uploads/profile_images', oldImage);
                    if (fs.existsSync(oldImagePath)) {
                        fs.unlinkSync(oldImagePath);
                    }
                }

                res.status(200).json({
                    message: 'Profile image uploaded successfully',
                    profile_image: `/uploads/profile_images/${req.file.filename}`,
                    filename: req.file.filename
                });
            });
        });
    }
};

module.exports = ProfileController;
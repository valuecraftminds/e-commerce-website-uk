const express = require('express');
const CompanyController = require('../../controllers/admin/CompanyController');
const { authenticateToken } = require('../../middleware/admin/AdminAuth');
const { uploadLogo } = require('../../middleware/upload');

const router = express.Router();

// Get all companies
router.get('/companies', authenticateToken, async (req, res) => {
  try {
    const companies = await CompanyController.getAllCompanies();
    res.json({ success: true, companies });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get company by ID
router.get('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const company = await CompanyController.getCompanyById(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Get company by code
router.get('/companies-by-code/:code', async (req, res) => {
  try {
    const company = await CompanyController.getCompanyByCode(req.params.code);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, company });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Create company
router.post('/companies', authenticateToken, uploadLogo.single('company_logo'), async (req, res) => {
  try {
    const { company_name, company_address, currency, company_phone, company_email } = req.body;
    const logoFile = req.file;

    if (!company_name || !company_address || !currency || !company_phone || !company_email || !logoFile) {
      return res.status(400).json({ success: false, message: 'All company fields are required' });
    }

    // Generate next company code
    const newCompanyCode = await CompanyController.generateNextCompanyCode();
    const company_logo = logoFile.filename;

    // Create company
    const companyId = await CompanyController.createCompany({
      company_code: newCompanyCode,
      company_name,
      company_address,
      company_logo,
      currency,
      company_phone,
      company_email
    });

    res.status(201).json({ 
      success: true, 
      message: 'Company created successfully',
      company_code: newCompanyCode,
      company_id: companyId
    });

  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update company by ID
router.put('/companies/:id', authenticateToken, uploadLogo.single('company_logo'), async (req, res) => {
  try {
    const { id } = req.params;
    const { company_name, company_address, currency, company_phone, company_email } = req.body;
    const logoFile = req.file;

    if (!company_name || !company_address || !currency || !company_phone || !company_email) {
      return res.status(400).json({ success: false, message: 'Company name, address, currency, phone, and email are required' });
    }

    // Check if company exists
    const existingCompany = await CompanyController.getCompanyById(id);
    if (!existingCompany) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Prepare update data
    const updateData = {
      company_name,
      company_address,
      currency,
      company_phone,
      company_email
    };

    // Add logo filename if a new file was uploaded
    if (logoFile) {
      updateData.company_logo = logoFile.filename;
    }

    // Update company
    const updated = await CompanyController.updateCompany(id, updateData);

    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to update company' });
    }

    res.json({ 
      success: true, 
      message: 'Company updated successfully'
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Update company by code
router.put('/companies-by-code/:code', uploadLogo.single('company_logo'), async (req, res) => {
  try {
    const { code } = req.params;
    const { company_name, company_address, currency, company_phone, company_email } = req.body;
    const logoFile = req.file;

    if (!company_name || !company_address || !currency || !company_phone || !company_email) {
      return res.status(400).json({ success: false, message: 'Company name, address, currency, phone, and email are required' });
    }

    // Check if company exists by code
    const existingCompany = await CompanyController.getCompanyByCode(code);
    if (!existingCompany) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Prepare update data
    const updateData = {
      company_name,
      company_address,
      currency,
      company_phone,
      company_email
    };
    if (logoFile) {
      updateData.company_logo = logoFile.filename;
    }

    // Update company by code
    const updated = await CompanyController.updateCompanyByCode(code, updateData);

    if (!updated) {
      return res.status(500).json({ success: false, message: 'Failed to update company' });
    }

    res.json({ 
      success: true, 
      message: 'Company updated successfully'
    });

  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Delete company
router.delete('/companies/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if company exists
    const existingCompany = await CompanyController.getCompanyById(id);
    if (!existingCompany) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }

    // Delete company
    const deleted = await CompanyController.deleteCompany(id);

    if (!deleted) {
      return res.status(500).json({ success: false, message: 'Failed to delete company' });
    }

    res.json({ 
      success: true, 
      message: 'Company deleted successfully'
    });

  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;

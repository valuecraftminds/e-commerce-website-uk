const db = require('../../config/database');

class CompanyController {
  // Create a new company
  static createCompany(companyData) {
    return new Promise((resolve, reject) => {
      const { company_code, company_name, company_address, company_logo, currency } = companyData;
      
      db.query(
        'INSERT INTO companies (company_code, company_name, company_address, company_logo, currency) VALUES (?, ?, ?, ?, ?)',
        [company_code, company_name, company_address, company_logo, currency],
        (err, result) => {
          if (err) {
            console.error('Company creation error:', err);
            reject(err);
          } else {
            resolve(result.insertId);
          }
        }
      );
    });
  }

  // Get company by ID
  static getCompanyById(companyId) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM companies WHERE id = ?',
        [companyId],
        (err, rows) => {
          if (err) {
            console.error('Get company error:', err);
            reject(err);
          } else {
            resolve(rows[0] || null);
          }
        }
      );
    });
  }

  // Get company by company code
  static getCompanyByCode(companyCode) {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM companies WHERE company_code = ?',
        [companyCode],
        (err, rows) => {
          if (err) {
            console.error('Get company by code error:', err);
            reject(err);
          } else {
            resolve(rows[0] || null);
          }
        }
      );
    });
  }

  // Update company by company_code
  static updateCompanyByCode(companyCode, companyData) {
    return new Promise((resolve, reject) => {
      const { company_name, company_address, company_logo, currency } = companyData;
      
      let query = 'UPDATE companies SET company_name = ?, company_address = ?, currency = ?';
      let params = [company_name, company_address, currency];
      
      if (company_logo) {
        query += ', company_logo = ?';
        params.push(company_logo);
      }
      
      query += ' WHERE company_code = ?';
      params.push(companyCode);
      
      db.query(query, params, (err, result) => {
        if (err) {
          console.error('Company update error:', err);
          reject(err);
        } else {
          resolve(result.affectedRows > 0);
        }
      });
    });
  }

  // Update company by ID
  static updateCompany(companyId, companyData) {
    return new Promise((resolve, reject) => {
      const { company_name, company_address, company_logo, currency } = companyData;
      
      let query = 'UPDATE companies SET company_name = ?, company_address = ?, currency = ?';
      let params = [company_name, company_address, currency];
      
      if (company_logo) {
        query += ', company_logo = ?';
        params.push(company_logo);
      }
      
      query += ' WHERE id = ?';
      params.push(companyId);
      
      db.query(query, params, (err, result) => {
        if (err) {
          console.error('Company update error:', err);
          reject(err);
        } else {
          resolve(result.affectedRows > 0);
        }
      });
    });
  }

  // Get all companies
  static getAllCompanies() {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT * FROM companies ORDER BY company_name',
        (err, rows) => {
          if (err) {
            console.error('Get all companies error:', err);
            reject(err);
          } else {
            resolve(rows);
          }
        }
      );
    });
  }

  // Generate next company code
  static generateNextCompanyCode() {
    return new Promise((resolve, reject) => {
      db.query(
        'SELECT company_code FROM companies ORDER BY company_code DESC LIMIT 1',
        (err, rows) => {
          if (err) {
            console.error('Company code generation error:', err);
            reject(err);
          } else {
            let newCompanyCode = 'C001';
            if (rows.length > 0 && rows[0].company_code) {
              const lastNum = parseInt(rows[0].company_code.slice(1));
              const nextNum = lastNum + 1;
              newCompanyCode = 'C' + nextNum.toString().padStart(3, '0');
            }
            resolve(newCompanyCode);
          }
        }
      );
    });
  }

  // Delete company
  static deleteCompany(companyId) {
    return new Promise((resolve, reject) => {
      db.query(
        'DELETE FROM companies WHERE id = ?',
        [companyId],
        (err, result) => {
          if (err) {
            console.error('Delete company error:', err);
            reject(err);
          } else {
            resolve(result.affectedRows > 0);
          }
        }
      );
    });
  }
}

module.exports = CompanyController;

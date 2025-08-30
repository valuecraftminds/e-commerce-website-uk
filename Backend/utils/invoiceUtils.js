const db = require('../config/database');

// Generate a unique invoice number
// Format: INV-YYYYMMDD-HHMMSSMMM-OrderID
const generateUniqueInvoiceNumber = (orderId) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
  
  return `INV-${year}${month}${day}-${hours}${minutes}${seconds}${milliseconds}-${orderId}`;
};

// Check if an invoice already exists for an order
const getExistingInvoiceNumber = async (orderId, companyCode) => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT invoice_number FROM invoices 
      WHERE order_id = ? AND company_code = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    
    db.query(query, [orderId, companyCode], (err, results) => {
      if (err) {
        reject(err);
      } else {
        resolve(results.length > 0 ? results[0].invoice_number : null);
      }
    });
  });
};

//  Get or create invoice number for an order
//  Returns existing invoice number if found, otherwise generates a new one
const getOrCreateInvoiceNumber = async (orderId, companyCode) => {
  try {
    const existingInvoiceNumber = await getExistingInvoiceNumber(orderId, companyCode);
    
    if (existingInvoiceNumber) {
      console.log(`Using existing invoice number: ${existingInvoiceNumber} for order ${orderId}`);
      return existingInvoiceNumber;
    }
    
    const newInvoiceNumber = generateUniqueInvoiceNumber(orderId);
    console.log(`Generated new invoice number: ${newInvoiceNumber} for order ${orderId}`);
    return newInvoiceNumber;
    
  } catch (error) {
    console.error('Error getting/creating invoice number:', error);
    // Fallback to generating a new number if there's an error
    return generateUniqueInvoiceNumber(orderId);
  }
};

// Generate invoice filename with timestamp
const generateInvoiceFileName = (orderNumber, invoiceNumber) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `invoice-${orderNumber || invoiceNumber}-${year}${month}${day}-${hours}${minutes}${seconds}.pdf`;
};

module.exports = {
  generateUniqueInvoiceNumber,
  getExistingInvoiceNumber,
  getOrCreateInvoiceNumber,
  generateInvoiceFileName
};

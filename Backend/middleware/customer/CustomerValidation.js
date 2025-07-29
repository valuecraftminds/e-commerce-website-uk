// Check if company_code is provided
const checkCompanyCode = (req, res, next) => {
  const { company_code } = req.query;
  if (!company_code) {
    console.error('Company code is missing in the request');
    return res.status(400).json({ 
      success: false, 
      error: 'company_code is required' 
    });
  }
  console.log('Company code:', company_code);
  next();
};

// Validate registration data
const validateRegistration = (req, res, next) => {
  const { company_code, name, email, phone, password, country } = req.body;

  if (!company_code || !name || !email || !phone || !password || !country) {
    return res.status(400).json({ 
      success: false, 
      message: 'All fields are required' 
    });
  }

  // Name validation - no numbers or special chars
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Name can only contain letters and spaces' 
    });
  }

  // Phone validation
  if (!/^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ''))) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid phone number format. Please enter a valid international phone number' 
    });
  }

  // Password validation
  if (!isValidPassword(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be 8-12 characters with uppercase, lowercase, number, and special character'
    });
  }

  next();
};

const isValidPassword = (password) => {
  const lengthValid = password.length >= 8 && password.length <= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[\W_]/.test(password);

  return lengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

module.exports = { checkCompanyCode, validateRegistration };
const validateName = (name) => {
  return /^[a-zA-Z\s]+$/.test(name);
};

const validatePhone = (phone) => {
  return /^\+?\d{10,15}$/.test(phone.replace(/[\s-]/g, ''));
};

const validatePassword = (password) => {
  const lengthValid = password.length >= 8 && password.length <= 12;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[\W_]/.test(password);
  
  return lengthValid && hasUppercase && hasLowercase && hasNumber && hasSpecialChar;
};

const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  validateName,
  validatePhone,
  validatePassword,
  validateEmail
};

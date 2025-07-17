import React, { useState } from 'react';

export default function AdminRegistration() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    password: ''
  });

  const [phoneError, setPhoneError] = useState('');
  const [passwordRules, setPasswordRules] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    specialChar: false
  });
  const [showRules, setShowRules] = useState(false);

  // prevent entering numbers or symbols to name field
  const handleNameChange = (e) => {
  let value = e.target.value;

  value = value.replace(/[^a-zA-Z\s]/g, '');

  setFormData((prev) => ({
    ...prev,
    name: value,
  }));
} ;

  // prevent entering letters and symbols and limit to 10 digits starting with 07
  const handlePhoneChange = (e) => {
    let value = e.target.value;

    value = value.replace(/\D/g, '');

    if (value.length > 10) {
      value = value.slice(0, 10);
    }

    setFormData((prev) => ({ ...prev, phone: value }));

    if (value && !value.startsWith('07')) {
      setPhoneError('Phone number must start with 07');
    } else if (value.length > 0 && value.length < 10) {
      setPhoneError('Phone number must be exactly 10 digits');
    } else {
      setPhoneError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'password') {
      const rules = {
        length: value.length >= 8 && value.length <= 12,
        uppercase: /[A-Z]/.test(value),
        lowercase: /[a-z]/.test(value),
        number: /\d/.test(value),
        specialChar: /[\W_]/.test(value)
      };
      setPasswordRules(rules);
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Submitting user:', formData);

    try {
      const response = await fetch('http://localhost:3000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert('User registered successfully!');
        setFormData({
          name: '',
          email: '',
          phone: '',
          role: '',
          password: ''
        });
        
      } else {
        alert(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Error registering user:', error);
      alert('Something went wrong');
    }
  };

  return (
    <div className="container" >
      <div className="d-flex justify">
        <div className="w-50"  >
          <h2 className="text-center mb-4">Add Admins</h2>

          <form className='justify-content-center' onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label"> Name: </label>
              <input
                id="name"
                type="text"
                name="name"
                value={formData.name}
                onChange={handleNameChange}
                className="form-control"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email:</label>
              <input
                id="email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="form-control"
                required
              />
            </div>

            <div className="mb-3">
              <label htmlFor="phone" className="form-label">Phone:</label>
              <input
                id="phone"
                type="text"
                name="phone"
                value={formData.phone} 
                onChange={handlePhoneChange}
                className={`form-control ${phoneError ? 'is-invalid' : ''}`}
                inputMode='numeric'
                pattern="[0-9]*"
                maxLength="10"
                required
              />
              {phoneError && <div className="invalid-feedback">{phoneError}</div>}
            </div>

            <div className="mb-3">
              <label htmlFor="role" className="form-label">Role:</label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="form-select"
                required
              >
                <option value="">Select Role</option>
                <option value="admin">Admin</option>
                <option value="pdc">PDC</option>
                <option value="warehouse_grn">Warehouse GRN</option>
                <option value="warehouse_issuing">Warehouse Issuing</option>
                <option value="order">Ordering</option>
              </select>
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">Password:</label>
              <input
                id="password"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className='form-control'
                onFocus={() => setShowRules(true)}
                onBlur={() => setShowRules(false)}
                required
              />
              {showRules && (
              <div className='mb-2 mt-2'>
                <small> "Password must contain: </small>
                <ul className='list-unstyled ms-2'>
                  <li style={{ color: passwordRules.length ? 'green' : 'red' }}>
                    {passwordRules.length ? '✅' : '❌'} 8-12 characters
                  </li>
                  <li style={{ color: passwordRules.uppercase ? 'green' : 'red' }}>
                    {passwordRules.uppercase ? '✅' : '❌'} At least one uppercase letter 
                  </li>
                  <li style={{ color: passwordRules.lowercase ? 'green' : 'red' }}>
                    {passwordRules.lowercase ? '✅' : '❌'} At least one lowercase letter
                  </li>
                  <li style={{ color: passwordRules.number ? 'green' : 'red' }}>
                    {passwordRules.number ? '✅' : '❌'} At least one number  
                  </li>
                  <li style={{ color: passwordRules.specialChar ? 'green' : 'red' }}>
                    {passwordRules.specialChar ? '✅' : '❌'} At least one special character 
                  </li>
                </ul>
              </div>
              )}
            </div>

            <button type="submit" className="btn btn-primary mt-3">Register</button>
          </form>
        </div>
      </div>
    </div>
  );
}
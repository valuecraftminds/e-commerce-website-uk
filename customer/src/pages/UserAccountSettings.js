import React, { useState, useEffect } from 'react';
import { User, MapPin, CreditCard, Plus, Edit3, Trash2, Eye, EyeOff, Mail, Phone, Lock, Shield } from 'lucide-react';
import axios from 'axios';

import '../styles/AccountSettings.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function UserAccountSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: ''
  });

  const [addresses, setAddresses] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);

  const sidebarItems = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'addresses', label: 'Shipping Addresses', icon: MapPin },
    { id: 'payment', label: 'Payment Methods', icon: CreditCard },
  ];

  // Get auth token from logged in user
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    return token;
  };

  // Get axios config with auth token
  const getAxiosConfig = () => {
    const token = getAuthToken();
    const config = {
      params: { company_code: COMPANY_CODE },
      headers: {
        'Content-Type': 'application/json',
      }
    };
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // const token = localStorage.getItem('token');
        // const company_code = localStorage.getItem('company_code'); // or get from context, cookie, etc.

        // if (!token || !company_code) {
        //   console.error('Missing token or company code');
        //   return;
        // }

        const [response, addressResponse, paymentResponse] = await Promise.all([
          axios.get(`${BASE_URL}/api/customer/user/profile`, getAxiosConfig()),
          // axios.get(`/api/customer/addresses`, getAxiosConfig()),
          // axios.get(`/api/customer/payment-methods`, getAxiosConfig())
        ])

        setProfileData({
          firstName: response.data.first_name || '',
          lastName: response.data.last_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          password: response.data.password || '',
        });

        setAddresses(addressResponse.data || []);
        setPaymentMethods(paymentResponse.data || []);
      } catch (error) {
        console.error('Error fetching account data:', error);
      }
    };

    fetchData();
  }, []);
console.log(profileData.firstName);

  return (
    <>
      <div className="main-container">
        {/* Header */}
        <div className="header-section">
          <div className="profile-avatar-large">
            {/* <i class="bi bi-person-circle fs-1"></i> */}
            {profileData.firstName.charAt(0)}{profileData.lastName.charAt(0)}
          </div>
          <h2>{profileData.firstName} {profileData.lastName}</h2>
          <p className="mb-0 opacity-75">Manage your account settings and preferences</p>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs-custom">
          <ul className="nav nav-tabs border-0">
            {sidebarItems.map((item) => (
              <li className="nav-item" key={item.id}>
                <button
                  className={`nav-link d-flex align-items-center ${activeTab === item.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(item.id)}
                >
                  <item.icon size={18} className="me-2" />
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Content */}
        <div className="content-section">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h3 className="section-title">
                <User className="me-2" />
                Profile Information
              </h3>
              
              <div className="info-card">
                <h5 className="mb-4">Personal Details</h5>
                <div className="row">
                  <div className="col-md-6 form-group-custom">
                    <label className="form-label fw-bold">First Name</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      value={profileData.firstName}
                      onChange={(e) => setProfileData(prev => ({...prev, firstName: e.target.value}))}
                    />
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label className="form-label fw-bold">Last Name</label>
                    <input
                      type="text"
                      className="form-control form-control-custom"
                      value={profileData.lastName}
                      onChange={(e) => setProfileData(prev => ({...prev, lastName: e.target.value}))}
                    />
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label className="form-label fw-bold">
                      <Mail size={16} className="me-1" />
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-custom"
                      value={profileData.email}
                      onChange={(e) => setProfileData(prev => ({...prev, email: e.target.value}))}
                    />
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label className="form-label fw-bold">
                      <Phone size={16} className="me-1" />
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      className="form-control form-control-custom"
                      value={profileData.phone}
                      onChange={(e) => setProfileData(prev => ({...prev, phone: e.target.value}))}
                    />
                  </div>
                </div>
              </div>

              <div className="info-card">
                <h5 className="mb-4">
                  <Lock size={20} className="me-2" />
                  Security Settings
                </h5>
                <div className="row">
                  <div className="col-md-6 form-group-custom">
                    <label className="form-label fw-bold">Current Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control form-control-custom"
                        placeholder="Enter current password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                  <div className="col-md-6 form-group-custom">
                    <label className="form-label fw-bold">New Password</label>
                    <div className="password-input-wrapper">
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        className="form-control form-control-custom"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        className="password-toggle"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                      >
                        {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex gap-3">
                <button className="btn save-btn">
                  Save All Changes
                </button>
                <button className="btn btn-outline-secondary btn-custom">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Addresses Tab */}
          {activeTab === 'addresses' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="section-title mb-0">
                  <MapPin className="me-2" />
                  Shipping Addresses
                </h3>
                <button className="btn new-address-btn">
                  <Plus size={18} className="me-2" />
                  Add New Address
                </button>
              </div>

              {addresses.map((address) => (
                <div key={address.id} className={`address-card ${address.isDefault ? 'default' : ''}`}>
                  {address.isDefault && <div className="default-badge">DEFAULT</div>}
                  
                  <div className="row">
                    <div className="col-md-8">
                      <h5 className="mb-2">
                        <MapPin size={18} className="me-2 text-primary" />
                        {address.type} Address
                      </h5>
                      <h6 className="text-dark">{address.name}</h6>
                      <p className="mb-1 text-muted">{address.address}</p>
                      <p className="mb-1 text-muted">{address.city}, {address.state} {address.zipCode}</p>
                      <p className="mb-0 text-muted">{address.country}</p>
                    </div>
                    <div className="col-md-4 text-end">
                      <div className="d-flex flex-column gap-2">
                        <button className="btn btn-outline-primary btn-sm">
                          <Edit3 size={14} className="me-1" />
                          Edit
                        </button>
                        {!address.isDefault && (
                          <button className="btn btn-outline-success btn-sm">
                            Set as Default
                          </button>
                        )}
                        <button className="btn btn-outline-danger btn-sm">
                          <Trash2 size={14} className="me-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Payment Methods Tab */}
          {activeTab === 'payment' && (
            <div>
              <div className="d-flex justify-content-between align-items-center mb-4">
                <h3 className="section-title mb-0">
                  <CreditCard className="me-2" />
                  Payment Methods
                </h3>
                <button className="btn new-card-btn">
                  <Plus size={18} className="me-2" />
                  Add New Card
                </button>
              </div>

              {paymentMethods.map((payment) => (
                <div key={payment.id} className={`payment-card ${payment.isDefault ? 'default' : ''}`}>
                  {payment.isDefault && <div className="default-badge">DEFAULT</div>}
                  
                  <div className="row align-items-center">
                    <div className="col-md-8">
                      <div className="card-chip"></div>
                      <div className="card-number">
                        •••• •••• •••• {payment.last4}
                      </div>
                      <div className="d-flex justify-content-between">
                        <div>
                          <small className="opacity-75">CARD HOLDER</small>
                          <div className="fw-bold">{payment.cardHolder}</div>
                        </div>
                        <div className="text-end">
                          <small className="opacity-75">EXPIRES</small>
                          <div className="fw-bold">{payment.expiryDate}</div>
                        </div>
                      </div>
                      <div className="mt-2">
                        <span className="badge bg-light text-dark">{payment.type}</span>
                      </div>
                    </div>
                    <div className="col-md-4 text-end">
                      <div className="d-flex flex-column gap-2">
                        <button className="btn btn-light btn-sm">
                          <Edit3 size={14} className="me-1" />
                          Edit
                        </button>
                        {!payment.isDefault && (
                          <button className="btn btn-outline-light btn-sm">
                            Set as Default
                          </button>
                        )}
                        <button className="btn btn-outline-light btn-sm">
                          <Trash2 size={14} className="me-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              <div className="info-card mt-4">
                <div className="d-flex align-items-center">
                  <Shield size={24} className="text-success me-3" />
                  <div>
                    <h6 className="mb-1">Your payments are secure</h6>
                    <small className="text-muted">
                      We use industry-standard encryption to protect your payment information. 
                      Your full card number is never stored on our servers.
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, CreditCard, Plus, Edit3, Trash2, Eye, EyeOff, Mail, Phone, Lock, Shield, Camera, Upload, X } from 'lucide-react';
import axios from 'axios';

import '../styles/AccountSettings.css';
import ProfilePictureModal from '../components/ProfileImageModal';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function UserAccountSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);
  
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    profilePicture: '' // profile picture URL
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

  // Helper function to get full profile image URL
  const getProfileImageUrl = (imagePath) => {
    if (!imagePath) return null;
    
    // construct full URL
    return `${BASE_URL}/uploads/profile_images/${imagePath}`;
  };

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, JPG or PNG)');
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviewUrl(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload profile picture
  const handleUploadProfilePicture = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('profile_image', selectedFile);

    try {
      const token = getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/api/customer/user/upload-profile-image`,
        formData,
        {
          params: { company_code: COMPANY_CODE },
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: token ? `Bearer ${token}` : undefined,
          }
        }
      );
    
      // Update profile data with new profile picture URL
      setProfileData(prev => ({
        ...prev,
        profilePicture: response.data.profile_image 
      }));
    
      // Reset states
      setSelectedFile(null);
      setPreviewUrl(null);
      setShowProfilePictureModal(false);
      
      alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      alert('Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // Delete profile picture
  const handleDeleteProfilePicture = async () => {
    if (!profileData.profilePicture) return;

    if (!window.confirm('Are you sure you want to delete your profile picture?')) {
      return;
    }

    try {
      const config = getAxiosConfig();
      await axios.delete(`${BASE_URL}/api/customer/user/delete-profile-image`, config);

      // Update profile data to remove profile picture
      setProfileData(prev => ({
        ...prev,
        profilePicture: ''
      }));

      setShowProfilePictureModal(false);
      alert('Profile picture deleted successfully!');
    } catch (error) {
      console.error('Error deleting profile picture:', error);
      alert('Failed to delete profile picture. Please try again.');
    }
  };

  // Reset file selection
  const resetFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpdateProfileDetails = async () => {
    const { firstName, lastName, email, phone, password } = profileData;
    if (!firstName || !lastName || !email || !phone) {
      alert('Please fill in all required fields');
      return;
    }
    try {
      const config = getAxiosConfig();
      const response = await axios.put(
        `${BASE_URL}/api/customer/user/update-profile`,
        {
          first_name: firstName,
          last_name: lastName,
          email,
          phone: phone,
          password,
          profile_image: profileData.profilePicture
        },
        config
      );
      alert('Profile updated successfully!');
      // Refresh the profile data after update
      setProfileData(prev => ({
        ...prev,
        firstName,
        lastName,
        email,
        phone,
        password,
        profilePicture: response.data.profile_image || prev.profilePicture
      }));
    } catch (error) {
      console.error('Error updating profile details:', error);
      alert('Failed to update profile details. Please try again.');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
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
          profilePicture: response.data.profile_image || '',
        });

        setAddresses(addressResponse?.data || []);
        setPaymentMethods(paymentResponse?.data || []);
      } catch (error) {
        console.error('Error fetching account data:', error);
      }
    };

    fetchData();
  }, []);

  const getInitials = () => {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`;
  };

  // Get the display URL for profile picture
  const profileImageUrl = getProfileImageUrl(profileData.profilePicture);

  return (
    <>
      <div className="main-container">
        {/* Header- Dsiplay pro pic center*/}
        {/* <div className="header-section">
          <div 
            className="profile-avatar-large clickable"
            onClick={() => setShowProfilePictureModal(true)}
            style={{ 
              cursor: 'pointer', 
              position: 'relative',
              backgroundImage: profileImageUrl ? `url(${profileImageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              color: profileImageUrl ? 'transparent' : 'inherit'
            }}
          >
            {!profileImageUrl && getInitials()}
            <div className="profile-picture-overlay">
              <Camera size={24} />
            </div>
          </div>
          <h2>{profileData.firstName} {profileData.lastName}</h2>
          <p className="mb-0 opacity-75">Manage your account settings and preferences</p>
        </div> */}

      {/* Header - Display profile picture left aligned */}
        <div className="header-section">
          <div
            className="profile-avatar-large clickable"
            onClick={() => setShowProfilePictureModal(true)}
            style={{
              backgroundImage: profileImageUrl ? `url(${profileImageUrl})` : 'none',
              backgroundColor: profileImageUrl ? 'transparent' : 'hsl(266, 70%, 26%, 0.5)',  // add this line
              color: profileImageUrl ? 'transparent' : 'white',
            }}
          >
            {!profileImageUrl && getInitials()}
            <div className="profile-picture-overlay">
              <Camera size={20} />
            </div>
          </div>

          <div>
            <h2>{profileData.firstName} {profileData.lastName}</h2>
            <p>Manage your account settings and preferences</p>
          </div>
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
                <button 
                  className="btn save-btn"
                  onClick={() => handleUpdateProfileDetails()}  
                >
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

      {/* Profile Picture Modal */}
      <ProfilePictureModal
        show={showProfilePictureModal}
        onClose={() => setShowProfilePictureModal(false)}
        profileImageUrl={profileImageUrl}
        getInitials={getInitials}
        fileInputRef={fileInputRef}
        handleFileSelect={handleFileSelect}
        selectedFile={selectedFile}
        previewUrl={previewUrl}
        resetFileSelection={resetFileSelection}
        handleUploadProfilePicture={handleUploadProfilePicture}
        handleDeleteProfilePicture={handleDeleteProfilePicture}
        isUploading={isUploading}
      />
    </>
  );
}
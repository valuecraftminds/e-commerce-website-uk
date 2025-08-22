import React, { useState, useEffect, useRef } from 'react';
import { User, MapPin, Plus, Eye, EyeOff, Mail, Phone, Lock, Camera } from 'lucide-react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';


import '../styles/AccountSettings.css';
import ProfilePictureModal from '../components/ProfileImageModal';
import AddNewAddress from '../components/AddNewAddress';
import EditAddress from '../components/EditAddress';
import { useNotifyModal } from "../context/NotifyModalProvider";
import { Button } from 'react-bootstrap';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

export default function AccountSettings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressError, setAddressError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [showAddNewAddress, setShowAddNewAddress] = useState(false);
  const [showEditAddress, setShowEditAddress] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState(null);

  const { showNotify } = useNotifyModal();
  
  const fileInputRef = useRef(null);
  const passwordInputRef = useRef(null);

    const navigate = useNavigate();

  const passwordRules = {
  length: newPassword.length >= 8 && newPassword.length <= 12,
  uppercase: /[A-Z]/.test(newPassword),
  lowercase: /[a-z]/.test(newPassword),
  number: /\d/.test(newPassword),
  specialChar: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
};

// close rules box when clicking outside
useEffect(() => {
  function handleClickOutside(event) {
    if (passwordInputRef.current && !passwordInputRef.current.contains(event.target)) {
      setShowRules(false);
    }
  }

  document.addEventListener('mousedown', handleClickOutside);
  return () => {
    document.removeEventListener('mousedown', handleClickOutside);
  };
}, []);

  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    profilePicture: ''
  });



  const sidebarItems = [
    { id: 'profile', label: 'Profile Information', icon: User },
    { id: 'addresses', label: 'Shipping Addresses', icon: MapPin },
    // { id: 'payment', label: 'Payment Methods', icon: CreditCard },
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

  // Fetch payment methods separately
  // const fetchPaymentMethods = async () => {
  //   setPaymentsLoading(true);
  //   setPaymentsError(null);
  //   try {
  //     const config = getAxiosConfig();
  //     const response = await axios.get(`${BASE_URL}/api/customer/payment-methods/get-payment-methods`, config);
      
  //     // Transform the data to match UI 
  //     const formattedPayments = response.data.map(payment => ({
  //       id: payment.id,
  //       last4: payment.card_number ? payment.card_number.slice(-4) : '0000',
  //       cardHolder: `${payment.cardholder_name || 'N/A'}`,
  //       expiryDate: payment.expiry_month && payment.expiry_year 
  //         ? `${payment.expiry_month.toString().padStart(2, '0')}/${payment.expiry_year.toString().slice(-2)}`
  //         : 'N/A',
  //       type: payment.card_type || 'Unknown',
  //       isDefault: payment.is_default === 1 || payment.is_default === true,
  //       brand: payment.card_brand || 'VISA'
  //     }));
      
  //     setPaymentMethods(formattedPayments);
  //   } catch (error) {
  //     console.error('Error fetching payment methods:', error);
  //     setPaymentsError('Failed to load payment methods');
  //     setPaymentMethods([]); // Set empty array on error
  //   } finally {
  //     setPaymentsLoading(false);
  //   }
  // };

  const fetchAddresses = async () => {
  setAddressesLoading(true);
  setAddressError(null);
  console.log('Fetching addresses...');
  try {
    const config = getAxiosConfig();
    const response = await axios.get(`${BASE_URL}/api/customer/address/get-address`, config);

    console.log('Fetched addresses:', response.data);
    const formattedAddresses = response.data.map((addr, idx) => {
      console.log('Formatting address:', addr);
      const reactKeyBase =
        addr.id ??
        `${addr.address_line_1 || ''}-${addr.city || ''}-${addr.postal_code || ''}-${idx}`;
      return {
        id: addr.address_id, // keep the server id for setDefault/delete calls
        reactKey: `addr-${reactKeyBase}`,         // <-- stable UI key
        name: `${addr.first_name || ''} ${addr.last_name || ''}`.trim(),
        type: addr.address_type || 'Shipping',
        house: addr.house || '',
        address: `${addr.address_line_1 || ''} ${addr.address_line_2 || ''}`.trim(),
        city: addr.city || '',
        state: addr.state || '',
        postalCode: addr.postal_code || '',
        country: addr.country || '',
        isDefault: addr.is_default === 1 || addr.is_default === true,
        phone: addr.phone || ''
      };
    });

    setAddresses(formattedAddresses);
  } catch (error) {
    console.error('Error fetching addresses:', error);
    setAddressError('Failed to load addresses');
    setAddresses([]);
  } finally {
    setAddressesLoading(false);
  }
};


  const [loadingDefault, setLoadingDefault] = React.useState(null); // track which address is updating

// Set default address function
  const setDefaultAddress = async (addressId) => {
    if (!addressId) return;

    setLoadingDefault(addressId); // disable btn for this address

    try {
      const config = getAxiosConfig();
      const response = await axios.post(
        `${BASE_URL}/api/customer/address/set-default-address`,
        {
          address_id: addressId,
          company_code: COMPANY_CODE,
        },
        config
      );

      if (response.status === 200) {
        // Mark selected address isDefault true, rest false
        setAddresses((prev) =>
          prev.map((addr) => ({
            ...addr,
            isDefault: addr.id === addressId,
          }))
        );
        
        showNotify({
          title: "Done",
          message: "Default address set successfully!",
          type: "success",
            customButtons: [
                {
                label: "OK",
                onClick: () => {}
                }
            ]
        })

      }
    } catch (error) {
      console.error('Error setting default address:', error.response?.data?.message);
      showNotify({
        title: "Error",
        message: 'Failed to set default address. Please try again later.',
        type: "error",
        customButtons: [
          {
            label: "OK",
            onClick: () => {}
          }
        ]
      })
    } finally {
      setLoadingDefault(null);
    }
  };

  //delete address
  const deleteAddress = async (addressId) => {  
    if (!addressId) return;

    showNotify({
        title: "Deleting Address",
        message: "Are you sure you want to delete this address?",
        type: "warning",
      customButtons: [
        {
            label: "Yes, Delete",
          onClick: async() => {
            try {
              const config = getAxiosConfig();
              const response = await axios.delete(
                  `${BASE_URL}/api/customer/address/delete-address`,
                  {
                    data: { address_id: addressId },
                    ...config
                  }
              );
              if (response.status === 200) {
                // Remove deleted address from state
                setAddresses((prev) => prev.filter((addr) => addr.id !== addressId));
                showNotify({
                  title: "Done",
                  message: "Address deleted successfully!",
                  type: "success",
                  customButtons: [
                    {
                      label: "OK",
                      onClick: () => {}
                    }
                  ]
                });
              }
            } catch (error) {
              console.error('Error deleting address:', error.response?.data?.message );
              showNotify({
                title: "Error",
                message: 'Failed to delete address. Please try again later.',
                type: "error",
                customButtons: [
                  {
                    label: "OK",
                    onClick: () => {}
                  }
                ]
              })
            }
          }
        },
        {
          label: "No, Cancel",
          onClick: () => {}
        }
        ]
    });
  };

  // Get full profile image URL
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
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showNotify({
            title: "Invalid File Type",
            message: "Please select a valid image file (JPG, JPEG, PNG, WEBP).",
            type: "error",
            customButtons: [
                {
                    label: "OK",
                    onClick: () => {}
                }
            ]
        })
        return;
      }

      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        showNotify({
            title: "File Size Exceeded",
            message: "The selected file exceeds the maximum size of 5MB. Please choose a smaller file.",
            type: "error",
            customButtons: [
                {
                    label: "OK",
                    onClick: () => {}
                }
            ]
        })
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
      
      // alert('Profile picture updated successfully!');
    } catch (error) {
      console.error('Error uploading profile picture:', error);
      showNotify({
        title: "Upload Failed",
        message: 'Failed to upload profile picture. Please try again.',
        type: "error",
        customButtons: [
          {
            label: "OK",
            onClick: () => {}
          }
        ]
      })
    } finally {
      setIsUploading(false);
    }
  };

  // Delete profile picture
  const handleDeleteProfilePicture = async () => {
    if (!profileData.profilePicture) return;

    showNotify({
      title: "Removing Profile Picture",
      message: "Are you sure you want to remove existing profile picture?",
      type: "warning",
      customButtons: [
        {
          label: "Yes, Remove",
          onClick: async () => {
            try {
              const config = getAxiosConfig();
              await axios.delete(`${BASE_URL}/api/customer/user/delete-profile-image`, config);

              // Update profile data to remove profile picture
              setProfileData(prev => ({
                ...prev,
                profilePicture: ''
              }));

              setShowProfilePictureModal(false);
              showNotify({
                title: "Done",
                message: "Your profile picture has been removed successfully.",
                type: "success",
                customButtons: [
                  {
                    label: "OK",
                    onClick: () => {}
                  }
                ]
              })
            } catch (error) {
              console.error('Error deleting profile picture:', error);
                showNotify({
                  title: "Can not delete profile picture.",
                  message: 'Failed to delete profile picture. Please try again.',
                  type: "error",
                  customButtons: [
                    {
                      label: "OK",
                      onClick: () => {}
                    }
                  ]
                })
            }
          }
        },
        {
          label: "No, Cancel",
          onClick: () => {}
        }
      ]
    });
  };

  // Reset file selection
  const resetFileSelection = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteAccount = async () => {
    showNotify({
      title: "Deleting Account",
      message: "Are you sure you want to delete your account?",
      type: "warning",
      customButtons: [
        {
          label: "Yes, Delete",
          onClick: async () => {
            try {
              const config = getAxiosConfig();
              await axios.delete(`${BASE_URL}/api/customer/user/delete-account`, config);

              showNotify({
                title: "Done",
                message: "Your account has been deleted successfully.",
                type: "success",
                customButtons: [
                  {
                    label: "OK",
                    onClick: () => {}
                  }
                ]
              });
            } catch (error) {
              console.error('Error deleting account:', error);
              showNotify({
                title: "Delete Failed",
                message: 'Failed to delete account. Please try again.',
                type: "error",
                customButtons: [
                  {
                    label: "OK",
                    onClick: () => {
                      // Navigate to home
                      navigate('/');
                    }
                  }
                ]
              });
            }
          }
        },
        {
          label: "No, Cancel",
          onClick: () => {}
        }
      ]
    });
  };

  const handleUpdateProfileDetails = async () => {
    const { firstName, lastName, email, phone, password } = profileData;
    if (!firstName || !lastName || !email || !phone) {
      showNotify({
        title: "Missing Information",
        message: "Please fill in all fields.",
        type: "error",
        customButtons: [
          {
            label: "OK",
            onClick: () => {}
          }
        ]
      })
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
      showNotify({
        title: "Done",
        message: "Update successfully"
        , type: "success",
        customButtons: [
          {
            label: "OK",
            onClick: () => {}
          }
        ]
      })
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
      showNotify({
        title: "Update Failed",
        message: 'Failed to update profile details. Please try again.',
        type: "error",
        customButtons: [
          {
            label: "OK",
            onClick: () => {}
          }
        ]
      })
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/customer/user/profile`, getAxiosConfig());

        setProfileData({
          firstName: response.data.first_name || '',
          lastName: response.data.last_name || '',
          email: response.data.email || '',
          phone: response.data.phone || '',
          password: response.data.password || '',
          profilePicture: response.data.profile_image || '',
        });

      } catch (error) {
        console.error('Error fetching account data:', error);
      }
    };

    fetchData();
  }, []);

  // Fetch addresses when addresses tab is active
  useEffect(() => {
    if (activeTab === 'addresses' && addresses.length === 0) {
      fetchAddresses();
    }
  }, [activeTab]);

  // Fetch payment methods when payment tab is active
  // useEffect(() => {
  //   if (activeTab === 'payment' && paymentMethods.length === 0) {
  //     fetchPaymentMethods();
  //   }
  // }, [activeTab]);

  const getInitials = () => {
    return `${profileData.firstName.charAt(0)}${profileData.lastName.charAt(0)}`;
  };

  // Get the display URL for profile picture
  const profileImageUrl = getProfileImageUrl(profileData.profilePicture);

  return (
    <>
      <div className="main-container">
        {/* Header */}
        <div className="header-section">
          <div
            className="profile-avatar-large clickable"
            onClick={() => setShowProfilePictureModal(true)}
            style={{
              backgroundImage: profileImageUrl ? `url(${profileImageUrl})` : 'none',
              backgroundColor: profileImageUrl ? 'transparent' : 'hsl(266, 70%, 26%, 0.5)',
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
                  <div className="col-md-6 form-group-custom" style={{ position: 'relative' }}>
                  <label className="form-label fw-bold">New Password</label>
                  <div className="password-input-wrapper">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      className="form-control form-control-custom"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={e => {
                        setNewPassword(e.target.value);
                        setShowRules(true);
                      }}
                      onFocus={() => setShowRules(true)}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>

                  {showRules && (
                    <div className="password-rules" ref={passwordInputRef} style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      background: '#fff',
                      border: '1px solid #ddd',
                      padding: '10px',
                      marginTop: '5px',
                      borderRadius: '4px',
                      zIndex: 10,
                      width: '280px',
                      color: '#000',
                    }}>
                      <small>Password requirements:</small>
                      <ul className="list-unstyled ms-2 mb-0" style={{fontSize: '0.85rem'}}>
                        <li key="length" style={{ color: passwordRules.length ? '#28a745' : '#dc3545' }}>
                          {passwordRules.length ? '✅' : '❌'} 8-12 characters
                        </li>
                        <li key="uppercase" style={{ color: passwordRules.uppercase ? '#28a745' : '#dc3545' }}>
                          {passwordRules.uppercase ? '✅' : '❌'} Uppercase letter
                        </li>
                        <li key="lowercase" style={{ color: passwordRules.lowercase ? '#28a745' : '#dc3545' }}>
                          {passwordRules.lowercase ? '✅' : '❌'} Lowercase letter
                        </li>
                        <li key="number" style={{ color: passwordRules.number ? '#28a745' : '#dc3545' }}>
                          {passwordRules.number ? '✅' : '❌'} Number
                        </li>
                        <li key="specialChar" style={{ color: passwordRules.specialChar ? '#28a745' : '#dc3545' }}>
                          {passwordRules.specialChar ? '✅' : '❌'} Special character
                        </li>
                      </ul>
                    </div>
                  )}
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
              <div className="p-3 mt-4 border border-danger rounded bg-light">
                <h5 className="text-danger">Delete Account</h5>
                <p className="mb-3">
                  Deleting your account is permanent and cannot be undone. 
                  Please proceed with caution.
                </p>
                <Button onClick={handleDeleteAccount} variant="danger">
                  Delete Account
                </Button>
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
                <button 
                  className="btn new-address-btn"
                  onClick={() => setShowAddNewAddress(true)}
                >
                  <Plus size={18} className="me-2" />
                  Add New Address
                </button>
              </div>

              {/* Loading State */}
              {addressesLoading && (
                <div className="info-card text-center">
                  <p>Loading addresses...</p>
                </div>
              )}

              {/* Error State */}
              {addressError && (
                <div className="info-card text-center">
                  <p className="text-danger">{addressError}</p>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={fetchAddresses}
                  >
                    Try Again
                  </button>
                </div>
              )}

              {/* No Addresses */}
              {!addressesLoading && !addressError && addresses.length === 0 && (
                <div className="info-card text-center">
                  <MapPin size={48} className="text-muted mb-3" />
                  <h5>No addresses found</h5>
                  <p className="text-muted">Add your first shipping address to get started.</p>
                  <button className="btn new-address-btn">
                    <Plus size={18} className="me-2" />
                    Add Your First Address
                  </button>
                </div>
              )}

              {/* Address List */}
              <div className="row">
                {!addressesLoading && !addressError && addresses.length > 0 && 
                  addresses.map((address, index) => (
                    <div key={address.id || index} className="col-md-6 mb-4">
                      <div className={`address-card ${address.isDefault ? 'default' : ''}`}>
                        {address.isDefault && <div className="default-badge">DEFAULT</div>}
                        
                        <div className="row">
                          <div className="col-8 details-column">
                            <h5 className="mb-2">
                              <MapPin size={18} className="me-2 text-primary" />
                              {address.type} Address
                            </h5>
                            <h6 className="text-dark address-name">{address.name}</h6>
                            <p className="mb-1 address-house">{address.house}</p>
                            <p className="mb-1 address-lines">{address.address}</p>
                            <p className="mb-1 address-lines">{address.city}</p>
                            <p className="mb-1 address-lines">{address.state}, {address.postalCode}</p>
                            <p className="mb-0 address-lines">{address.country}</p>
                            {address.phone && (
                              <p className="mb-0 address-phone">
                                <Phone size={14} className="me-1" />
                                {address.phone}
                              </p>
                            )}
                          </div>
                          <div className="col-4 text-end">
                            <div className="d-flex flex-column gap-1">

                              {/* edit */}
                              <button 
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => {
                                  console.log('Editing address:', address);
                                  setSelectedAddress(address);
                                  setShowEditAddress(true);
                                }}
                              >
                                Edit 
                              </button>

                              {/* set default */}
                              {!address.isDefault && (
                                <button
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => setDefaultAddress(address.id)}
                                  disabled={loadingDefault === address.id}
                                >
                                  {loadingDefault === address.id ? 'Setting...' : 'Set as Default'}
                                </button>
                              )}

                              {/* delete */}
                              <button 
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => deleteAddress(address.id)}
                                // disabled={loadingDelete === address.id}
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {/* Payment Methods Tab */}
           {/* {activeTab === 'payment' && (
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
              </div> */}

              {/* Loading State */}
              {/* {paymentsLoading && (
                <div className="info-card text-center">
                  <p>Loading payment methods...</p>
                </div>
              )} */}

              {/* Error State */}
              {/* {paymentsError && (
                <div className="info-card text-center">
                  <p className="text-danger">{paymentsError}</p>
                  <button 
                    className="btn btn-outline-primary btn-sm"
                    onClick={fetchPaymentMethods}
                  >
                    Try Again
                  </button>
                </div>
              )} */}

              {/* No Payment Methods */}
              {/* {!paymentsLoading && !paymentsError && paymentMethods.length === 0 && (
                <div className="info-card text-center">
                  <CreditCard size={48} className="text-muted mb-3" />
                  <h5>No payment methods found</h5>
                  <p className="text-muted">Add your first payment method to make purchases easier.</p>
                  <button className="btn new-card-btn">
                    <Plus size={18} className="me-2" />
                    Add Your First Card
                  </button>
                </div>
              )} */}

              {/* Payment Methods List */}
              {/* {!paymentsLoading && !paymentsError && paymentMethods.length > 0 && paymentMethods.map((payment,index) => (
                <div key={payment.id || index} className={`payment-card ${payment.isDefault ? 'default' : ''}`}>
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
                        <span className="badge bg-primary text-white ms-2">{payment.brand}</span>
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
              ))} */}

              {/* <div className="info-card mt-4">
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
          )} */}
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

      {/* Add New Address Modal */}
      <AddNewAddress 
        show={showAddNewAddress}
        onHide={() => setShowAddNewAddress(false)}
        onSubmit={(result) => {
          // Handle the new address creation
          console.log('New address created:', result);
          
          // Add the new address
          const newFormattedAddress = {
            id: result.addressId,
            reactKey: `addr-${result.addressId}`,
            name: `${result.addressData.first_name} ${result.addressData.last_name}`,
            type: 'Shipping',
            house: result.addressData.house || '',
            address: `${result.addressData.address_line_1} ${result.addressData.address_line_2 || ''}`.trim(),
            city: result.addressData.city,
            state: result.addressData.state,
            postalCode: result.addressData.postal_code,
            country: result.addressData.country,
            isDefault: false,
            phone: result.addressData.phone
          };
          
          setAddresses(prev => [...prev, newFormattedAddress]);
          
          // Close the modal
          setShowAddNewAddress(false);

            // alert('Address added successfully!');
        }}
      />

      {/* Edit Address Modal */}
      <EditAddress
        show={showEditAddress}
        address={selectedAddress}
        onHide={() => {
          setShowEditAddress(false);
          setSelectedAddress(null);
        }}
        onSubmit={(result) => {
          // Handle the address editing
          console.log('Address edited:', result);

          // Update the address
          const updatedAddress = {
            id: result.addressId,
            reactKey: `addr-${result.addressId}`,
            name: `${result.addressData.first_name} ${result.addressData.last_name}`,
            type: 'Shipping',
            house: result.addressData.house || '',
            address: `${result.addressData.address_line_1} ${result.addressData.address_line_2 || ''}`.trim(),
            city: result.addressData.city,
            state: result.addressData.state,
            postalCode: result.addressData.postal_code,
            country: result.addressData.country,
          };

          setAddresses(prev => prev.map(addr => addr.id === updatedAddress.id ? updatedAddress : addr));

          // Close the modal
          setShowEditAddress(false);
          setSelectedAddress(null);

          // alert('Address updated successfully!');
        }}
      />
    </>
  );
}
import React, { useState, useEffect, useMemo, useContext } from 'react';
import { Modal, Form, Row, Col, Button, Container, Spinner, Card } from 'react-bootstrap';
import axios from 'axios';

import { useCart } from '../context/CartContext';
import { CountryContext } from "../context/CountryContext";
import '../styles/CheckoutModal.css';

const BASE_URL = process.env.REACT_APP_API_URL;
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const getAuthToken = () => localStorage.getItem('authToken') || '';

const createAxios = () => {
  const instance = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
    params: { company_code: COMPANY_CODE }
  });
  instance.interceptors.request.use((config) => {
    const token = getAuthToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
  return instance;
};

// prevent adding symbols or letters
const onlyDigits = (s) => (s || '').replace(/\D+/g, '');

// no symbols or digits in name
const isValidName = (name) => /^[a-zA-Z\s]+$/.test(name.trim());

// const luhnValid = (num) => {
//   const s = onlyDigits(num);
//   if (!s) return false;
//   let sum = 0, dbl = false;
//   for (let i = s.length - 1; i >= 0; i--) {
//     let d = parseInt(s[i], 10);
//     if (dbl) { d *= 2; if (d > 9) d -= 9; }
//     sum += d; dbl = !dbl;
//   }
//   return sum % 10 === 0;
// };

const parseExpiry = (val) => {
  const cleaned = onlyDigits(val);
  if (cleaned.length < 3) return null;
  const mm = parseInt(cleaned.slice(0, 2), 10);
  const yy = parseInt(cleaned.slice(2, 4), 10);
  if (Number.isNaN(mm) || Number.isNaN(yy) || mm < 1 || mm > 12) return null;
  return { month: mm, year: 2000 + yy };
};
const isExpiryInFuture = ({ month, year }) => {
  const now = new Date();
  const thisMonth = now.getMonth() + 1;
  const thisYear = now.getFullYear();
  return year > thisYear || (year === thisYear && month >= thisMonth);
};

const CheckoutModal = ({ show, value: product, onHide, onSubmit, isDirectBuy, selectedItems = [], selectedItemsSummary = null }) => {
  const api = useMemo(() => createAxios(), []);
  const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
  const { country } = useContext(CountryContext);
  const [step, setStep] = useState('address');
  const [exchangeRates, setExchangeRates] = useState({});

  const [shippingData, setShippingData] = useState({
    first_name: '', last_name: '', house: '',
    address_line_1: '', address_line_2: '',
    city: '', state: '', country: '', postal_code: '',
    phone: '',

    // payment_method: '',
    card_number: '', card_expiry_date: '', card_cvv: '',
  });

  const [setShippingAsDefault, setSetShippingAsDefault] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // saved addresses state
  const [addresses, setAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState('');
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  // 'select' (use saved) or 'new' (add new)
  const [mode, setMode] = useState('new');

  const fetchAddresses = async () => {
    setAddressesLoading(true);
    setAddressesError('');
    try {
      const { data } = await api.get(`${BASE_URL}/api/customer/address/get-address`);
      const sorted = [...data].sort((a, b) => {
        const aDef = a.is_default === 1 || a.is_default === true;
        const bDef = b.is_default === 1 || b.is_default === true;
        if (aDef === bDef) return 0;
        return aDef ? -1 : 1;
      });
      setAddresses(sorted);

      if (sorted.length > 0) {
        setMode('select');
        const def = sorted.find(a => a.is_default === 1 || a.is_default === true) || sorted[0];
        const id = def.address_id ?? def.id;
        setSelectedAddressId(id);
        prefillFromAddress(def);
      } else {
        setMode('new');
        setSelectedAddressId(null);
      }
    } catch (e) {
      console.error('Error fetching addresses:', e);
      setAddressesError('Failed to load saved addresses.');
      setAddresses([]);
      setMode('new');
    } finally {
      setAddressesLoading(false);
    }
  };

  const prefillFromAddress = (addr) => {
    if (!addr) return;
    setShippingData((prev) => ({
      ...prev,
      first_name: addr.first_name || '',
      last_name: addr.last_name || '',
      house: addr.house || '',
      address_line_1: addr.address_line_1 || '',
      address_line_2: addr.address_line_2 || '',
      city: addr.city || '',
      state: addr.state || '',
      country: addr.country || '',
      postal_code: addr.postal_code || '',
      phone: addr.phone || '',
    }));
  };

  // Fetch exchange rates
  useEffect(() => {
    const fetchExchangeRates = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/api/customer/currency/rates`);
        if (response.data.success) {
          setExchangeRates(response.data.rates);
        }
      } catch (error) {
        console.error('Failed to fetch exchange rates:', error);
        // Set default rates if API fails
        setExchangeRates({
          GBP: 0.75,
          LKR: 320
        });
      }
    };
    fetchExchangeRates();
  }, []);

  const getRate = () => {
    switch (country) {
      case 'US':
        return 1;
      case 'UK':
        return exchangeRates['GBP'] || 0.75;
      case 'SL':
        return exchangeRates['LKR'] || 320;
      default:
        return 1;
    }
  };

  const formatPrice = (amount) => {
    if (!amount) return "Price not defined";
    const symbol = currencySymbols[country] || '$';
    const rate = getRate();
    const convertedPrice = (amount * rate).toFixed(2);
    return `${symbol}${convertedPrice}`;
  };

  // reset on open + fetch addresses
  useEffect(() => {
    if (!show) return;
    setShippingData({
      first_name: '', last_name: '', house: '',
      address_line_1: '', address_line_2: '',
      city: '', state: '', country: '', postal_code: '',
      phone: '',
      payment_method: '',
      card_number: '', card_expiry_date: '', card_cvv: '',
    });
    setSetShippingAsDefault(false);
    setFieldErrors({});
    setError('');
    setSelectedAddressId(null);
    setMode('new');
    setStep('address');
    fetchAddresses();
  }, [show]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'card_number') {
      const digits = onlyDigits(value).slice(0, 16);
      setShippingData((p) => ({ ...p, [name]: digits }));
      return;
    }
    if (name === 'card_cvv') {
      const digits = onlyDigits(value).slice(0, 4);
      setShippingData((p) => ({ ...p, [name]: digits }));
      return;
    }
    if (name === 'phone') {
      const digits = onlyDigits(value).slice(0, 20);
      setShippingData((p) => ({ ...p, [name]: digits }));
      return;
    }

    // Validate name fields
    if (name === 'first_name' || name === 'last_name' || name === 'state' || name === 'country') {
      const characters = isValidName(value) ? value : '';
      setShippingData((prev) => ({ ...prev, [name]: characters }));
      return;
    }

    setShippingData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectSavedAddress = (e) => {
    const id = e.target.value;
    setSelectedAddressId(id);
    const chosen = addresses.find(a => String(a.address_id ?? a.id) === String(id));
    prefillFromAddress(chosen);
  };

  /** Step-specific validation */
  const validateAddress = () => {
    const fe = {};
    ['first_name','last_name','house','address_line_1','city','state','country','postal_code','phone']
      .forEach((k) => {
        if (!String(shippingData[k] || '').trim()) fe[k] = 'Required';
      });
    if (shippingData.phone && onlyDigits(shippingData.phone).length < 7) {
      fe.phone = 'Enter a valid phone number';
    }
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  const validatePayment = () => {
    const fe = {};
    // if (shippingData.payment_method !== 'card') {
    //   fe.payment_method = 'Choose a payment method';
    // } else {
      // if (!shippingData.card_number || !luhnValid(shippingData.card_number)) {
      //   fe.card_number = 'Card number looks invalid';
      // }
    if (!shippingData.card_number || !/^\d{13,19}$/.test(shippingData.card_number)) {
      fe.card_number = 'Card number looks invalid';
    }
      const exp = parseExpiry(shippingData.card_expiry_date);
      if (!exp) fe.card_expiry_date = 'Use MM/YY';
      else if (!isExpiryInFuture(exp)) fe.card_expiry_date = 'Card is expired';
      if (!shippingData.card_cvv || shippingData.card_cvv.length < 3) {
        fe.card_cvv = 'CVV should be 3–4 digits';
      }
    // }
    setFieldErrors(fe);
    return Object.keys(fe).length === 0;
  };

  /** Save a new address and return its id */
  const saveAddress = async () => {
    const payload = {
      first_name: shippingData.first_name,
      last_name: shippingData.last_name,
      house: shippingData.house,
      address_line_1: shippingData.address_line_1,
      address_line_2: shippingData.address_line_2 || undefined,
      city: shippingData.city,
      state: shippingData.state,
      country: shippingData.country,
      postal_code: shippingData.postal_code,
      phone: shippingData.phone,
      company_code: COMPANY_CODE
    };

    const { data } = await api.post(`${BASE_URL}/api/customer/address/add-address`, payload);

    const id =
      data?.address_id ??
      data?.address?.id ??
      data?.created_address_id ??
      data?.id;

    if (!id) {
      throw new Error('Address saved but no id was returned by the server.');
    }

    // ONLY set as default if user specifically requested it
    // The new address will always be the selected shipping address
    if (setShippingAsDefault) {
      try {
        await api.post(`${BASE_URL}/api/customer/address/set-default-address`, {
          address_id: id,
          company_code: COMPANY_CODE,
        });
      } catch (e) {
        console.warn('Failed to set default address:', e);
      }
    }

    return id;
  };

  /** STEP 1 → Next */
  const handleAddressNext = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validateAddress()) return;

    try {
      setIsLoading(true);
      let addressId = selectedAddressId;

      // If user is adding a new address, persist it first
      if (mode === 'new') {
        addressId = await saveAddress();
        // ALWAYS use the newly created address as the selected shipping address
        setSelectedAddressId(addressId);

        // Refresh the addresses list to include the new address
        const currentSelectedId = addressId;
        await fetchAddresses();
        // Restore the selection to the newly created address
        setSelectedAddressId(currentSelectedId);
      }

      if (!addressId) {
        setIsLoading(false);
        setError('Please choose or add a shipping address.');
        return;
      }

      // proceed to payment step
      setStep('payment');
      setError('');
    } catch (err) {
      console.error('Address step error:', err);
      if (err.response) {
        setError(err.response.data?.message || `Server error: ${err.response.status}`);
      } else if (err.request) {
        setError('Network error. Please check your connection.', err.request);
      } else {
        setError(err.message || 'An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  /** STEP 2 → Pay & Submit */
  const { cart, summary, clearCart, removeMultipleFromCart } = useCart();

  // 1. Calculate shipping fee function
  const calculateShippingFee = () => {
    return 5.00; // fixed shipping fee
  };

  // 2. Calculate tax function
  const calculateTax = (subtotal) => {
    const TAX_RATE = 0.08; // fixed tax rate
    return subtotal * TAX_RATE;
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    if (!validatePayment()) return;

    if (!selectedAddressId) {
      setError('No shipping address selected.');
      return;
    }

    // Normalize cart array
    const itemsFromCart = Array.isArray(cart) ? cart : [];

    let cartItems = [];
    let subtotal = 0;

    if (isDirectBuy && product) {
      // Direct Buy: ignore cart, checkout only this product
      const qty = Number(product.quantity ?? 1);
      const unit = Number(product.price) || 0;
      cartItems = [{
        variant_id: product.variant_id ?? product.id,
        sku: product.sku ?? product.code,
        style_number: product.style_number ?? product.styleNumber ?? null,
        quantity: qty,
        unit_price: unit,
        total_price: unit * qty
      }];
      // For direct buy, calculate subtotal from product
      subtotal = unit * qty;

    } else if (itemsFromCart && itemsFromCart.length > 0) {
      // Checkout only selected items
      if (selectedItems && selectedItems.length > 0) {
        cartItems = itemsFromCart.filter(item => selectedItems.includes(item.cart_id));
      } else {
        // Checkout all cart items (fallback to previous behavior)
        cartItems = itemsFromCart;
      }

      // Use selectedItemsSummary if provided from Cart component
      if (selectedItemsSummary && selectedItems && selectedItems.length > 0) {
        subtotal = Number(selectedItemsSummary.total_amount ?? 0);
      } else if (summary?.original_amount || summary?.total_amount || summary?.subtotal) {
        if (selectedItems && selectedItems.length > 0) {
          // Calculate subtotal for selected items only
          subtotal = cartItems.reduce((acc, it) => {
            const unit = Number(it.unit_price ?? it.price ?? 0);
            const qty = Number(it.quantity ?? 0);
            const total = Number(it.total_price ?? unit * qty);
            return acc + total;
          }, 0);
        } else {
          // Use the subtotal from cart summary for all items
          subtotal = Number(summary.subtotal ?? summary.original_amount ?? summary.total_amount ?? 0);
        }
      } else {
        // Fallback: calculate from cart items if summary not available
        subtotal = cartItems.reduce((acc, it) => {
          const unit = Number(it.unit_price ?? it.price ?? 0);
          const qty = Number(it.quantity ?? 0);
          const total = Number(it.total_price ?? unit * qty);
          return acc + total;
        }, 0);
      }
    }  else {
      setError('Your cart is empty and no product was provided.');
      return;
    }

    const shippingFee = calculateShippingFee();
    const tax = calculateTax(subtotal);
    const totalAmount = subtotal + shippingFee + tax;

    const payment_method = {
      method_type: 'card',
      provider: 'Card',
      card_number: shippingData.card_number,
      card_expiry_date: shippingData.card_expiry_date,
      card_cvv: shippingData.card_cvv,
    };

    try {
      setIsLoading(true);

      // Log checkout details for debugging
      console.log('Checkout Details:', {
        isDirectBuy,
        selectedItems: selectedItems || [],
        cartItemsToCheckout: cartItems.length,
        totalCartItems: itemsFromCart.length
      });

      const payload = {
        address_id: selectedAddressId,
        payment_method,
        order_items: cartItems.map(item => ({
          variant_id: item.variant_id,
          sku: item.sku,
          style_number: item.style_number,
          quantity: item.quantity,
          unit_price: item.unit_price ?? item.price,   // tolerate both shapes
          total_price: item.total_price ?? (Number(item.unit_price ?? item.price) * Number(item.quantity))
        })),
        subtotal,
        shipping_fee: shippingFee,
        tax_amount: tax,
        total_amount: totalAmount,
        total_items: cartItems.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
        order_notes: shippingData.order_notes || null,
        frontend_url: window.location.origin // Add frontend URL from browser
      };

      const { data, status } = await api.post(`${BASE_URL}/api/customer/checkout/submit-checkout`, payload);

      if (status === 200 || status === 201) {
        // Clear cart only when user is checking out from cart
        if (!isDirectBuy && itemsFromCart.length > 0) {
          if (selectedItems && selectedItems.length > 0) {
            // Remove only selected items
            console.log('Removing selected items from cart:', selectedItems);
            await removeMultipleFromCart(selectedItems);
            console.log(`Successfully removed ${selectedItems.length} selected items from cart`);
          } else {
            // Remove all cart items (fallback to previous behavior)
            console.log('Clearing entire cart');
            clearCart();
          }
        }

        // Show success message with invoice option
        const invoiceAvailable = data.invoice_number;
        const orderNumber = data.order_number || data.order_id;
        
        console.log(` Payment successful! Order Number: ${orderNumber}`);
    

        onSubmit?.(data);
        onHide?.();
      } else {
        setError(`Checkout failed with status: ${status}`);
      }

    } catch (err) {
      console.error('Payment step error:', err);
      if (err.response) {
        const message = err.response.data?.message || `Server error: ${err.response.status}`;
        setError(message);
      } else if (err.request) {
        setError('Network error. Please check your connection.');
        console.log('Request error:', err.request);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Function to download invoice for an order
  const downloadInvoiceForOrder = async (orderId) => {
    try {
      const api = createAxios();
      const downloadUrl = `${BASE_URL}/api/customer/invoices/generate/${orderId}`;
      const params = new URLSearchParams({ company_code: COMPANY_CODE }).toString();
      const fullUrl = `${downloadUrl}?${params}`;
      
      const token = getAuthToken();
      
      if (token) {
        // Use fetch to download with authorization
        const response = await fetch(fullUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          // Create blob from response
          const blob = await response.blob();
          
          // Create download link
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `invoice-${orderId}.pdf`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);

          console.log('Invoice downloaded successfully for order:', orderId);
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to generate invoice');
        }
      } else {
        // For non-authenticated users, open in new window
        window.open(fullUrl, '_blank');
      }

    } catch (error) {
      console.error('Error downloading invoice:', error);
      throw error; // Re-throw to handle in calling function
    }
  };

  const disabled = isLoading;

return (
    <Modal show={show} onHide={onHide} size="lg" centered className="checkout-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          {step === 'address' ? 'Shipping Address' : 'Payment'}
        </Modal.Title>
      </Modal.Header>

      <Form onSubmit={step === 'address' ? handleAddressNext : handlePaymentSubmit} noValidate>
        <Modal.Body>
          <Container className="details-container">
            {error && <div className="alert alert-danger mb-3">{error}</div>}

            {/* Step 1: Address */}
            {step === 'address' && (
              <>
                {mode === 'select' && (
                  <div className="mb-4">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-2">Choose a saved address</h5>
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => {
                          setMode('new');
                          setShippingData((p) => ({
                            ...p,
                            first_name: '', last_name: '', house: '',
                            address_line_1: '', address_line_2: '',
                            city: '', state: '', country: '', postal_code: '', phone: ''
                          }));
                          setSetShippingAsDefault(false); // Reset default checkbox when adding new
                          setSelectedAddressId(null); // Clear selection when switching to new mode
                        }}
                      >
                        + Add new address
                      </Button>
                    </div>

                    {addressesLoading && (
                      <div className="d-flex align-items-center gap-2">
                        <Spinner animation="border" size="sm" />
                        <span>Loading saved addresses…</span>
                      </div>
                    )}

                    {!addressesLoading && addressesError && (
                      <div className="alert alert-warning d-flex justify-content-between align-items-center">
                        <span>{addressesError}</span>
                        <Button variant="outline-secondary" size="sm" onClick={fetchAddresses}>
                          Retry
                        </Button>
                      </div>
                    )}

                    {!addressesLoading && !addressesError && addresses.length > 0 && (
                      <div className="saved-addresses-list">
                        {addresses.map((a) => {
                          const id = a.address_id ?? a.id;
                          const isDefault = a.is_default === 1 || a.is_default === true;
                          const line = [a.address_line_1, a.address_line_2].filter(Boolean).join(', ');
                          return (
                            <Form.Check
                              key={id}
                              id={`saved-address-${id}`}
                              type="radio"
                              name="savedAddress"
                              value={id}
                              className={`mb-2 ${isDefault ? 'saved-address-default' : ''}`}
                              label={
                                <div>
                                  <strong>{a.first_name} {a.last_name}</strong>
                                  {isDefault && <span className="badge bg-success ms-2">Default</span>}
                                  <div className="small text-muted">
                                    {line}{line && ', '} {a.city}{a.city && ', '} {a.state}{a.state && ', '}
                                    {a.postal_code}{a.country ? `, ${a.country}` : ''}
                                  </div>
                                  {a.phone && <div className="small text-muted">📞 {a.phone}</div>}
                                </div>
                              }
                              checked={String(selectedAddressId) === String(id)}
                              onChange={handleSelectSavedAddress}
                              disabled={disabled}
                            />
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {mode === 'new' && (
                  <>
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <h5 className="mb-0">Add a new address</h5>
                      {addresses.length > 0 && (
                        <Button
                          variant="link"
                          className="p-0"
                          onClick={() => {
                            setMode('select');
                            // Find the default address
                            const defaultAddr = addresses.find(a => a.is_default === 1 || a.is_default === true);
                            const addrToSelect = defaultAddr || addresses[0];
                            if (addrToSelect) {
                              const id = addrToSelect.address_id ?? addrToSelect.id;
                              setSelectedAddressId(id);
                              prefillFromAddress(addrToSelect);
                            }
                          }}
                        >
                          ← Use a saved address
                        </Button>
                      )}
                    </div>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="shippingFirstName">
                          <Form.Label>First Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="first_name"
                            autoComplete="given-name"
                            value={shippingData.first_name}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.first_name}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.first_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="shippingLastName">
                          <Form.Label>Last Name</Form.Label>
                          <Form.Control
                            type="text"
                            name="last_name"
                            autoComplete="family-name"
                            value={shippingData.last_name}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.last_name}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.last_name}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="shippingHouse">
                          <Form.Label>House / Apt</Form.Label>
                          <Form.Control
                            type="text"
                            name="house"
                            autoComplete="address-line2"
                            value={shippingData.house}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.house}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.house}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="shippingAddressLine1">
                          <Form.Label>Address Line 1</Form.Label>
                          <Form.Control
                            type="text"
                            name="address_line_1"
                            autoComplete="address-line1"
                            value={shippingData.address_line_1}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.address_line_1}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.address_line_1}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="shippingAddressLine2">
                          <Form.Label>Address Line 2 (Optional)</Form.Label>
                          <Form.Control
                            type="text"
                            name="address_line_2"
                            autoComplete="address-line2"
                            value={shippingData.address_line_2}
                            onChange={handleChange}
                            disabled={disabled}
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="shippingCity">
                          <Form.Label>City</Form.Label>
                          <Form.Control
                            type="text"
                            name="city"
                            autoComplete="address-level2"
                            value={shippingData.city}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.city}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.city}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="shippingState">
                          <Form.Label>Province / State</Form.Label>
                          <Form.Control
                            type="text"
                            name="state"
                            autoComplete="address-level1"
                            value={shippingData.state}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.state}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.state}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="shippingCountry">
                          <Form.Label>Country</Form.Label>
                          <Form.Control
                            type="text"
                            name="country"
                            autoComplete="country-name"
                            value={shippingData.country}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.country}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.country}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={6}>
                        <Form.Group controlId="shippingPostalCode">
                          <Form.Label>Postal Code</Form.Label>
                          <Form.Control
                            type="text"
                            name="postal_code"
                            autoComplete="postal-code"
                            value={shippingData.postal_code}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.postal_code}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.postal_code}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group controlId="shippingPhone">
                          <Form.Label>Phone Number</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            autoComplete="tel"
                            inputMode="tel"
                            value={shippingData.phone}
                            onChange={handleChange}
                            isInvalid={!!fieldErrors.phone}
                            disabled={disabled}
                            required
                          />
                          <Form.Control.Feedback type="invalid">
                            {fieldErrors.phone}
                          </Form.Control.Feedback>
                        </Form.Group>
                      </Col>
                    </Row>

                    <Row className="mb-3">
                      <Col md={12}>
                        <Form.Group controlId="setShippingAsDefault" className="mt-1">
                          <Form.Check
                            type="checkbox"
                            id="set-shipping-as-default"
                            label="Save this address as my default for future orders"
                            checked={setShippingAsDefault}
                            onChange={(e) => setSetShippingAsDefault(e.target.checked)}
                            className="set-as-default-checkbox"
                            disabled={disabled}
                          />
                          <Form.Text className="text-muted">
                            This address will be used as your shipping address for this order. Check the box to make it your default address for future orders.
                          </Form.Text>
                        </Form.Group>
                      </Col>
                    </Row>
                  </>
                )}
              </>
            )}

            {/* Step 2: Payment */}
            {step === 'payment' && (
              <>
                <Row className="mb-3">
                  <Col>
                    <div className="alert alert-info">
                      <strong>Shipping To:</strong>{' '}
                      {(() => {
                        const a = addresses.find(x => String(x.address_id ?? x.id) === String(selectedAddressId));
                        if (!a) return 'Address on file';
                        const line = [a.address_line_1, a.address_line_2].filter(Boolean).join(', ');
                        return `${a.first_name} ${a.last_name}, ${line}${line ? ', ' : ''}${a.city}, ${a.state} ${a.postal_code}${a.country ? ', ' + a.country : ''}`;
                      })()}
                      {' '}<Button variant="link" className="p-0 ms-1" onClick={() => setStep('address')}>Change</Button>
                    </div>
                  </Col>
                </Row>

                {/* show product summary when cart is empty but product was provided */}
                {(!Array.isArray(cart) || cart.length === 0) && product && (
                  <Row className="mb-3">
                    <Col>
                      <div className="alert alert-secondary">
                        <strong>Item:</strong> {product.name ?? product.title ?? 'Selected Product'} ·
                        <strong> Qty:</strong> {product.quantity ?? 1} ·
                        <strong> Price:</strong> ${Number(product.price || 0).toFixed(2)}
                      </div>
                    </Col>
                  </Row>
                )}

                {/* show selected items summary when checking out from cart */}
                {!isDirectBuy && selectedItems && selectedItems.length > 0 && Array.isArray(cart) && cart.length > 0 && (
                  <Row className="mb-3">
                    <Col>
                      <div className="alert alert-info">
                        <h6 className="mb-2">Selected Items for Checkout ({selectedItems.length})</h6>
                        {cart
                          .filter(item => selectedItems.includes(item.cart_id))
                          .map((item, index) => (
                            <div key={item.cart_id} className="d-flex justify-content-between align-items-center mb-1">
                              <small>
                                <strong>{item.product_name}</strong>
                                {item.color_name && ` - ${item.color_name}`}
                                {item.size_name && ` - ${item.size_name}`}
                                {` (x${item.quantity})`}
                              </small>
                              <small className="fw-bold">
                                {formatPrice(Number(item.price || 0) * Number(item.quantity || 1))}
                              </small>
                            </div>
                          ))
                        }
                      </div>
                    </Col>
                  </Row>
                )}

                {/* Order Summary */}
                <Row className="mb-4">
                  <Col>
                    {(() => {
                      // Calculate totals based on cart or product
                      let subtotal = 0;
                      
                      if (isDirectBuy && product) {
                        // Direct buy: calculate from product
                        const price = Number(product.price || 0);
                        const quantity = Number(product.quantity || 1);
                        subtotal = price * quantity;
                      } else if (Array.isArray(cart) && cart.length > 0) {
                        // Cart checkout: use selectedItemsSummary if provided
                        if (selectedItemsSummary && selectedItems && selectedItems.length > 0) {
                          subtotal = Number(selectedItemsSummary.total_amount ?? 0);
                        } else if (summary?.subtotal || summary?.original_amount || summary?.total_amount) {
                          subtotal = Number(summary.subtotal ?? summary.original_amount ?? summary.total_amount ?? 0);
                        } else {
                          // Fallback calculation
                          const itemsToCalculate = selectedItems && selectedItems.length > 0 
                            ? cart.filter(item => selectedItems.includes(item.cart_id))
                            : cart;
                          subtotal = itemsToCalculate.reduce((sum, item) => {
                            const price = Number(item.price || 0);
                            const quantity = Number(item.quantity || 1);
                            return sum + (price * quantity);
                          }, 0);
                        }
                      }

                      const shippingCost = calculateShippingFee();
                      const tax = calculateTax(subtotal);
                      const total = subtotal + shippingCost + tax;

                      return (
                        <Card className="cart-summary">
                          <Card.Header>
                            <h5 className="mb-0">Order Summary</h5>
                          </Card.Header>
                          <Card.Body>
                            <div className="d-flex justify-content-between mb-3">
                              <span>Subtotal:</span>
                              <span className="fw-bold">{formatPrice(subtotal)}</span>
                            </div>
                            <div className="d-flex justify-content-between mb-3">
                              <span>Shipping:</span>
                              <span className="fw-bold">
                                {shippingCost === 0 ? (
                                  <span className="text-success">FREE</span>
                                ) : (
                                  formatPrice(shippingCost)
                                )}
                              </span>
                            </div>
                            <div className="d-flex justify-content-between mb-3">
                              <span>Tax:</span>
                              <span className="fw-bold">{formatPrice(tax)}</span>
                            </div>
                            
                            <hr style={{borderColor: 'rgba(255,255,255,0.3)'}} />
                                
                            <div className="d-flex justify-content-between mb-4">
                              <strong style={{fontSize: '1.3rem'}}>Total:</strong>
                              <strong style={{fontSize: '1.3rem'}}>{formatPrice(total)}</strong>
                            </div>
                          </Card.Body>
                        </Card>
                      );
                    })()}
                  </Col>
                </Row>

                {/* Payment Information */}
                <Row className="mb-3">
                  <Col>
                    <h5 className="mb-3">Payment Information</h5>
                  </Col>
                </Row>

                <Row className="mb-3">
                  <Col md={4}>
                    <Form.Group controlId="cardNumber">
                      <Form.Label>Card Number</Form.Label>
                      <Form.Control
                        type="text"
                        name="card_number"
                        inputMode="numeric"
                        autoComplete="cc-number"
                        placeholder="•••• •••• •••• ••••"
                        value={shippingData.card_number}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.card_number}
                        minLength={16}
                        maxLength={19}
                        disabled={disabled}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {fieldErrors.card_number}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="cardExpiryDate">
                      <Form.Label>Expiry Date</Form.Label>
                      <Form.Control
                        type="text"
                        name="card_expiry_date"
                        inputMode="numeric"
                        autoComplete="cc-exp"
                        placeholder="MM/YY"
                        value={shippingData.card_expiry_date}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.card_expiry_date}
                        maxLength={5}
                        disabled={disabled}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {fieldErrors.card_expiry_date}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group controlId="cardCvv">
                      <Form.Label>CVV</Form.Label>
                      <Form.Control
                        type="password"
                        name="card_cvv"
                        inputMode="numeric"
                        autoComplete="cc-csc"
                        placeholder="CVV"
                        value={shippingData.card_cvv}
                        onChange={handleChange}
                        isInvalid={!!fieldErrors.card_cvv}
                        maxLength={4}
                        disabled={disabled}
                        required
                      />
                      <Form.Control.Feedback type="invalid">
                        {fieldErrors.card_cvv}
                      </Form.Control.Feedback>
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}
          </Container>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={disabled}>
            Cancel
          </Button>

          {step === 'address' ? (
            <Button type="submit" variant="primary" className="continue-btn" disabled={disabled}>
              {isLoading ? 'Saving...' : 'Continue to Payment'}
            </Button>
          ) : (
            <Button type="submit" variant="primary" className="continue-btn" disabled={disabled}>
              {isLoading ? 'Processing...' : 'Pay & Continue'}
            </Button>
          )}
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CheckoutModal;

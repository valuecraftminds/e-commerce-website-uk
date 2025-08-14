import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import axios from 'axios';

import { AuthContext } from './AuthContext';
import { CountryContext } from './CountryContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const CartContext = createContext();

// Currency conversion helpers
const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };

// Helper function to calculate cart summary with currency conversion
const calculateSummary = (items, exchangeRate = 1, currencySymbol = '$') => {
  const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
  const total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const converted_amount = total_amount * exchangeRate;
  
  return {
    total_items,
    total_amount: converted_amount.toFixed(2),
    currency_symbol: currencySymbol,
    original_amount: total_amount.toFixed(2)
  };
};

// Cart reducer
const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_CART':
      return { 
        ...state, 
        items: action.payload.cart || [], 
        summary: action.payload.summary || { total_items: 0, total_amount: '0.00', currency_symbol: '$' },
        loading: false 
      };
    
    case 'UPDATE_CURRENCY':
      return {
        ...state,
        summary: calculateSummary(state.items, action.payload.rate, action.payload.symbol)
      };
    
    case 'ADD_TO_CART':
      const existingItemIndex = state.items.findIndex(
        item => item.variant_id === action.payload.variant_id
      );
      
      if (existingItemIndex >= 0) {
        const updatedItems = [...state.items];
        updatedItems[existingItemIndex].quantity += action.payload.quantity;
        updatedItems[existingItemIndex].total_price = 
          updatedItems[existingItemIndex].price * updatedItems[existingItemIndex].quantity;
        
        return { 
          ...state, 
          items: updatedItems,
          summary: calculateSummary(updatedItems, action.payload.exchangeRate, action.payload.currencySymbol)
        };
      } else {
        const newItems = [...state.items, action.payload];
        return { 
          ...state, 
          items: newItems,
          summary: calculateSummary(newItems, action.payload.exchangeRate, action.payload.currencySymbol)
        };
      }
    
    case 'UPDATE_QUANTITY':
      const updatedItems = state.items.map(item => 
        item.cart_id === action.payload.cart_id 
          ? { 
              ...item, 
              quantity: action.payload.quantity,
              total_price: item.price * action.payload.quantity
            }
          : item
      );
      
      return { 
        ...state, 
        items: updatedItems,
        summary: calculateSummary(updatedItems, action.payload.exchangeRate, action.payload.currencySymbol)
      };
    
    case 'REMOVE_FROM_CART':
      const filteredItems = state.items.filter(item => item.cart_id !== action.payload.cart_id);
      return { 
        ...state, 
        items: filteredItems,
        summary: calculateSummary(filteredItems, action.payload.exchangeRate, action.payload.currencySymbol)
      };
    
    case 'CLEAR_CART':
      return { 
        ...state, 
        items: [], 
        summary: { total_items: 0, total_amount: '0.00', currency_symbol: action.payload?.currencySymbol || '$' }
      };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
};

// Initial state
const initialState = {
  items: [],
  summary: { total_items: 0, total_amount: '0.00', currency_symbol: '$' },
  loading: false,
  error: null
};

// Cart Provider
export const CartProvider = ({ children }) => {
  const { isLoggedIn } = useContext(AuthContext);
  const { country } = useContext(CountryContext);
  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [exchangeRates, setExchangeRates] = useState({});
  const [isMerged, setIsMerged] = useState(false);

  // Get current exchange rate and currency symbol
  const getCurrentCurrency = () => {
    const symbol = currencySymbols[country] || '$';
    let rate = 1;
    
    switch (country) {
      case 'US':
        rate = 1;
        break;
      case 'UK':
        rate = exchangeRates['GBP'] || 0.75;
        break;
      case 'SL':
        rate = exchangeRates['LKR'] || 320;
        break;
      default:
        rate = 1;
    }
    
    return { rate, symbol };
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
        setExchangeRates({
          GBP: 0.75,
          LKR: 320
        });
      }
    };
    fetchExchangeRates();
  }, []);

  // Update cart summary when country or exchange rates change
  useEffect(() => {
    if (state.items.length > 0) {
      const { rate, symbol } = getCurrentCurrency();
      dispatch({ 
        type: 'UPDATE_CURRENCY', 
        payload: { rate, symbol } 
      });
    }
  }, [country, exchangeRates, state.items]);

  // Format price with current currency
  const formatPrice = (price) => {
    if (!price) return "0.00";
    const { rate, symbol } = getCurrentCurrency();
    const convertedPrice = (price * rate).toFixed(2);
    return `${symbol}${convertedPrice}`;
  };
  
  // Get auth token
  const getAuthToken = () => {
    const token = localStorage.getItem('authToken');
    return token;
  };

  // Get axios config with optional auth
  const getAxiosConfig = () => {
    const token = getAuthToken();
    const config = {
      params: { company_code: COMPANY_CODE }
    };
    
    if (token) {
      config.headers = { Authorization: `Bearer ${token}` };
    }
    
    return config;
  };

  // Local storage helpers for guest cart
  const getGuestCart = () => {
    try {
      const guestCart = localStorage.getItem(`guest_cart_${COMPANY_CODE}`);
      return guestCart ? JSON.parse(guestCart) : [];
    } catch (error) {
      console.error('Error parsing guest cart:', error);
      return [];
    }
  };

  const setGuestCart = (cart) => {
    try {
      localStorage.setItem(`guest_cart_${COMPANY_CODE}`, JSON.stringify(cart));
    } catch (error) {
      console.error('Error saving guest cart:', error);
    }
  };

  const clearGuestCart = () => {
    localStorage.removeItem(`guest_cart_${COMPANY_CODE}`);
  };

  // Fetch cart items from backend
  const fetchCartItems = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/api/customer/cart/get-cart`, getAxiosConfig());

      if (response.data.success) {
        const { rate, symbol } = getCurrentCurrency();
        const summary = calculateSummary(response.data.cart || [], rate, symbol);
        
        dispatch({ 
          type: 'SET_CART', 
          payload: { 
            ...response.data, 
            summary 
          } 
        });
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };

  
  
 useEffect(() => {
  if (isLoggedIn) {
    const token = getAuthToken();
    // console.log('token:', token);
    loadCart();
  }
}, [isLoggedIn]);

  useEffect(() => {
    loadMemo();
  }, []);

  // Load cart based on user authentication
  const loadCart = async () => {
    const token = getAuthToken();
    // console.log(token);
    dispatch({ type: 'SET_LOADING', payload: true });
    //  if(!isMerged && token) {
    //   mergeCartOnLogin().then(response => {
    //     if (response.success) {
    //       setIsMerged(true);
    //       console.log('Cart merged successfully');
    //     } else {
    //       console.error('Failed to merge cart:', response.message);
    //     }
    //   }).catch(error => {
    //     console.error('Error merging cart:', error);
    //   });
    // }
    if (token) {
      // User is logged in, fetch from backend
      await fetchCartItems();
    }
  };

  // Load memo from localStorage
  const loadMemo = () => {
    // Guest user, load from localStorage
    const guestCart = getGuestCart();
    
    if (guestCart.length > 0) {
      // Convert guest cart format to match backend format
      const formattedCart = guestCart.map(item => ({
        ...item,
        total_price: item.price * item.quantity
      }));
      
      const { rate, symbol } = getCurrentCurrency();
      
      dispatch({ 
        type: 'SET_CART', 
        payload: { 
          cart: formattedCart,
          summary: calculateSummary(formattedCart, rate, symbol)
        }
      });
    } else {
      const { symbol } = getCurrentCurrency();
      dispatch({ 
        type: 'SET_CART', 
        payload: { 
          cart: [], 
          summary: { total_items: 0, total_amount: '0.00', currency_symbol: symbol } 
        } 
      });
    }
  };

  // Add item to cart
  const addToCart = async (item) => {
    try {
      if (!item.size || !item.color) {
        throw new Error('Please select size and color');
      }

      const token = getAuthToken();
      const { rate, symbol } = getCurrentCurrency();

      if (token) {
        // User is logged in, add to backend
        const response = await axios.post(`${BASE_URL}/api/customer/cart/add`, {
          style_code: item.style_code,
          quantity: item.quantity || 1,
          price: item.price,
          product_name: item.name,
          sku: item.sku,
          color_name: item.color?.name,
          image: item.image,
          size: item.size,
          customer_id: item.customer_id,
          variant_id: item.variant_id
        }, getAxiosConfig());

        if (response.data.success) {
          // Refresh cart items after successful addition
          console.log('Item added to cart successfully:', response.data);
          await fetchCartItems();
          return { success: true, message: response.data.message };
          
        } else {
          throw new Error(response.data.message || 'Failed to add item to cart');
        }
      } else {
        // Guest user, add to localStorage
        const guestCart = getGuestCart();
        const existingItemIndex = guestCart.findIndex(
          cartItem => cartItem.variant_id === item.variant_id
        );
        
        const cartItem = {
          cart_id: `guest_${Date.now()}`,
          style_code: item.style_code,
          quantity: item.quantity || 1,
          style_id: item.style_id,
          product_name: item.name,
          description: item.description,
          image: item.image,
          price: item.price,
          stock_quantity: item.stock_quantity,
          sku: item.sku,
          color_name: item.color?.name,
          color_code: item.color?.code,
          size_name: item.size,
          material_name: item.material_name,
          fit_name: item.fit_name,
          total_price: item.price * (item.quantity || 1),
          exchangeRate: rate,
          currencySymbol: symbol,
          variant_id: item.variant_id,
        };

        console.log('Adding to guest cart:', cartItem);
        
        if (existingItemIndex >= 0) {
          guestCart[existingItemIndex].quantity += (item.quantity || 1);
          guestCart[existingItemIndex].total_price = 
            guestCart[existingItemIndex].price * guestCart[existingItemIndex].quantity;
        } else {
          guestCart.push(cartItem);
        }
        
        setGuestCart(guestCart);
        dispatch({ type: 'ADD_TO_CART', payload: { ...cartItem, exchangeRate: rate, currencySymbol: symbol } });
        
        return { success: true, message: 'Item added to cart successfully' };
      }
    } catch (error) {
      console.error('Error adding to cart:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to add item to cart';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  };

  // Update cart item quantity
  const updateQuantity = async (cart_id, quantity) => {
    try {
      const token = getAuthToken();
      const { rate, symbol } = getCurrentCurrency();
      
      if (token) {
        // User is logged in, update in backend
        const response = await axios.put(
          `${BASE_URL}/api/customer/cart/${cart_id}`,
          { quantity },
          getAxiosConfig()
        );
        
        if (response.data.success) {
          dispatch({ 
            type: 'UPDATE_QUANTITY', 
            payload: { cart_id, quantity, exchangeRate: rate, currencySymbol: symbol } 
          });
          return { success: true, message: response.data.message };
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.data.message });
          return { success: false, message: response.data.message };
        }
      } else {
        // Guest user, update localStorage
        const guestCart = getGuestCart();
        const itemIndex = guestCart.findIndex(item => item.cart_id === cart_id);
        
        if (itemIndex >= 0) {
          guestCart[itemIndex].quantity = quantity;
          guestCart[itemIndex].total_price = guestCart[itemIndex].price * quantity;
          setGuestCart(guestCart);
          dispatch({ 
            type: 'UPDATE_QUANTITY', 
            payload: { cart_id, quantity, exchangeRate: rate, currencySymbol: symbol } 
          });
          return { success: true, message: 'Cart updated successfully' };
        } else {
          return { success: false, message: 'Item not found in cart' };
        }
      }
    } catch (error) {
      console.error('Error updating cart:', error);
      const errorMessage = error.response?.data?.message || 'Failed to update cart';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Remove item from cart
  const removeFromCart = async (cart_id) => {
    try {
      const token = getAuthToken();
      const { rate, symbol } = getCurrentCurrency();
      
      if (token) {
        // User is logged in, remove from backend
        const response = await axios.delete(
          `${BASE_URL}/api/customer/cart/${cart_id}`,
          getAxiosConfig()
        );
        
        if (response.data.success) {
          dispatch({ 
            type: 'REMOVE_FROM_CART', 
            payload: { cart_id, exchangeRate: rate, currencySymbol: symbol } 
          });
          return { success: true, message: response.data.message };
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.data.message });
          return { success: false, message: response.data.message };
        }
      } else {
        // Guest user, remove from localStorage
        const guestCart = getGuestCart();
        const filteredCart = guestCart.filter(item => item.cart_id !== cart_id);
        setGuestCart(filteredCart);
        dispatch({ 
          type: 'REMOVE_FROM_CART', 
          payload: { cart_id, exchangeRate: rate, currencySymbol: symbol } 
        });
        return { success: true, message: 'Item removed from cart successfully' };
      }
    } catch (error) {
      console.error('Error removing from cart:', error);
      const errorMessage = error.response?.data?.message || 'Failed to remove item from cart';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Clear entire cart
  const clearCart = async () => {
    try {
      const token = getAuthToken();
      const { symbol } = getCurrentCurrency();
      
      if (token) {
        // User is logged in, clear backend cart
        const response = await axios.delete(
          `${BASE_URL}/api/customer/cart/clear-all`,
          getAxiosConfig()
        );
        
        if (response.data.success) {
          dispatch({ type: 'CLEAR_CART', payload: { currencySymbol: symbol } });
          return { success: true, message: response.data.message };
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.data.message });
          return { success: false, message: response.data.message };
        }
      } else {
        // Guest user, clear localStorage
        clearGuestCart();
        dispatch({ type: 'CLEAR_CART', payload: { currencySymbol: symbol } });
        return { success: true, message: 'Cart cleared successfully' };
      }
    } catch (error) {
      console.error('Error clearing cart:', error);
      const errorMessage = error.response?.data?.message || 'Failed to clear cart';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      return { success: false, message: errorMessage };
    }
  };

  // Merge guest cart with user cart on login
  const mergeCartOnLogin = async () => {
  try {
    const guestCart = getGuestCart();

    if (!guestCart || guestCart.length === 0) {
      await loadCart();
      return { success: true, message: 'No guest cart to merge' };
    }

    // Send full data to support server-side bulk insertion
    const guestCartData = guestCart.map(item => ({
      style_code: item.style_code,
      variant_id: item.variant_id,
      quantity: item.quantity,
      price: item.price,
      product_name: item.name,
      color_name: item.color_name || null,
      image: item.image || null,
      currency: item.currency || 'USD',
      product_url: item.product_url || null,
      tax: item.tax || 0.00,
      shipping_fee: item.shipping_fee || 0.00,
      is_available: item.is_available !== undefined ? item.is_available : true
    }));

    console.log('Merging guest cart:', guestCartData);

    const response = await axios.post(
      `${BASE_URL}/api/customer/cart/merge`,
      { guest_cart: guestCartData },
      getAxiosConfig()
    );

    if (response.data.success) {
      clearGuestCart();
      await loadCart();
      return { success: true, message: response.data.message };
    } else {
      dispatch({ type: 'SET_ERROR', payload: response.data.message });
      return { success: false, message: response.data.message };
    }
  } catch (error) {
    console.error('Error merging cart:', error);
    const errorMessage = error.response?.data?.message || 'Failed to merge cart';
    dispatch({ type: 'SET_ERROR', payload: errorMessage });
    return { success: false, message: errorMessage };
  }
};


  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    // State
    cart: state.items,
    summary: state.summary,
    loading: state.loading,
    error: state.error,
    
    // Actions
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    loadCart,
    mergeCartOnLogin,
    clearError,
    
    // Currency helpers
    formatPrice,
    getCurrentCurrency
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

// Custom hook to use cart context
export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

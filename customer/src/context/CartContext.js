import React, { createContext, useContext, useReducer, useEffect, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

// Create the CartContext first
const CartContext = createContext();

// Helper function to calculate cart summary
const calculateSummary = (items) => {
  const total_items = items.reduce((sum, item) => sum + item.quantity, 0);
  const total_amount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  return {
    total_items,
    total_amount: total_amount.toFixed(2)
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
        summary: action.payload.summary || { total_items: 0, total_amount: '0.00' },
        loading: false 
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
          summary: calculateSummary(updatedItems)
        };
      } else {
        const newItems = [...state.items, action.payload];
        return { 
          ...state, 
          items: newItems,
          summary: calculateSummary(newItems)
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
        summary: calculateSummary(updatedItems)
      };
    
    case 'REMOVE_FROM_CART':
      const filteredItems = state.items.filter(item => item.cart_id !== action.payload);
      return { 
        ...state, 
        items: filteredItems,
        summary: calculateSummary(filteredItems)
      };
    
    case 'CLEAR_CART':
      return { 
        ...state, 
        items: [], 
        summary: { total_items: 0, total_amount: '0.00' }
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
  summary: { total_items: 0, total_amount: '0.00' },
  loading: false,
  error: null
};

// Cart Provider
export const CartProvider = ({ children }) => {
  const { isLoggedIn, userData } = useContext(AuthContext); 
  const [state, dispatch] = useReducer(cartReducer, initialState);
  
  // Get auth token 
  const getAuthToken = () => {
    return localStorage.getItem('authToken'); 
  };

  // Get axios config with proper headers
  const getAxiosConfig = () => {
    const token = getAuthToken();
    const config = {
      params: { company_code: COMPANY_CODE }
    };
    
    if (token) {
      config.headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };
    }
    
    return config;
  };

  // Local storage helpers for guest cart
  const getGuestCart = () => {
    try {
      const guestCart = localStorage.getItem(`guest_cart_${COMPANY_CODE}`);
      console.log('Guest cart loaded:', guestCart);
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
      console.log('Fetching cart items from backend...');
      
      // Backend expects company_code in query params
      const config = {
        params: { company_code: COMPANY_CODE },
        headers: { 
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      };
      
      const response = await axios.get(`${BASE_URL}/cart/get-cart`, config); 

      console.log('Cart response:', response.data);
      if (response.data.success) {
        dispatch({ type: 'SET_CART', payload: response.data });
        return response.data;
      }
    } catch (error) {
      console.error('Error fetching cart items:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };
  

  // Load cart based on user authentication
 const hasLoaded = useRef(false);

  useEffect(() => {
    if (isLoggedIn && !hasLoaded.current) {
      loadCart();
      hasLoaded.current = true;
    }
  }, [isLoggedIn]);

    useEffect(() => {
      loadMemo();
  },[]); 
  

  const loadCart = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    
    try {
      const token = getAuthToken();
      
      if (token && isLoggedIn) {
        // logged in user - fetch from backend
        console.log('Loading cart for logged in user...');
        if(isLoggedIn && !hasLoaded.current) {
          await mergeCartOnLogin();
        
          hasLoaded.current = true;
        }
        
        //  mergeCartOnLogin();
        //  fetchCartItems();

      } else {
        // // Guest user, load from localStorage
        // console.log('Loading guest cart...');
        // const guestCart = getGuestCart();
        
        // if (guestCart.length > 0) {
        //   // Convert guest cart format to match backend format
        //   const formattedCart = guestCart.map(item => ({
        //     ...item,
        //     total_price: item.price * item.quantity
        //   }));
          
        //   dispatch({ 
        //     type: 'SET_CART', 
        //     payload: { 
        //       cart: formattedCart,
        //       summary: calculateSummary(formattedCart)
        //     }
        //   });
        // } else {
        //   dispatch({ type: 'SET_CART', payload: { cart: [], summary: { total_items: 0, total_amount: '0.00' } } });
        // }
      }
    } catch (error) {
      console.error('Error loading cart:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };

  const loadMemo = async () => {
    // Guest user, load from localStorage
        console.log('Loading guest cart...');
        const guestCart = getGuestCart();
        
        if (guestCart.length > 0) {
          // Convert guest cart format to match backend format
          const formattedCart = guestCart.map(item => ({
            ...item,
            total_price: item.price * item.quantity
          }));
          
          dispatch({ 
            type: 'SET_CART', 
            payload: { 
              cart: formattedCart,
              summary: calculateSummary(formattedCart)
            }
          });
        } else {
          dispatch({ type: 'SET_CART', payload: { cart: [], summary: { total_items: 0, total_amount: '0.00' } } });
        }
      };
  // Add item to cart 
  const addToCart = async (item) => {
    try {
      // Validate required fields 
      if (!item || !item.style_code || !item.variant_id) {
        throw new Error('Missing required product information');
      }

      if (!item.size || !item.color) {
        throw new Error('Please select size and color');
      }

      const token = getAuthToken();

      if (token && isLoggedIn) {
        // User is logged in, add to backend
        console.log('Adding item to cart for logged in user:', item);
        
        // Match backend expectations 
        const payload = {
          style_code: item.style_code,
          variant_id: item.variant_id,
          quantity: item.quantity || 1,
          customer_id: userData?.customer_id
        };

        console.log('Cart payload:', payload);

        const config = {
          params: { company_code: COMPANY_CODE },
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };

        const response = await axios.post(`${BASE_URL}/cart/add`, payload, config);

        console.log('Add to cart response:', response.data);

        if (response.data.success) {
          // Refresh cart items after successful addition
          await fetchCartItems();
          return { success: true, message: response.data.message };
        } else {
          throw new Error(response.data.message || 'Failed to add item to cart');
        }
      } else {
        // Guest user, add to localStorage
        console.log('Adding item to guest cart:', item);
        const guestCart = getGuestCart();
        const existingItemIndex = guestCart.findIndex(
          cartItem => cartItem.variant_id === item.variant_id
        );
        
        const cartItem = {
          cart_id: `guest_${Date.now()}`,
          style_code: item.style_code,
          variant_id: item.variant_id,
          quantity: item.quantity || 1,
          style_id: item.style_id,
          style_name: item.name,
          description: item.description,
          image: item.image,
          price: item.price,
          stock_quantity: item.stock_quantity,
          sku: item.sku,
          color_name: item.color,
          size_name: item.size,
          material_name: item.material_name,
          fit_name: item.fit_name,
          total_price: item.price * (item.quantity || 1)
        };

        console.log('Guest cart item:', cartItem);
        
        if (existingItemIndex >= 0) {
          guestCart[existingItemIndex].quantity += (item.quantity || 1);
          guestCart[existingItemIndex].total_price = 
            guestCart[existingItemIndex].price * guestCart[existingItemIndex].quantity;
        } else {
          guestCart.push(cartItem);
        }
        
        setGuestCart(guestCart);
        dispatch({ type: 'ADD_TO_CART', payload: cartItem });
        
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
      
      if (token && isLoggedIn) {
        // User is logged in, update in backend
        console.log('Updating quantity in backend for cart_id:', cart_id, 'quantity:', quantity);
        
        const config = {
          params: { company_code: COMPANY_CODE },
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const response = await axios.put(
          `${BASE_URL}/cart/${cart_id}`, 
          { quantity },
          config
        );
        
        if (response.data.success) {
          dispatch({ type: 'UPDATE_QUANTITY', payload: { cart_id, quantity } });
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
          dispatch({ type: 'UPDATE_QUANTITY', payload: { cart_id, quantity } });
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
      
      if (token && isLoggedIn) {
        // User is logged in, remove from backend
        console.log('Removing item from backend cart:', cart_id);
        
        const config = {
          params: { company_code: COMPANY_CODE },
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const response = await axios.delete(
          `${BASE_URL}/cart/${cart_id}`, 
          config
        );
        
        if (response.data.success) {
          dispatch({ type: 'REMOVE_FROM_CART', payload: cart_id });
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
        dispatch({ type: 'REMOVE_FROM_CART', payload: cart_id });
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
      
      if (token && isLoggedIn) {
        // User is logged in, clear backend cart
        console.log('Clearing backend cart...');
        
        const config = {
          params: { company_code: COMPANY_CODE },
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        };
        
        const response = await axios.delete(
          `${BASE_URL}/cart/clear`,
          config
        );
        
        if (response.data.success) {
          dispatch({ type: 'CLEAR_CART' });
          return { success: true, message: response.data.message };
        } else {
          dispatch({ type: 'SET_ERROR', payload: response.data.message });
          return { success: false, message: response.data.message };
        }
      } else {
        // Guest user, clear localStorage
        clearGuestCart();
        dispatch({ type: 'CLEAR_CART' });
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
      
      if (guestCart.length === 0) {
        await loadCart();
        return { success: true, message: 'No guest cart to merge' };
      }

      console.log('Merging guest cart with user cart:', guestCart);

      // Prepare guest cart data for backend
      const guestCartData = guestCart.map(item => ({
        style_code: item.style_code,
        variant_id: item.variant_id,
        quantity: item.quantity,
        customer_id: userData?.customer_id
      }));

      const config = {
        params: { company_code: COMPANY_CODE },
        headers: { 
          'Authorization': `Bearer ${getAuthToken()}`,
          'Content-Type': 'application/json'
        }
      };

      const response = await axios.post(
        `${BASE_URL}/cart/merge`,
        { guest_cart: guestCartData },
        config
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
    clearError
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
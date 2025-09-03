import React, { createContext, useContext, useReducer, useEffect, useState, useMemo } from 'react';
import axios from 'axios';

import { AuthContext } from './AuthContext';
import { CountryContext } from './CountryContext';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const CartContext = createContext();

const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };

const getUnitPrice = (item) => Number(item?.sale_price ?? item?.price ?? item?.unit_price ?? 0);
const buildCartKey = (item) => {
  if (item?.sku) return `sku:${String(item.sku)}`;
  const vid = item?.variant_id ?? 'na';
  const size = item?.size ?? item?.size_name ?? 'na';
  const color = item?.color_code ?? item?.color_name ?? item?.color?.name ?? 'na';
  return `vid:${String(vid)}|size:${String(size)}|color:${String(color)}`;
};
const withSyncedTotals = (item) => {
  const qty = Number(item?.quantity ?? 0);
  const price = getUnitPrice(item);
  const cart_key = item?.cart_key ?? buildCartKey(item);

  const stockQty = Number(item?.quantity ?? 0);
  const total_price = stockQty > 0 ? price * qty : 0;
  return { ...item, total_price, cart_key };
};

// Replace your existing calculateSummary function with this:
const calculateSummary = (items, exchangeRate = 1, currencySymbol = '$') => {
  // Helper function to check if item is in stock
  const isInStock = (item) => {
    // Primary check: if is_available is explicitly set to false, item is out of stock
    if (item?.is_available === false) return false;
    
    // Secondary check: if stock_qty is provided and is 0 or less, item is out of stock
    if (item?.stock_qty !== undefined && Number(item.stock_qty) <= 0) return false;
    
    // If is_available is true or undefined, and stock_qty is either undefined or > 0, consider in stock
    return true;
  };

  // Separate in-stock and out-of-stock items
  const inStockItems = items.filter(isInStock);
  const outOfStockItems = items.filter(item => !isInStock(item));

  // Only count in-stock items for totals
  const total_items = inStockItems.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);
  
  // Only include in-stock items in price calculation
  const base = inStockItems.reduce((sum, item) => {
    return sum + getUnitPrice(item) * Number(item.quantity || 0);
  }, 0);
  
  // Count available vs out of stock quantities
  const available_items = inStockItems.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);
  
  const out_of_stock_items = outOfStockItems.reduce((sum, item) => {
    return sum + Number(item.quantity || 0);
  }, 0);
  
  return { 
    total_items,           // Only in-stock items
    available_items,       // Same as total_items
    out_of_stock_items,    // Out-of-stock item quantities
    total_amount: (base * exchangeRate).toFixed(2),  // Only in-stock items
    currency_symbol: currencySymbol, 
    original_amount: base.toFixed(2)  // Only in-stock items
  };
};

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING': return { ...state, loading: action.payload };
    case 'SET_CART': {
      const items = (action.payload.cart || []).map(withSyncedTotals);
      const summary = action.payload.summary || calculateSummary(items, 1, '$');
      console.log('[SET_CART]', { items, summary });
      return { ...state, items, summary, loading: false };
    }
    case 'UPDATE_CURRENCY': {
      const summary = calculateSummary(state.items, action.payload.rate, action.payload.symbol);
      console.log('[UPDATE_CURRENCY]', action.payload, summary);
      return { ...state, summary };
    }
    case 'ADD_TO_CART': {
      const { newItem, exchangeRate, currencySymbol } = action.payload;
      const itemToAdd = withSyncedTotals(newItem);
      const i = state.items.findIndex((it) => String(it.cart_key) === String(itemToAdd.cart_key));
      const nextItems = i >= 0
        ? state.items.map((it, idx) => idx === i ? withSyncedTotals({ ...it, quantity: Number(it.quantity || 0) + Number(itemToAdd.quantity || 1) }) : it)
        : [...state.items, itemToAdd];
      const summary = calculateSummary(nextItems, exchangeRate, currencySymbol);
      console.log('[ADD_TO_CART]', { itemToAdd, nextItems, summary });
      return { ...state, items: nextItems, summary };
    }
    case 'UPDATE_QUANTITY': {
      const { cart_id, quantity, exchangeRate, currencySymbol } = action.payload;
      const nextItems = state.items.map((it) => String(it.cart_id) === String(cart_id) ? withSyncedTotals({ ...it, quantity: Number(quantity) }) : it);
      const summary = calculateSummary(nextItems, exchangeRate, currencySymbol);
      console.log('[UPDATE_QUANTITY]', { cart_id, quantity, summary });
      return { ...state, items: nextItems, summary };
    }
    case 'REMOVE_FROM_CART': {
      const { cart_id, exchangeRate, currencySymbol } = action.payload;
      const nextItems = state.items.filter((it) => String(it.cart_id) !== String(cart_id));
      const summary = calculateSummary(nextItems, exchangeRate, currencySymbol);
      console.log('[REMOVE_FROM_CART]', { cart_id, summary });
      return { ...state, items: nextItems, summary };
    }
    case 'CLEAR_CART': {
      const summary = { total_items: 0, total_amount: '0.00', currency_symbol: action.payload?.currencySymbol || '$' };
      console.log('[CLEAR_CART]', summary);
      return { ...state, items: [], summary };
    }
    case 'SET_ERROR': console.error('[SET_ERROR]', action.payload); return { ...state, error: action.payload, loading: false };
    case 'CLEAR_ERROR': return { ...state, error: null };
    default: return state;
  }
};

const initialState = { items: [], summary: { total_items: 0, total_amount: '0.00', currency_symbol: '$' }, loading: false, error: null };

export const CartProvider = ({ children }) => {
  const { isLoggedIn, user: authUser } = useContext(AuthContext);
  const { country } = useContext(CountryContext);

  const [state, dispatch] = useReducer(cartReducer, initialState);
  const [exchangeRates, setExchangeRates] = useState({});

  const token = useMemo(() => localStorage.getItem('authToken') || null, [isLoggedIn]);
  const userKey = useMemo(() => {
    const t = localStorage.getItem('authToken') || '';
    const shortTok = t ? `tok:${t.slice(0, 12)}` : 'tok:none';
    if (authUser?.id) return `id:${authUser.id}`;
    if (authUser?.email) return `email:${authUser.email}`;
    return shortTok;
  }, [authUser, isLoggedIn]);

  const ACTIVE_KEY = `guest_cart_${COMPANY_CODE}`;
  const MERGE_FLAG_KEY = `guest_cart_merged_${COMPANY_CODE}_${userKey}`;

  const getAxiosConfig = () => {
    const t = localStorage.getItem('authToken');
    const cfg = { params: { company_code: COMPANY_CODE } };
    if (t) cfg.headers = { Authorization: `Bearer ${t}` };
    return cfg;
  };

  // scan all guest_cart_* keys and combine items 
  const scanAllGuestCarts = () => {
    const combined = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (!k.startsWith('guest_cart_')) continue;
      try {
        const arr = JSON.parse(localStorage.getItem(k) || '[]');
        if (Array.isArray(arr)) {
          console.log('[GuestCart][scan] key:', k, 'len:', arr.length);
          combined.push(...arr);
        }
      } catch (e) {
        console.warn('[GuestCart][scan] parse error for', k, e);
      }
    }
    return combined.map(withSyncedTotals);
  };

  // migrate legacy keys into the active key (run once)
  const migrateGuestCartKeys = () => {
    const all = scanAllGuestCarts();
    if (all.length === 0) {
      console.log('[GuestCart][migrate] nothing to migrate');
      return;
    }
    // keep active items + append any unique items
    const activeRaw = localStorage.getItem(ACTIVE_KEY);
    const active = activeRaw ? JSON.parse(activeRaw) : [];
    const existingKeys = new Set((active || []).map((it) => it.cart_key || buildCartKey(it)));
    const merged = [...active];
    all.forEach((it) => {
      const key = it.cart_key || buildCartKey(it);
      if (!existingKeys.has(key)) {
        merged.push(it);
        existingKeys.add(key);
      }
    });
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(merged));
    console.log('[GuestCart][migrate] merged into ACTIVE_KEY:', ACTIVE_KEY, 'count:', merged.length);
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k) continue;
      if (k.startsWith('guest_cart_') && k !== ACTIVE_KEY) {
      }
    }
  };

  const getGuestCart = () => {
    try {
      const raw = localStorage.getItem(ACTIVE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        console.log('[GuestCart][read] ACTIVE_KEY:', ACTIVE_KEY, 'len:', Array.isArray(parsed) ? parsed.length : 0);
        return Array.isArray(parsed) ? parsed.map(withSyncedTotals) : [];
      }
      // fallback: scan all keys if active empty
      const scanned = scanAllGuestCarts();
      console.log('[GuestCart][fallback-scan] len:', scanned.length);
      return scanned;
    } catch (e) {
      console.error('[GuestCart][read] error ->', e);
      return [];
    }
  };

  const setGuestCart = (cart) => {
    try {
      const safe = (cart || []).map(withSyncedTotals);
      localStorage.setItem(ACTIVE_KEY, JSON.stringify(safe));
      console.log('[GuestCart][write] ACTIVE_KEY:', ACTIVE_KEY, 'len:', safe.length);
    } catch (e) {
      console.error('[GuestCart][write] error ->', e);
    }
  };

  const clearGuestCart = () => {
    console.log('[GuestCart][clear] ACTIVE_KEY:', ACTIVE_KEY);
    localStorage.removeItem(ACTIVE_KEY);
  };

  const getCurrentCurrency = () => {
    const symbol = currencySymbols[country] || '$';
    let rate = 1;
    switch (country) {
      case 'US': rate = 1; break;
      case 'UK': rate = exchangeRates['GBP'] || 0.75; break;
      case 'SL': rate = exchangeRates['LKR'] || 320; break;
      default: rate = 1;
    }
    return { rate, symbol };
  };

  useEffect(() => {
    (async () => {
      try {
        console.log('[Rates] fetching...');
        const res = await axios.get(`${BASE_URL}/api/customer/currency/rates`);
        if (res.data?.success) {
          setExchangeRates(res.data.rates || {});
          console.log('[Rates] ok');
        } else {
          console.warn('[Rates] bad payload', res.data);
        }
      } catch (e) {
        console.error('[Rates] failed -> fallback', e);
        setExchangeRates({ GBP: 0.75, LKR: 320 });
      }
    })();
  }, []);

  useEffect(() => {
    if (state.items.length === 0) return;
    const { rate, symbol } = getCurrentCurrency();
    console.log('[Currency] update', { rate, symbol });
    dispatch({ type: 'UPDATE_CURRENCY', payload: { rate, symbol } });
  }, [country, exchangeRates, state.items]); 

  const formatPrice = (sale_price) => {
    const base = Number(sale_price ?? 0);
    const { rate, symbol } = getCurrentCurrency();
    return `${symbol}${(base * rate).toFixed(2)}`;
  };

  const fetchCartItems = async () => {
    try {
      console.log('[ServerCart] GET /get-cart');
      const res = await axios.get(`${BASE_URL}/api/customer/cart/get-cart`, getAxiosConfig());
      if (res.data?.success) {
        const items = (res.data.cart || []).map(withSyncedTotals);
        const { rate, symbol } = getCurrentCurrency();
        const summary = calculateSummary(items, rate, symbol);
        console.log('[ServerCart] ok', { itemsLen: items.length });
        dispatch({ type: 'SET_CART', payload: { cart: items, summary } });
        return res.data;
      }
      console.warn('[ServerCart] bad payload', res.data);
    } catch (e) {
      console.error('[ServerCart] error', e);
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load cart' });
    }
  };

  // run once at app start to migrate legacy keys into ACTIVE_KEY
  useEffect(() => {
    migrateGuestCartKeys();
  }, []);

  // merge on login (never skip if guest cart exists)
  useEffect(() => {
    (async () => {
      const t = localStorage.getItem('authToken');
      console.log('[AuthEffect]', { isLoggedIn, userKey, hasToken: !!t });
      if (isLoggedIn && t) {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
          const guest = getGuestCart(); 
          const rawFlag = sessionStorage.getItem(MERGE_FLAG_KEY);
          const already = rawFlag === '1';
          console.log('[Merge]', { MERGE_FLAG_KEY, already, guestLen: guest.length });

          if (guest.length > 0) {
            const payload = guest.map((item) => ({
              style_number: item.style_number,
              variant_id: item.variant_id,
              quantity: Number(item.quantity || 0),
              price: getUnitPrice(item),
              product_name: item.product_name || item.name,
              color_name: item.color_name || item.color?.name || null,
              image: item.image || null,
              currency: item.currency || 'USD',
              tax: item.tax || 0.0,
              shipping_fee: item.shipping_fee || 0.0,
              is_available: item.is_available !== undefined ? item.is_available : true,
              sku: item.sku || null,
              size: item.size_name || item.size || null,
            }));
            console.log('[Merge] POST /merge payload', payload);

            try {
              const res = await axios.post(`${BASE_URL}/api/customer/cart/merge`, { guest_cart: payload }, getAxiosConfig());
              console.log('[Merge] response', res.data);
              if (res.data?.success) {
                clearGuestCart();
                sessionStorage.setItem(MERGE_FLAG_KEY, '1');
              } else {
                dispatch({ type: 'SET_ERROR', payload: res.data?.message || 'Failed to merge cart' });
              }
            } catch (e) {
              console.error('[Merge] error', e);
              dispatch({ type: 'SET_ERROR', payload: 'Failed to merge cart' });
            }
          } else {
            if (!already) {
              sessionStorage.setItem(MERGE_FLAG_KEY, '1');
              console.log('[Merge] no guest items -> set flag');
            } else {
              console.log('[Merge] already flagged and still no guest items');
            }
          }

          await fetchCartItems();
        } finally {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        loadMemo();
      }
    })();
  }, [isLoggedIn, userKey]);

  const loadCart = async () => {
    const t = localStorage.getItem('authToken');
    dispatch({ type: 'SET_LOADING', payload: true });
    if (t) await fetchCartItems();
    else loadMemo();
    dispatch({ type: 'SET_LOADING', payload: false });
  };

  const loadMemo = () => {
    const guest = getGuestCart();
    const { rate, symbol } = getCurrentCurrency();
    const items = guest.map(withSyncedTotals);
    const summary = calculateSummary(items, rate, symbol);
    console.log('[MemoCart]', { itemsLen: items.length, summary });
    dispatch({ type: 'SET_CART', payload: { cart: items, summary } });
  };

  const addToCart = async (item) => {
    try {
      if (!item.size || !item.color) throw new Error('Please select size and color');

      const t = localStorage.getItem('authToken');
      const { rate, symbol } = getCurrentCurrency();

      if (t) {
        const res = await axios.post(
          `${BASE_URL}/api/customer/cart/add`,
          {
            style_number: item.style_number,
            quantity: item.quantity || 1,
            price: getUnitPrice(item),
            product_name: item.name,
            sku: item.sku,
            color_name: item.color?.name,
            image: item.image,
            size: item.size,
            customer_id: item.customer_id,
            variant_id: item.variant_id,
          },
          getAxiosConfig()
        );
        if (res.data?.success) { await fetchCartItems(); return { success: true, message: res.data.message }; }
        throw new Error(res.data?.message || 'Failed to add item to cart');
      }

      const current = getGuestCart();
      const unitPrice = getUnitPrice(item);
      
      // Safely handle stock information without making unsafe assumptions
      const stockQty = item.stock_qty !== undefined ? Number(item.stock_qty) : undefined;
      const isAvailable = item.is_available !== undefined ? item.is_available : true;
      
      const cartItem = withSyncedTotals({
        cart_id: `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        cart_key: buildCartKey(item),
        style_number: item.style_number,
        style_id: item.style_id,
        product_name: item.name,
        description: item.description,
        image: item.image,
        sale_price: unitPrice,
        price: unitPrice,
        unit_price: unitPrice,
        quantity: item.quantity || 1,
        stock_qty: stockQty, 
        sku: item.sku,
        color_name: item.color?.name,
        color_code: item.color?.code,
        size_name: item.size,
        material_name: item.material_name,
        fit_name: item.fit_name,
        exchangeRate: rate,
        currencySymbol: symbol,
        variant_id: item.variant_id,
        product_url: item.product_url,
        tax: item.tax || 0.0,
        shipping_fee: item.shipping_fee || 0.0,
        is_available: isAvailable,
        size: item.size,
        color: item.color,
      });

      const idx = current.findIndex((gc) => String(gc.cart_key) === String(cartItem.cart_key));
      const next = idx >= 0
        ? current.map((gc, i) => i === idx ? withSyncedTotals({ ...gc, quantity: Number(gc.quantity || 0) + Number(cartItem.quantity || 1) }) : gc)
        : [...current, cartItem];

      setGuestCart(next);
      dispatch({ type: 'ADD_TO_CART', payload: { newItem: cartItem, exchangeRate: rate, currencySymbol: symbol } });
      return { success: true, message: 'Item added to cart successfully' };
    } catch (error) {
      const msg = error.response?.data?.message || error.message || 'Failed to add item to cart';
      dispatch({ type: 'SET_ERROR', payload: msg });
      throw error;
    }
  };

  const updateQuantity = async (cart_id, quantity) => {
    try {
      const t = localStorage.getItem('authToken');
      const { rate, symbol } = getCurrentCurrency();

      if (t) {
        const res = await axios.put(`${BASE_URL}/api/customer/cart/${cart_id}`, { quantity }, getAxiosConfig());
        if (res.data?.success) { await fetchCartItems(); return { success: true, message: res.data.message }; }
        dispatch({ type: 'SET_ERROR', payload: res.data.message });
        return { success: false, message: res.data.message };
      }

      const current = getGuestCart();
      const idx = current.findIndex((it) => String(it.cart_id) === String(cart_id));
      if (idx === -1) return { success: false, message: 'Item not found in cart' };
      const updated = withSyncedTotals({ ...current[idx], quantity: Number(quantity) });
      const next = [...current]; next[idx] = updated; setGuestCart(next);
      dispatch({ type: 'UPDATE_QUANTITY', payload: { cart_id, quantity, exchangeRate: rate, currencySymbol: symbol } });
      return { success: true, message: 'Cart updated successfully' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to update cart';
      dispatch({ type: 'SET_ERROR', payload: msg });
      return { success: false, message: msg };
    }
  };

  const removeFromCart = async (cart_id) => {
    try {
      const t = localStorage.getItem('authToken');
      const { rate, symbol } = getCurrentCurrency();

      if (t) {
        const res = await axios.delete(`${BASE_URL}/api/customer/cart/${cart_id}`, getAxiosConfig());
        if (res.data?.success) { await fetchCartItems(); return { success: true, message: res.data.message }; }
        dispatch({ type: 'SET_ERROR', payload: res.data.message });
        return { success: false, message: res.data.message };
      }

      const current = getGuestCart();
      const next = current.filter((it) => String(it.cart_id) !== String(cart_id));
      setGuestCart(next);
      dispatch({ type: 'REMOVE_FROM_CART', payload: { cart_id, exchangeRate: rate, currencySymbol: symbol } });
      return { success: true, message: 'Item removed from cart successfully' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to remove item from cart';
      dispatch({ type: 'SET_ERROR', payload: msg });
      return { success: false, message: msg };
    }
  };

  const removeMultipleFromCart = async (cart_ids) => {
    try {
      const t = localStorage.getItem('authToken');
      const { rate, symbol } = getCurrentCurrency();

      if (t) {
        // Remove multiple items from server cart
        const promises = cart_ids.map(cart_id => 
          axios.delete(`${BASE_URL}/api/customer/cart/${cart_id}`, getAxiosConfig())
        );
        
        const results = await Promise.allSettled(promises);
        const failures = results.filter(result => result.status === 'rejected');
        
        if (failures.length === 0) {
          await fetchCartItems();
          return { success: true, message: 'Selected items removed from cart successfully' };
        } else {
          dispatch({ type: 'SET_ERROR', payload: 'Some items could not be removed' });
          return { success: false, message: 'Some items could not be removed' };
        }
      }

      // For guest cart
      const current = getGuestCart();
      const next = current.filter((it) => !cart_ids.includes(String(it.cart_id)));
      setGuestCart(next);
      
      // Dispatch remove action for each item
      cart_ids.forEach(cart_id => {
        dispatch({ type: 'REMOVE_FROM_CART', payload: { cart_id, exchangeRate: rate, currencySymbol: symbol } });
      });
      
      return { success: true, message: 'Selected items removed from cart successfully' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to remove selected items from cart';
      dispatch({ type: 'SET_ERROR', payload: msg });
      return { success: false, message: msg };
    }
  };

  const clearCart = async () => {
    try {
      const t = localStorage.getItem('authToken');
      const { symbol } = getCurrentCurrency();

      if (t) {
        const res = await axios.delete(`${BASE_URL}/api/customer/cart/clear-all`, getAxiosConfig());
        if (res.data?.success) { await fetchCartItems(); return { success: true, message: res.data.message }; }
        dispatch({ type: 'SET_ERROR', payload: res.data.message });
        return { success: false, message: res.data.message };
      }

      clearGuestCart();
      dispatch({ type: 'CLEAR_CART', payload: { currencySymbol: symbol } });
      return { success: true, message: 'Cart cleared successfully' };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to clear cart';
      dispatch({ type: 'SET_ERROR', payload: msg });
      return { success: false, message: msg };
    }
  };

  const mergeCartOnLogin = async () => {
    try {
      const t = localStorage.getItem('authToken');
      if (!t) return { success: false, message: 'Not logged in' };
      const guest = getGuestCart();
      if (guest.length === 0) { await fetchCartItems(); sessionStorage.setItem(MERGE_FLAG_KEY, '1'); return { success: true, message: 'No guest cart to merge' }; }
      const payload = guest.map((item) => ({
        style_number: item.style_number,
        variant_id: item.variant_id,
        quantity: Number(item.quantity || 0),
        price: getUnitPrice(item),
        product_name: item.product_name || item.name,
        color_name: item.color_name || item.color?.name || null,
        image: item.image || null,
        currency: item.currency || 'USD',
        product_url: item.product_url || null,
        tax: item.tax || 0.0,
        shipping_fee: item.shipping_fee || 0.0,
        is_available: item.is_available !== undefined ? item.is_available : true,
        sku: item.sku || null,
        size: item.size_name || item.size || null,
      }));
      const res = await axios.post(`${BASE_URL}/api/customer/cart/merge`, { guest_cart: payload }, getAxiosConfig());
      if (res.data?.success) { clearGuestCart(); sessionStorage.setItem(MERGE_FLAG_KEY, '1'); await fetchCartItems(); return { success: true, message: res.data.message }; }
      dispatch({ type: 'SET_ERROR', payload: res.data.message }); return { success: false, message: res.data.message };
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to merge cart';
      dispatch({ type: 'SET_ERROR', payload: msg }); return { success: false, message: msg };
    }
  };

  const clearError = () => dispatch({ type: 'CLEAR_ERROR' });

  const value = {
    cart: state.items,
    summary: state.summary,
    loading: state.loading,
    error: state.error,
    addToCart,
    updateQuantity,
    removeFromCart,
    removeMultipleFromCart,
    clearCart,
    loadCart,
    mergeCartOnLogin,
    clearError,
    formatPrice,
    getCurrentCurrency,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (ctx === undefined) throw new Error('useCart must be used within a CartProvider');
  return ctx;
};

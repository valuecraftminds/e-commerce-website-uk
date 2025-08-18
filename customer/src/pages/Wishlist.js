import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { BsTrash3 } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';

import '../styles/Wishlist.css';
import { CountryContext } from "../context/CountryContext";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const Wishlist = () => {
    const navigate = useNavigate();
    const [exchangeRates, setExchangeRates] = useState({});

    const currencySymbols = { US: '$', UK: '£', SL: 'LKR' };
    const { country } = useContext(CountryContext);

    const [wishlistItems, setWishlistItems] = useState([]);

    // Get auth token from logged-in user
    const getAuthToken = () => {
        return localStorage.getItem('authToken');
    };

    // Axios config with auth token
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

    const handleRedirect = (style_id) => {
        navigate(`/product/${style_id}`);
    };

    // Fetch wishlist
    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const config = getAxiosConfig();
                const response = await axios.get(
                    `${BASE_URL}/api/customer/wishlist/get-wishlist`,
                    config
                );
                setWishlistItems(response.data);
                console.log('Wishlist fetched:', response.data);
            } catch (error) {
                console.error('Error fetching wishlist:', error);
            }
        };

        fetchWishlist();
    }, []);

    // Remove item from wishlist
    const handleRemove = async (style_code) => {
        try {
            const config = getAxiosConfig();
            await axios.delete(
                `${BASE_URL}/api/customer/wishlist/remove`,
                {
                    ...config,
                    data: { style_code: style_code }
                }
            );
            console.log('style_code:', style_code);
            setWishlistItems(prev => prev.filter(item => item.style_code !== style_code));
            console.log('Item removed from wishlist:', style_code);
        } catch (error) {
            console.error('Error removing wishlist item:', error);
        }
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

    const formatPrice = (minPrice) => {
        if (!minPrice) return "Price not defined";
        const symbol = currencySymbols[country] || '$';
        const rate = getRate();
        const convertedPrice = (minPrice * rate).toFixed(2);
        return `${symbol}${convertedPrice}`;
    };
    
    return (
        <div className="wishlist-page">
            <h1>Your Wishlist</h1>
            <div className="wishlist-grid">
                {wishlistItems.map((item) => (
                    <div 
                        className="wishlist-item" 
                        key={item.style_id}
                        
                    >
                        <img
                            src={`${BASE_URL}/uploads/styles/${item.image}`}
                            alt={item.name}
                            onClick={() => handleRedirect(item.style_id)} 
                        />
                        <h2>{item.name}</h2>
                        <p className="wishlist-description">{item.description}</p>

                        <div className="wishlist-price-row">
                            {/*<span className="wishlist-price">{formatPrice(item.price)}</span>*/}
                            <button
                                className="remove-btn"
                                onClick={() => {
                                    if(window.confirm("Are you sure you want to remove this item from your wishlist?")) {
                                        handleRemove(item.style_code);
                                    }
                                }}
                            >
                                <BsTrash3 className="wishlist-bin" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Wishlist;

import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { BsTrash3 } from "react-icons/bs";
import { useNavigate } from 'react-router-dom';

import '../styles/Wishlist.css';
import { useNotifyModal } from "../context/NotifyModalProvider";
import BackToTop from "../components/BackToTop";

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';
const COMPANY_CODE = process.env.REACT_APP_COMPANY_CODE;

const Wishlist = () => {
    const navigate = useNavigate();
    const { showNotify } = useNotifyModal();
    const [wishlistItems, setWishlistItems] = useState([]);

    // Get auth token from logged-in user
    const getAuthToken = () => {
        return localStorage.getItem('authToken');
    };

    // Axios config with auth token
    const getAxiosConfig = useCallback(() => {
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
    }, []);

    const handleRedirect = (style_number)  => {
        navigate(`/product/${style_number}`);
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
            } catch (error) {
                console.error('Error fetching wishlist:', error);
            }
        };

        fetchWishlist();
    }, [getAxiosConfig]);

    // Remove item from wishlist
    const handleRemove = async (style_number) => {
        showNotify({
            title: "Removing Item",
            message: "Are you sure you want to remove this item from the Wishlist?",
            type: "warning",
            customButtons: [
                {
                    label: "Yes, Remove",
                    onClick: async () => {
                        try {
                            const config = getAxiosConfig();
                            await axios.delete(
                                `${BASE_URL}/api/customer/wishlist/remove`,
                                {
                                    ...config,
                                    data: {style_number: style_number}
                                }
                            );
                            setWishlistItems(prev => prev.filter(item => item.style_number !== style_number));
                        } catch (error) {
                            console.error('Error removing wishlist item:', error);
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

    return (
        <div className="wishlist-page">
            <h1>Wishlist</h1>
            <div className="wishlist-grid">
                {wishlistItems.map((item) => (
                    <div 
                        className="wishlist-item" 
                        key={item.style_number}
                    >
                        <div className="wishlist-image-container">
                            <img
                                src={`${BASE_URL}/uploads/styles/${item.image}`}
                                alt={item.name}
                                onClick={() => handleRedirect(item.style_number)} 
                            />
                        </div>
                        <div className="wishlist-item-info">
                            <h2>{item.name}</h2>
                            <p className="wishlist-description">{item.description}</p>

                            <div className="wishlist-footer-row">
                                <button
                                    className="remove-btn"
                                    onClick={() => handleRemove(item.style_number)}
                                >
                                    <BsTrash3 className="wishlist-bin" />
                                    <span className="remove-text">Remove</span>
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
            
            <BackToTop />
        </div>
    );
};

export default Wishlist;

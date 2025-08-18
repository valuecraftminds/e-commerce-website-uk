import React, { createContext, useContext, useState } from 'react';
import NotifyModal from '../components/NotifyModal';

const NotifyModalContext = createContext();

export const NotifyModalProvider = ({ children }) => {
    const [modalState, setModalState] = useState({
        show: false,
        title: '',
        message: '',
        type: 'success',
        showGoToCart: false,
        customButtons: [],
        onGoToCart: null
    });

    const showNotify = (options) => {
        setModalState({
            show: true,
            title: options.title || '',
            message: options.message || '',
            type: options.type || 'success',
            showGoToCart: options.showGoToCart || false,
            customButtons: options.customButtons || [],
            onGoToCart: options.onGoToCart || null
        });
    };

    const hideNotify = () => {
        setModalState(prev => ({ ...prev, show: false }));
    };

    const showSuccess = (message, options = {}) => {
        showNotify({
            message,
            type: 'success',
            title: options.title || 'Success!',
            ...options
        });
    };

    const showError = (message, options = {}) => {
        showNotify({
            message,
            type: 'error',
            title: options.title || 'Error!',
            ...options
        });
    };

    const showWarning = (message, options = {}) => {
        showNotify({
            message,
            type: 'warning',
            title: options.title || 'Warning!',
            ...options
        });
    };

    const showInfo = (message, options = {}) => {
        showNotify({
            message,
            type: 'info',
            title: options.title || 'Information',
            ...options
        });
    };

    const showCartSuccess = (message) => {
        showNotify({
            message,
            type: 'success',
            title: 'Added to Cart!',
            showGoToCart: true
        });
    };

    return (
        <NotifyModalContext.Provider value={{
            showNotify,
            hideNotify,
            showSuccess,
            showError,
            showWarning,
            showInfo,
            showCartSuccess
        }}>
            {children}
            <NotifyModal
                show={modalState.show}
                title={modalState.title}
                message={modalState.message}
                type={modalState.type}
                showGoToCart={modalState.showGoToCart}
                customButtons={modalState.customButtons}
                onClose={hideNotify}
                onGoToCart={modalState.onGoToCart}
            />
        </NotifyModalContext.Provider>
    );
};

export const useNotifyModal = () => {
    const context = useContext(NotifyModalContext);
    if (!context) {
        throw new Error('useNotifyModal must be used within NotifyModalProvider');
    }
    return context;
};
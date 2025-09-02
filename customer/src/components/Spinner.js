import React from 'react';
import { FaSpinner } from 'react-icons/fa';
import '../styles/Spinner.css';

const Spinner = ({ text = 'Loading...' }) => (
  <div className="spinner-container">
    <FaSpinner className="spinner-icon" />
    <span className="spinner-text">{text}</span>
  </div>
);

export default Spinner;

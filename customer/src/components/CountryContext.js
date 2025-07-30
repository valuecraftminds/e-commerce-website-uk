import React, { createContext, useState } from "react";

export const CountryContext = createContext();

export const CountryProvider = ({ children }) => {
  const [country, setCountry] = useState(() => localStorage.getItem('selectedCountry') || 'US');

  return (
    <CountryContext.Provider value={{ country, setCountry }}>
      {children}
    </CountryContext.Provider>
  );
};

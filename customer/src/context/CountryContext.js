import React, { createContext, useState } from "react";

export const CountryContext = createContext();

export const CountryProvider = ({ children }) => {
  const [country, setCountry] = useState(() => localStorage.getItem('selectedCountry') || 'US');

  const changeCountry = (newCountry) => {
    localStorage.setItem('selectedCountry', newCountry);
    setCountry(newCountry);
  };

  return (
    <CountryContext.Provider value={{ country, setCountry: changeCountry }}>
      {children}
    </CountryContext.Provider>
  );
};

import { createContext, useContext, useState } from 'react';

const OfferContext = createContext(null);

export function OfferProvider({ children }) {
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loanId, setLoanId] = useState(null);

  const selectOfferWithLoanId = (offer) => {
    const newLoanId = 'LN-' + Date.now().toString().slice(-6);
    setLoanId(newLoanId);
    setSelectedOffer(offer);
  };

  const value = {
    selectedOffer,
    setSelectedOffer: selectOfferWithLoanId,
    loanId,
    hasSelectedOffer: !!selectedOffer,
  };

  return (
    <OfferContext.Provider value={value}>
      {children}
    </OfferContext.Provider>
  );
}

export function useOffer() {
  const context = useContext(OfferContext);
  if (!context) {
    throw new Error('useOffer must be used within an OfferProvider');
  }
  return context;
}

export default OfferContext;

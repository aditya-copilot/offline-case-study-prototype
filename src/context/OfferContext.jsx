import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const OfferContext = createContext(null);

const STORAGE_KEY = 'hypercredit_offer_state';

// Helper to safely access localStorage
const getStoredState = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Check if data is not older than 1 hour
      if (parsed.timestamp && Date.now() - parsed.timestamp < 3600000) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.warn('Failed to load from localStorage:', error);
  }
  return null;
};

const setStoredState = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.warn('Failed to save to localStorage:', error);
  }
};

const clearStoredState = () => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn('Failed to clear localStorage:', error);
  }
};

export function OfferProvider({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [loanId, setLoanId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [productType, setProductType] = useState(null);
  const [userFormData, setUserFormData] = useState(null);
  const [mandateSetup, setMandateSetup] = useState(false);
  const [mandateDetails, setMandateDetails] = useState(null);
  const [ckycVerified, setCkycVerified] = useState(false);

  // Hydrate state from localStorage on mount
  useEffect(() => {
    const stored = getStoredState();
    if (stored) {
      setSelectedOffer(stored.selectedOffer || null);
      setLoanId(stored.loanId || null);
      setSelectedProduct(stored.selectedProduct || null);
      setProductType(stored.productType || null);
      setUserFormData(stored.userFormData || null);
      setMandateSetup(stored.mandateSetup || false);
      setMandateDetails(stored.mandateDetails || null);
      setCkycVerified(stored.ckycVerified || false);
    }
    setIsHydrated(true);
  }, []);

  // Persist state to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      setStoredState({
        selectedOffer,
        loanId,
        selectedProduct,
        productType,
        userFormData,
        mandateSetup,
        mandateDetails,
        ckycVerified
      });
    }
  }, [selectedOffer, loanId, selectedProduct, productType, userFormData, mandateSetup, mandateDetails, ckycVerified, isHydrated]);

  const selectOfferWithLoanId = useCallback((offer) => {
    const newLoanId = 'LN-' + Date.now().toString().slice(-6);
    setLoanId(newLoanId);
    setSelectedOffer(offer);
  }, []);

  const selectProduct = useCallback((product, type = 'electronics') => {
    setSelectedProduct(product);
    setProductType(type);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedOffer(null);
    setLoanId(null);
    setSelectedProduct(null);
    setProductType(null);
    setUserFormData(null);
    setMandateSetup(false);
    setMandateDetails(null);
    setCkycVerified(false);
    clearStoredState();
  }, []);

  const saveUserFormData = useCallback((formData) => {
    setUserFormData(formData);
  }, []);

  const completeMandate = useCallback((details) => {
    setMandateSetup(true);
    if (details) {
      setMandateDetails(details);
    }
  }, []);

  const completeCKYC = useCallback(() => {
    setCkycVerified(true);
  }, []);

  const resetMandate = useCallback(() => {
    setMandateSetup(false);
    setMandateDetails(null);
  }, []);

  // Helper to get current state summary for debugging
  const getStateSummary = useCallback(() => ({
    hasOffer: !!selectedOffer,
    hasLoanId: !!loanId,
    hasProduct: !!selectedProduct,
    productType,
    isHydrated
  }), [selectedOffer, loanId, selectedProduct, productType, isHydrated]);

  const value = {
    selectedOffer,
    setSelectedOffer: selectOfferWithLoanId,
    loanId,
    hasSelectedOffer: !!selectedOffer,
    selectedProduct,
    productType,
    selectProduct,
    clearSelection,
    userFormData,
    saveUserFormData,
    isHydrated,
    getStateSummary,
    mandateSetup,
    mandateDetails,
    ckycVerified,
    completeMandate,
    completeCKYC,
    resetMandate
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

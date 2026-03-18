export type {
  LoanOffer,
  UserFormData,
  LoanApplicationState,
  EMICalculation,
  CKYCData,
  MandateDetails,
  LoanStep
} from './types';

export {
  calculateEMI,
  generateDynamicOffers,
  LOAN_STEPS
} from './types';

export {
  useLoanStore,
  useSelectedProduct,
  useSelectedOffer,
  useCurrentStep,
  useAvailableOffers,
  useEMICalculation,
  useUserFormData,
  useLoanProgress,
  useLoanActions
} from './store';

export { DynamicOffersScreen } from './screens/DynamicOffersScreen';
export { UserInputPage } from './screens/UserInputPage';
export { CKYCPage } from './screens/CKYCPage';
export { AgreementPage } from './screens/AgreementPage';
export { MandatePage } from './screens/MandatePage';
export { LoanApprovedPage } from './screens/LoanApprovedPage';
export { InvoicePage } from './screens/InvoicePage';
export { DisbursedPage } from './screens/DisbursedPage';

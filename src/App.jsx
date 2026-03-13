import { BrowserRouter as Router, Routes, Route, NavLink, Navigate } from 'react-router-dom'
import { OfferProvider } from './context/OfferContext'
import AIChatWidget from './Components/AIChatWidget'
import InstantEMIForm from './Components/InstantEMIForm'
import VoiceChatbot from './Components/StickyChat'
import OffersScreen from './screens/OffersScreen'
import CYKCPage from './screens/CYKCPage'
import MandatePage from './screens/MandatePage'
import KFSPage from './screens/KFSPage'
import LoanApprovedPage from './screens/LoanApprovedPage'
import InvoicePage from './screens/InvoicePage'
import DisbursedPage from './screens/DisbursedPage'
import './App.css'

function App() {
  return (
    <OfferProvider>
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/offer" element={<OffersScreen />} />
            <Route path="/cykc" element={<CYKCPage />} />
            <Route path="/mandate" element={<MandatePage />} />
            <Route path="/kfs" element={<KFSPage />} />
            <Route path="/approved" element={<LoanApprovedPage />} />
            <Route path="/invoice" element={<InvoicePage />} />
            <Route path="/disbursed" element={<DisbursedPage />} />
            <Route path="/*" element={<AIChatWidget />} />
          </Routes>
        </div>
      </Router>
    </OfferProvider>
  )
}

export default App

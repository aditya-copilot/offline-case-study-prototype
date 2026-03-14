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
          {/* Animated showroom background elements */}
          <div className="light-rays" />
          <div className="bike-animation-layer">
            {/* Motorcycle with rider 1 - going right */}
            <svg className="bike-silhouette bike-1" viewBox="0 0 100 70" fill="currentColor">
              <ellipse cx="45" cy="18" rx="8" ry="9" />
              <path d="M37 27 L42 45 L54 45 L52 28 Z" />
              <path d="M42 45 L35 60 L30 62" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M54 45 L65 58 L70 58" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M40 32 L55 38 L68 35" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <circle cx="45" cy="14" r="9" />
              <path d="M15 55 L25 40 L45 38 L60 42 L75 50 L80 55" fill="currentColor"/>
              <circle cx="22" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
              <circle cx="78" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
            {/* Motorcycle with rider 2 - going diagonal up reverse */}
            <svg className="bike-silhouette bike-2" viewBox="0 0 100 70" fill="currentColor">
              <ellipse cx="45" cy="18" rx="8" ry="9" />
              <path d="M37 27 L42 45 L54 45 L52 28 Z" />
              <path d="M42 45 L35 60 L30 62" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M54 45 L65 58 L70 58" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M40 32 L55 38 L68 35" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <circle cx="45" cy="14" r="9" />
              <path d="M15 55 L25 40 L45 38 L60 42 L75 50 L80 55" fill="currentColor"/>
              <circle cx="22" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
              <circle cx="78" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
            {/* Motorcycle with rider 3 - going right */}
            <svg className="bike-silhouette bike-3" viewBox="0 0 100 70" fill="currentColor">
              <ellipse cx="45" cy="18" rx="8" ry="9" />
              <path d="M37 27 L42 45 L54 45 L52 28 Z" />
              <path d="M42 45 L35 60 L30 62" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M54 45 L65 58 L70 58" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M40 32 L55 38 L68 35" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <circle cx="45" cy="14" r="9" />
              <path d="M15 55 L25 40 L45 38 L60 42 L75 50 L80 55" fill="currentColor"/>
              <circle cx="22" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
              <circle cx="78" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
            {/* Motorcycle with rider 4 - going zigzag reverse */}
            <svg className="bike-silhouette bike-4 bike-reverse" viewBox="0 0 100 70" fill="currentColor">
              <ellipse cx="45" cy="18" rx="8" ry="9" />
              <path d="M37 27 L42 45 L54 45 L52 28 Z" />
              <path d="M42 45 L35 60 L30 62" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M54 45 L65 58 L70 58" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M40 32 L55 38 L68 35" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <circle cx="45" cy="14" r="9" />
              <path d="M15 55 L25 40 L45 38 L60 42 L75 50 L80 55" fill="currentColor"/>
              <circle cx="22" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
              <circle cx="78" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
            {/* Motorcycle with rider 5 - going right (diagonal down) */}
            <svg className="bike-silhouette bike-5" viewBox="0 0 100 70" fill="currentColor">
              <ellipse cx="45" cy="18" rx="8" ry="9" />
              <path d="M37 27 L42 45 L54 45 L52 28 Z" />
              <path d="M42 45 L35 60 L30 62" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M54 45 L65 58 L70 58" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M40 32 L55 38 L68 35" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <circle cx="45" cy="14" r="9" />
              <path d="M15 55 L25 40 L45 38 L60 42 L75 50 L80 55" fill="currentColor"/>
              <circle cx="22" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
              <circle cx="78" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
            {/* Motorcycle with rider 6 - going left (diagonal up) */}
            <svg className="bike-silhouette bike-6 bike-reverse" viewBox="0 0 100 70" fill="currentColor">
              <ellipse cx="45" cy="18" rx="8" ry="9" />
              <path d="M37 27 L42 45 L54 45 L52 28 Z" />
              <path d="M42 45 L35 60 L30 62" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M54 45 L65 58 L70 58" stroke="currentColor" strokeWidth="5" fill="none" strokeLinecap="round"/>
              <path d="M40 32 L55 38 L68 35" stroke="currentColor" strokeWidth="4" fill="none" strokeLinecap="round"/>
              <circle cx="45" cy="14" r="9" />
              <path d="M15 55 L25 40 L45 38 L60 42 L75 50 L80 55" fill="currentColor"/>
              <circle cx="22" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
              <circle cx="78" cy="58" r="10" stroke="currentColor" strokeWidth="3" fill="none"/>
            </svg>
          </div>
          <Routes>
            <Route path="/" element={<Navigate to="/chat" replace />} />
            <Route path="/chat" element={<AIChatWidget />} />
            <Route path="/chat/conversation" element={<AIChatWidget />} />
            <Route path="/offer" element={<OffersScreen />} />
            <Route path="/cykc" element={<CYKCPage />} />
            <Route path="/mandate" element={<MandatePage />} />
            <Route path="/kfs" element={<KFSPage />} />
            <Route path="/approved" element={<LoanApprovedPage />} />
            <Route path="/invoice" element={<InvoicePage />} />
            <Route path="/disbursed" element={<DisbursedPage />} />
          </Routes>
        </div>
      </Router>
    </OfferProvider>
  )
}

export default App

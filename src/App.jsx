import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import AIChatWidget from './components/AIChatWidget'
import OffersScreen from './screens/OffersScreen'
import './App.css'

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="app-nav">
          <NavLink to="/" className="nav-link" end>Chat</NavLink>
          <NavLink to="/offers" className="nav-link">Offers</NavLink>
        </nav>
        <Routes>
          <Route path="/" element={<AIChatWidget />} />
          <Route path="/offers" element={<OffersScreen />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App

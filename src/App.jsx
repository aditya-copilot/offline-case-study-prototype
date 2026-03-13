import { BrowserRouter, Routes, Route, Router, NavLink } from 'react-router-dom'
import AIChatWidget from './components/AIChatWidget'
import InstantEMIForm from './components/InstantEMIForm'
import VoiceChatbot from './Components/StickyChat'
import OffersScreen from './screens/OffersScreen'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AIChatWidget />
    </BrowserRouter>
  )
}

export default App

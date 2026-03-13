import { BrowserRouter, Routes, Route, Router, NavLink } from 'react-router-dom'
import AIChatWidget from './Components/AIChatWidget'
import InstantEMIForm from './Components/InstantEMIForm'
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

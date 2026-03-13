import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AIChatWidget from './components/AIChatWidget'
import InstantEMIForm from './components/InstantEMIForm'
import VoiceChatbot from './Components/StickyChat'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <AIChatWidget />
    </BrowserRouter>
  )
}

export default App

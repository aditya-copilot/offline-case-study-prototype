import { useState, useRef, useEffect, useCallback } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { OfferProvider } from './context/OfferContext'
import { ToastProvider } from './context/ToastContext'
import ErrorBoundary from './Components/ErrorBoundary'
import ProgressBar from './Components/ProgressBar'
import ProductCatalog from './screens/ProductCatalog'
import BikeShowroom from './screens/bike/BikeShowroom'
import AIChatWidget from './Components/AIChatWidget'
import TwoWheelerChatWidget from './Components/bike/TwoWheelerChatWidget'
import OffersScreen from './screens/OffersScreen'
import CYKCPage from './screens/CYKCPage'
import MandatePage from './screens/MandatePage'
import KFSPage from './screens/KFSPage'
import LoanApprovedPage from './screens/LoanApprovedPage'
import InvoicePage from './screens/InvoicePage'
import DisbursedPage from './screens/DisbursedPage'
import NotFoundPage from './screens/NotFoundPage'
import ChatBot from './Components/ChatBot.jsx'
import './App.css'

const APP_MODE = import.meta.env.VITE_APP_MODE || 'electronics'
const IS_BIKE_MODE = APP_MODE === 'bike'
const IS_ELECTRONICS_MODE = APP_MODE === 'electronics'

function extractJSON(text) {
  const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!match) return null;
  try {
    return JSON.parse(match[0]);
  } catch (e) {
    return null;
  }
}

function removeEmojis(text) {
  return text.replace(/\p{Emoji}/gu, '');
}
function normalizeForTTS(text) {
  if (!text || typeof text !== 'string') return '';
  let normalized = text
    .replace(/₹/g, ' rupees ')
    .replace(/%/g, ' percent ')
    .replace(/\u00A0/g, ' ') // non-breaking spaces
    .replace(/,/g, '')
    .replace(/(\d+)\.(\d+)/g, '$1 point $2')
    .replace(/\s+/g, ' ')
    .trim();

  // Expand numbers like 12000 to 12 000 (or simply keep as digits) before speak.
  normalized = normalized.replace(/\b(\d{1,3})(\d{3})\b/g, '$1 $2');

  return normalized;
}
function speakText(text) {
  const normalizedText = normalizeForTTS(text);
  console.log('Attempting to speak text:', normalizedText);
  if (!("speechSynthesis" in window)) {
    console.error('TTS not supported in this browser');
    return;
  }

  const utterance = new SpeechSynthesisUtterance(normalizedText);
  utterance.lang = 'en-US';
  utterance.rate = 1.2;      // speed (0.1 - 10)
  utterance.pitch = 1;       // tone (0 - 2)
  utterance.volume = 1;      // volume (0 - 1)

  window.speechSynthesis.speak(utterance);
}

function Navigation() {
  const location = useLocation()
  
  if (IS_BIKE_MODE || IS_ELECTRONICS_MODE) {
    return null
  }
  
  const navItems = [
    { path: '/', label: 'Electronics', icon: '📱' },
    { path: '/showroom', label: '2-Wheeler Showroom', icon: '🏍️' },
  ]
  
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/checkout' || location.pathname.includes('user-input')
    }
    return location.pathname.startsWith(path)
  }
  
  return (
    <nav className="app-navigation">
      <div className="nav-brand">
        <span className="nav-logo">🏪</span>
        <span className="nav-title">HyperCredit</span>
      </div>
      <div className="nav-links">
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            className={`nav-link ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

function AppContent({ 
  messages, inputMode, speechSupported, uploadedImage, fileInputRef, 
  handleImageUpload, message, handleKeyPress, handleSend, setInputMode, 
  isListening, toggleListening, isTyping, messagesEndRef, setMessage, 
  toolCallUtils 
}) {
  const location = useLocation()
  const showProgress = ['/offer', '/cykc', '/mandate', '/kfs', '/approved', '/invoice', '/disbursed'].some(path =>
    location.pathname.includes(path)
  )
  
  return (
    <div className={`app-container ${IS_BIKE_MODE || IS_ELECTRONICS_MODE ? 'single-mode' : ''}`}>
      <Navigation />
      {showProgress && <ProgressBar />}
      <div className="app-content">
        <Routes>
          <Route path="/offer" element={<OffersScreen toolCallUtils={toolCallUtils} />} />
          <Route path="/cykc" element={<CYKCPage toolCallUtils={toolCallUtils} />} />
          <Route path="/mandate" element={<MandatePage toolCallUtils={toolCallUtils} />} />
          <Route path="/kfs" element={<KFSPage toolCallUtils={toolCallUtils} />} />
          <Route path="/approved" element={<LoanApprovedPage toolCallUtils={toolCallUtils} />} />
          <Route path="/invoice" element={<InvoicePage toolCallUtils={toolCallUtils} />} />
          <Route path="/disbursed" element={<DisbursedPage toolCallUtils={toolCallUtils} />} />
          
          {IS_BIKE_MODE ? (
            <>
              <Route path="/chat" element={<TwoWheelerChatWidget toolCallUtils={toolCallUtils} />} />
              <Route path="/checkout/user-input" element={<AIChatWidget toolCallUtils={toolCallUtils} />} />
              <Route path="/" element={<BikeShowroom toolCallUtils={toolCallUtils} />} />
              <Route path="*" element={<NotFoundPage />} />
            </>
          ) : IS_ELECTRONICS_MODE ? (
            <>
              <Route path="/chat" element={<AIChatWidget toolCallUtils={toolCallUtils} />} />
              <Route path="/checkout/user-input" element={<AIChatWidget toolCallUtils={toolCallUtils} />} />
              <Route path="/" element={<ProductCatalog toolCallUtils={toolCallUtils} />} />
              <Route path="*" element={<NotFoundPage />} />
            </>
          ) : (
            <>
              <Route path="/showroom/*" element={<TwoWheelerChatWidget toolCallUtils={toolCallUtils} />} />
              <Route path="/chat" element={<AIChatWidget toolCallUtils={toolCallUtils} />} />
              <Route path="/" element={<ProductCatalog toolCallUtils={toolCallUtils} />} />
              <Route path="*" element={<NotFoundPage />} />
            </>
          )}
        </Routes>
      </div>
      <ChatBot 
        messages={messages} 
        inputMode={inputMode} 
        speechSupported={speechSupported} 
        uploadedImage={uploadedImage} 
        fileInputRef={fileInputRef} 
        handleImageUpload={handleImageUpload} 
        message={message} 
        handleKeyPress={handleKeyPress} 
        handleSend={handleSend} 
        setInputMode={setInputMode} 
        isListening={isListening} 
        toggleListening={toggleListening} 
        isTyping={isTyping} 
        messagesEndRef={messagesEndRef}
        setMessage={setMessage}
      />
    </div>
  )
}

function App() {
  const [messages, setMessages] = useState([])
  const [isTyping, setIsTyping] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef(null)
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)
  const [uploadedImage, setUploadedImage] = useState(null)
  const fileInputRef = useRef(null)
  const [speechSupported, setSpeechSupported] = useState(true)
  const [inputMode, setInputMode] = useState('text')
  const inputModeRef = useRef('text')

  const toolCallUtils = {
    getFullPrompt: (text) => text,
    getDisplayResponse: (res) => res,
    handleResponse: (res) => res 
  }

  useEffect(() => {
    console.log("Input mode changed:", inputMode)
    inputModeRef.current = inputMode;
    if(inputMode != 'speech'){
      setIsListening(false)
    }
  }, [inputMode])

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
      recognitionRef.current.continuous = false
      recognitionRef.current.interimResults = true
      recognitionRef.current.lang = 'en-US'

      recognitionRef.current.onresult = (event) => {
        console.log("Speech recognition result received:", event)
        const current = event.resultIndex
        const transcriptText = event.results[current][0].transcript

        if (event.results[current].isFinal) {
            sendMessage(transcriptText)
        }
      }

      recognitionRef.current.onerror = (event) => {
        setIsListening(false)
        if (event.error === 'not-allowed') {
          setSpeechSupported(false)
        }
      }
      recognitionRef.current.onend = () => {
        setIsListening(false);
      }
    } else {
      setSpeechSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop()
      }
    }
  }, [])

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        setUploadedImage(event.target.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleSend = () => {
    if (message.trim() || uploadedImage) {
      sendMessage(message, uploadedImage)
    }
  }

  const toggleListening = () => {
    if (!recognitionRef.current) return

    if (isListening) {
      recognitionRef.current.stop()
      setIsListening(false)
    } else {
      recognitionRef.current.start()
      setIsListening(true)
    }
  }

  const sendMessage = useCallback(async (text, imageData = null) => {
    let fullPrompt = toolCallUtils.getFullPrompt(text);
    if (!fullPrompt.trim() && !imageData) return null

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: text || fullPrompt,
      image: imageData,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setMessage('')
    setUploadedImage(null)
    setIsTyping(true)

    const response = await callBackend(fullPrompt, messages, imageData)
    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: toolCallUtils.getDisplayResponse(response),
      timestamp: new Date()
    }
    setMessages(prev => [...prev, botMessage])
    toolCallUtils.handleResponse(response);
    if (inputModeRef.current == 'speech'){
      speakText(removeEmojis(toolCallUtils.getDisplayResponse(response)))
    }
    
    setIsTyping(false)
    return response

  }, [messages, inputMode]);

  const callBackend = async (userMessage, conversationHistory, imageData = null) => {
    try {
      const contextMessage = `${userMessage}`

      const response = await fetch("https://grid.ai.juspay.net/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_API_KEY}`
        },
        body: JSON.stringify({
          model: "kimi-latest",
          max_tokens: 4096,
          messages: [
            {
              role: "user",
              content: imageData ? [
                { type: "text", text: contextMessage },
                { type: "image_url", image_url: { url: imageData } }
              ] : contextMessage
            }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const data = await response.json()

      if (data.choices && data.choices[0] && data.choices[0].message) {
        return data.choices[0].message.content
      } else if (data.response) {
        return data.response
      } else if (data.message) {
        return data.message
      } else if (typeof data === 'string') {
        return data
      } else {
        return JSON.stringify(data)
      }

    } catch (error) {
      console.error('API error:', error)

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        return "Unable to connect to the server. Please check your connection and try again."
      }

      return `Sorry, I encountered an error: ${error.message}`
    }
  }

  return (
      <OfferProvider>
        <ToastProvider>
          <Router>
            <AppContent 
              messages={messages} 
              inputMode={inputMode} 
              speechSupported={speechSupported} 
              uploadedImage={uploadedImage} 
              fileInputRef={fileInputRef} 
              handleImageUpload={handleImageUpload} 
              message={message} 
              handleKeyPress={handleKeyPress} 
              handleSend={handleSend} 
              setInputMode={setInputMode} 
              isListening={isListening} 
              toggleListening={toggleListening} 
              isTyping={isTyping} 
              messagesEndRef={messagesEndRef}
              setMessage={setMessage}
              toolCallUtils={toolCallUtils}
            />
          </Router>
        </ToastProvider>
      </OfferProvider>
  )
}

export default App

import { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
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
import ChatBot from './Components/ChatBot.jsx'
import './App.css'

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
function speakText(text) {
  console.log("Attempting to speak text:", text)
  if (!("speechSynthesis" in window)) {
    console.error("TTS not supported in this browser");
    return;
  }

  console.log("Speaking text:", text);

  const utterance = new SpeechSynthesisUtterance(text);

  utterance.lang = "en-US";
  utterance.rate = 1.6;      // speed (0.1 - 10)
  utterance.pitch = 1;     // tone (0 - 2)
  utterance.volume = 1;    // volume (0 - 1)

  window.speechSynthesis.speak(utterance);
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
  } , [inputMode])

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

    // Search for products
    const response = await callBackend(fullPrompt, messages, imageData)
    const botMessage = {
      id: Date.now() + 1,
      type: 'bot',
      text: overrideOutput || response,
      timestamp: new Date()
    }
    setMessages(prev => [...prev, botMessage])
    if (inputModeRef.current == 'speech'){
      speakText(removeEmojis(response))
    }
    else{
      console.log("Not speaking AI response because input mode is:", inputMode)
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
          model: "claude-sonnet-4-5",
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
      <Router>
        <div className="app-container">
          <Routes>
            <Route path="/checkout/offer" element={<OffersScreen toolCallUtils={toolCallUtils}/>} />
            <Route path="/checkout/cykc" element={<CYKCPage toolCallUtils={toolCallUtils}/>} />
            <Route path="/checkout/mandate" element={<MandatePage toolCallUtils={toolCallUtils}/>} />
            <Route path="/checkout/kfs" element={<KFSPage toolCallUtils={toolCallUtils}/>} />
            <Route path="/checkout/approved" element={<LoanApprovedPage toolCallUtils={toolCallUtils}/>} />
            <Route path="/checkout/invoice" element={<InvoicePage toolCallUtils={toolCallUtils}/>} />
            <Route path="/checkout/disbursed" element={<DisbursedPage toolCallUtils={toolCallUtils}/>} />
            <Route path="/*" element={<AIChatWidget toolCallUtils={toolCallUtils}/>} />
          </Routes>
          <ChatBot messages={messages} inputMode={inputMode} speechSupported={speechSupported} uploadedImage={uploadedImage} fileInputRef={fileInputRef} handleImageUpload ={handleImageUpload} message={message} handleKeyPress={handleKeyPress} handleSend={handleSend} setInputMode={setInputMode} isListening={isListening} toggleListening={toggleListening} isTyping={isTyping} messagesEndRef={messagesEndRef} />
        </div>
      </Router>
    </OfferProvider>
  )
}

export default App

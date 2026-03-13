import React, { useState, useEffect, useRef } from "react";

export default function VoiceChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();

      recognition.lang = "en-US";
      recognition.continuous = true;
      recognition.interimResults = true;

      let silenceTimer = null;

      recognition.onresult = (event) => {
        let transcript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        setInput(transcript);

        // reset silence timer
        clearTimeout(silenceTimer);

        silenceTimer = setTimeout(() => {
          recognition.stop();
          handleSend(transcript);
        }, 2000); // 2 seconds silence
      };

      recognition.onend = () => {
        setListening(false);
        clearTimeout(silenceTimer);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speak = (text) => {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
  };

  const handleSend = async (textParam) => {
    const text = textParam ?? input;
    if (!text) return;

    const newMessages = [...messages, { role: "user", text }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text })
      });

      const data = await res.json();

      const botMsg = { role: "bot", text: data.reply };
      setMessages((m) => [...m, botMsg]);

      speak(data.reply);
    } catch (err) {
      console.error(err);
    }
  };

  const startListening = () => {
    if (!recognitionRef.current) return;

    setListening(true);
    recognitionRef.current.start();
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 shadow-xl rounded-2xl bg-white flex flex-col">
      <div className="p-3 border-b font-semibold">AI Assistant</div>

      <div className="flex-1 p-3 overflow-y-auto max-h-80">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`mb-2 text-sm ${
              m.role === "user" ? "text-right" : "text-left"
            }`}
          >
            <span
              className={`inline-block px-3 py-2 rounded-xl ${
                m.role === "user" ? "bg-blue-500 text-white" : "bg-gray-200"
              }`}
            >
              {m.text}
            </span>
          </div>
        ))}
      </div>

      <div className="p-2 flex gap-2 border-t">
        <input
          className="flex-1 border rounded-lg px-2 py-1 text-sm"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask something..."
        />

        <button
          onClick={() => handleSend()}
          className="px-3 py-1 bg-blue-500 text-white rounded-lg"
        >
          Send
        </button>

        <button
          onClick={startListening}
          className={`px-3 py-1 rounded-lg ${
            listening ? "bg-red-500" : "bg-green-500"
          } text-white`}
        >
          🎤
        </button>
      </div>
    </div>
  );
}

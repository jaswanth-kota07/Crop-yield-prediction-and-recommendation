import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'model', text: 'Hello! I am your Krishi Assistant. How can I help you with farming today?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GROQ_API_KEY;
      const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

      // Helper for retry logic
      const fetchWithRetry = async (url, options, maxRetries = 3) => {
        for (let i = 0; i < maxRetries; i++) {
          const response = await fetch(url, options);
          if (response.status === 429 && i < maxRetries - 1) {
            const waitTime = Math.pow(2, i) * 1000;
            await new Promise(r => setTimeout(r, waitTime));
            continue;
          }
          return response;
        }
      };

      const systemPrompt = `You are an AI agricultural assistant named Krishi Assistant designed to help farmers in India.
        Provide practical, actionable, and accurate advice on crop management, pest control, soil health, and weather impact.
        Keep responses concise, helpful, and culturally relevant to Indian farming.`;

      const payload = {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages.map(m => ({
            role: m.role === 'user' ? 'user' : 'assistant',
            content: m.text
          })),
          { role: 'user', content: userMessage }
        ]
      };

      const response = await fetchWithRetry(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 429) throw new Error('AI is currently busy. Please wait a moment.');
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const txt = data.choices?.[0]?.message?.content || "Sorry, I couldn't process that.";

      setMessages(prev => [...prev, { role: 'model', text: txt }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { role: 'model', text: 'Sorry, I am having trouble connecting right now: ' + err.message }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-xl flex items-center justify-center hover:bg-emerald-600 hover:shadow-2xl transition-all duration-300 ${isOpen ? 'scale-0' : 'scale-100 hover:scale-110'}`}
      >
        <MessageSquare className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 h-[500px] max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-100 transition-all duration-300 origin-bottom-right ${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500 to-green-600 text-white p-4 rounded-t-2xl flex justify-between items-center shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-1.5 rounded-lg backdrop-blur-sm">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg tracking-wide">Krishi Assistant</h3>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50 custom-scrollbar">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`p-4 rounded-2xl shadow-sm max-w-[90%] break-words overflow-hidden ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white rounded-br-sm' : 'bg-white border border-green-100/50 text-gray-700 rounded-bl-sm'}`}>
                <p className="text-[15px] leading-relaxed whitespace-pre-wrap break-words">{msg.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex w-full justify-start">
              <div className="p-4 rounded-2xl bg-white border border-green-100/50 rounded-bl-sm shadow-sm max-w-[90%]">
                <div className="flex space-x-1.5">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-100 rounded-b-2xl shrink-0">
          <div className="flex items-center relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about farming..."
              className="w-full bg-gray-50 border border-gray-200 rounded-full py-3.5 pl-5 pr-14 text-[15px] focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all outline-none"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-1.5 w-10 h-10 flex items-center justify-center rounded-full bg-primary text-white shadow-md hover:bg-primary-dark hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-md"
            >
              <Send className="w-4 h-4 ml-0.5" />
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default Chatbot;

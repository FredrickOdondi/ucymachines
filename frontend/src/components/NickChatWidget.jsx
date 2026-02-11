import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Minimize2, Maximize2, Bot } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const NickChatWidget = ({ currentPage = 'dashboard' }) => {
    const { theme } = useTheme();
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: "Hey! I'm Nick, your AI assistant. I can help you navigate the MachineryLeads platform. What would you like to know?" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage = { role: 'user', content: inputValue };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const res = await fetch('http://127.0.0.1:8000/api/nick/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: inputValue,
          current_page: currentPage,
          conversation_id: 'session-1' // Simple session ID
        })
      });

      if (res.ok) {
        const data = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        const error = await res.json();
        setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now. Please try again!" }]);
      }
    } catch (error) {
      console.error('Error chatting with Nick:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: "Connection error. Please check if the backend is running." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] bg-primary-500 hover:bg-primary-400 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 group"
        title="Chat with Nick"
      >
        <MessageCircle size={24} />
        <span className={'absolute right-full mr-3 text-white text-xs px-3 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-[9999] ' + (theme === 'dark' ? 'bg-zinc-900' : 'bg-gray-800')}>
          Ask Nick
        </span>
      </button>
    );
  }

  return (
    <div className={'fixed bottom-6 right-6 z-[9999] rounded-2xl shadow-2xl border flex flex-col transition-all duration-300 ' + (theme === 'dark' ? 'bg-zinc-900 border-slate-700' : 'bg-white border-gray-300') + ' ' + (isMinimized ? 'w-80 h-14' : 'w-96 h-[500px]')}>
      {/* Header */}
      <div className={'flex items-center justify-between px-4 py-3 border-b ' + (theme === 'dark' ? 'bg-zinc-900/50 border-slate-700' : 'bg-gray-100 border-gray-300')}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-400 to-primary-500 flex items-center justify-center">
            <Bot size={18} className="text-white" />
          </div>
          <div>
            <h3 className={'font-semibold text-sm ' + (theme === 'dark' ? 'text-white' : 'text-gray-900')}>Nick</h3>
            <p className="text-[10px] text-green-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className={'p-1.5 rounded-lg transition-colors ' + (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
          </button>
          <button
            onClick={() => setIsOpen(false)}
            className={'p-1.5 rounded-lg transition-colors ' + (theme === 'dark' ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200')}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, idx) => (
              <div
                key={`${msg.role}-${idx}-${msg.content?.substring(0, 10)}`}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-primary-500 text-white rounded-br-sm'
                      : 'bg-zinc-900 text-zinc-200 rounded-bl-sm'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-zinc-900 text-zinc-200 rounded-2xl rounded-bl-sm px-4 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask Nick anything..."
                disabled={isLoading}
                className="flex-1 bg-zinc-900 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputValue.trim()}
                className="bg-primary-500 hover:bg-primary-400 text-white p-2.5 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100"
              >
                <Send size={18} />
              </button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-2 text-center">
              Powered by GLM-4 • Built with LangGraph
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default NickChatWidget;

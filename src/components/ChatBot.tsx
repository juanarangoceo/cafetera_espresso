import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, CheckCheck, ShoppingBag, Gift } from 'lucide-react';
import { Message, SectionId } from '../types';
import { sendMessageToGemini } from '../app/actions/chat';

const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  // Auto-open logic removed by user request
  // const [hasOpened, setHasOpened] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'model',
      text: '¡Hola! 👋 Soy Marco. ¿Viste que hoy regalamos el Molino Eléctrico con tu compra?'
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping]);

  const simulateTyping = async (text: string) => {
    setIsTyping(true);
    const typingTime = 400 + (text.length * 15) + (Math.random() * 400);
    await new Promise(resolve => setTimeout(resolve, typingTime));
    setIsTyping(false);
  };

  const handleSend = async () => {
    if (!inputText.trim() || isTyping) return;

    const userText = inputText;
    setInputText('');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: userText
    };

    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    try {
      // Convert current messages to history format for Gemini
      const history = messages.map(m => ({
        role: m.role === 'model' ? 'model' : 'user',
        parts: [{ text: m.text }]
      }));

      const responseFullText = await sendMessageToGemini(userText, history);

      const rawSentences = responseFullText.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [responseFullText];

      const sentences = rawSentences
        .map(s => s.trim())
        .filter(s => s.length > 0);

      for (let i = 0; i < sentences.length; i++) {
        await simulateTyping(sentences[i]);

        const botMsg: Message = {
          id: (Date.now() + i).toString(),
          role: 'model',
          text: sentences[i]
        };
        setMessages(prev => [...prev, botMsg]);

        if (i < sentences.length - 1) {
          await new Promise(r => setTimeout(r, 400));
        }
      }

    } catch (error) {
      console.error(error);
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSend();
  };

  const handleBuyClick = () => {
    // Scroll to pricing/checkout instead of WhatsApp
    const element = document.getElementById(SectionId.PRICING);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    // Mobile logic: close chat to see pricing
    if (window.innerWidth < 768) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-4 right-4 md:bottom-8 md:right-8 z-50 p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center ${isOpen ? 'bg-coffee-900 rotate-90' : 'bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500'
          } text-white`}
        aria-label="Hablar con Marco"
      >
        {isOpen ? (
          <X size={24} />
        ) : (
          <div className="relative">
            <MessageSquare size={26} fill="currentColor" className="text-white" />
            <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-bounce">1</span>
          </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 md:bottom-28 md:right-8 w-[calc(100vw-2rem)] md:w-[360px] h-[600px] max-h-[80vh] bg-white rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden border border-coffee-100 animate-fade-in-up font-sans">

          {/* Persona Header */}
          <div className="bg-gradient-to-r from-coffee-900 to-coffee-800 p-4 flex flex-col gap-3 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-coffee-100 border-2 border-white overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1583689436329-3a31c519a4e3?q=80&w=200&auto=format&fit=crop" alt="Marco Barista" className="w-full h-full object-cover bg-coffee-300" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-coffee-900 rounded-full animate-pulse"></span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold text-lg leading-tight truncate">Marco</h3>
                <p className="text-coffee-200 text-xs font-medium truncate">Experto en Café • Online</p>
              </div>
            </div>

            {/* Quick Buy Button in Header */}
            <button
              onClick={handleBuyClick}
              className="w-full bg-gold-500 hover:bg-gold-600 active:bg-gold-700 text-white text-sm font-bold py-2 px-4 rounded-xl shadow-lg transition-colors flex items-center justify-center gap-2 animate-pulse-slow"
            >
              <Gift size={16} /> Quiero mi Molino Gratis
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 bg-coffee-50 space-y-3">
            <div className="text-center text-[10px] uppercase tracking-wider text-gray-400 my-2 font-bold">Hoy</div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-[15px] shadow-sm relative leading-snug ${msg.role === 'user'
                      ? 'bg-coffee-600 text-white rounded-br-sm'
                      : 'bg-white text-coffee-900 border border-coffee-100 rounded-bl-sm'
                    }`}
                >
                  {msg.text}
                  {msg.role === 'user' && (
                    <span className="absolute bottom-1 right-2 text-coffee-300 opacity-80">
                      <CheckCheck size={10} />
                    </span>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="flex justify-start animate-fade-in-up">
                <div className="bg-white px-4 py-3 rounded-2xl rounded-bl-sm border border-coffee-100 shadow-sm">
                  <div className="flex space-x-1.5 h-2 items-center">
                    <div className="w-1.5 h-1.5 bg-coffee-400 rounded-full animate-bounce delay-0"></div>
                    <div className="w-1.5 h-1.5 bg-coffee-400 rounded-full animate-bounce delay-100"></div>
                    <div className="w-1.5 h-1.5 bg-coffee-400 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-3 bg-white border-t border-coffee-100 shrink-0">
            <div className="flex items-center gap-2 bg-coffee-50 rounded-full px-4 py-2 border focus-within:border-gold-500 focus-within:ring-1 focus-within:ring-gold-500 focus-within:bg-white transition-all">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Pregunta sobre el molino..."
                className="flex-1 bg-transparent outline-none text-[15px] text-coffee-900 placeholder-coffee-400"
                disabled={isTyping}
                autoFocus
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !inputText.trim()}
                className="text-coffee-600 hover:text-coffee-800 disabled:opacity-30 transition-colors p-1.5 rounded-full hover:bg-coffee-100"
              >
                <Send size={20} fill="currentColor" className="rotate-45 ml-0.5" />
              </button>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-coffee-400">Te ayudamos a comprar en la web.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
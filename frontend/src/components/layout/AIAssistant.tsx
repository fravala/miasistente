"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Maximize2, 
  Minimize2, 
  User, 
  Clock, 
  Terminal,
  Brain,
  MessageSquare
} from "lucide-react";

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hola, soy tu asistente inteligente. ¿En qué puedo ayudarte con la gestión de MiAsistente hoy?' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsTyping(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg, provider: "openai" })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: "Lo siento, hubo un error al procesar tu solicitud." }]);
      }
    } catch (error) {
       setMessages(prev => [...prev, { role: 'assistant', content: "No puedo conectar con el servidor de IA en este momento." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-y-0 right-0 z-50 flex pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className={`pointer-events-auto h-screen bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] transition-all duration-700 border-l border-slate-100 flex flex-col ${isMaximized ? 'w-screen md:w-[600px]' : 'w-screen md:w-[420px]'}`}>
          
          {/* Header */}
          <header className="p-6 md:p-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-neutral-50/50 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100 animate-pulse-subtle">
                  <Bot size={24} strokeWidth={2.5} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800 tracking-tight leading-none mb-1.5 flex items-center gap-2">
                  Quantum AI
                  <Sparkles size={14} className="text-amber-400 fill-amber-400" />
                </h3>
                <div className="flex items-center gap-2">
                  <span className="flex w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Motor Activo</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setIsMaximized(!isMaximized)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-100 rounded-xl text-slate-400 transition-all hidden md:flex">
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
              <button onClick={() => setIsOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 no-scrollbar bg-slate-50/30">
            {messages.map((msg, i) => (
              <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} group`}>
                <div className="flex items-center gap-2 mb-2 px-1">
                   <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                     {msg.role === 'user' ? 'Tú' : 'Asistente'}
                   </span>
                </div>
                <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-sm border ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white border-indigo-700 rounded-tr-none' 
                    : 'bg-white text-slate-700 border-slate-100 rounded-tl-none'
                }`}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex flex-col items-start animate-fade-in">
                <div className="bg-white p-5 rounded-[2rem] rounded-tl-none shadow-sm border border-slate-100 flex items-center gap-2 min-w-[80px]">
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                  <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <footer className="p-6 md:p-8 pt-4 bg-white border-t border-slate-50">
            <div className="flex gap-3 mb-4">
              <button className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-[9px] font-black text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 transition-all uppercase tracking-widest">Resumen CRM</button>
              <button className="px-3 py-1.5 bg-slate-50 hover:bg-indigo-50 text-[9px] font-black text-slate-400 hover:text-indigo-600 rounded-lg border border-slate-100 transition-all uppercase tracking-widest">Crear Tarea</button>
            </div>
            <form onSubmit={handleSend} className="relative group">
              <input 
                type="text" 
                placeholder="Pregunta algo al asistente..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="w-full h-16 bg-slate-50 border-2 border-transparent rounded-[2rem] pl-6 pr-16 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all shadow-inner focus:shadow-indigo-100/50"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 w-12 h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50"
                disabled={!input.trim() || isTyping}
              >
                <Send size={18} strokeWidth={2.5} />
              </button>
            </form>
          </footer>
        </div>

        {/* Floating FAB */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full shadow-[0_8px_32px_-4px_rgba(99,102,241,0.5)] flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_40px_-4px_rgba(99,102,241,0.6)] active:scale-95"
          >
            <Bot size={24} />
          </button>
        )}
      </div>
    </>
  );
}

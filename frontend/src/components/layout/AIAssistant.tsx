"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, Sparkles, X, MessageSquare } from "lucide-react";

type ToolCallInfo = {
  name: string;
  description: string;
};

type Message = {
  role: "user" | "assistant";
  content: string;
  tool_calls_info?: ToolCallInfo[];
};

export function AIAssistant() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "¡Hola! Soy tu Asistente Empresarial. ¿En qué te puedo ayudar hoy?",
      tool_calls_info: []
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false); // Para móvil: drawer abierto/cerrado
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesRef = useRef(messages);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    const handleExternalAIRequest = (e: Event) => {
      const evt = e as CustomEvent<string>;
      if (evt.detail && !isLoading) {
        setIsOpen(true);
        handleSendMessage(evt.detail);
      }
    };
    window.addEventListener("openAIWithContext", handleExternalAIRequest);
    return () => window.removeEventListener("openAIWithContext", handleExternalAIRequest);
  }, [isLoading]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (overrideMsg?: string | any) => {
    const isString = typeof overrideMsg === 'string';
    const userMessage = isString ? overrideMsg : inputMessage.trim();
    if (!userMessage.trim()) return;

    if (!isString) setInputMessage("");
    const currentMessages = messagesRef.current;
    const newMessages = [...currentMessages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No estás autenticado");

      const historyToSend = newMessages
        .filter(m => !m.content.includes("Soy tu Asistente Empresarial"))
        .map(m => ({ role: m.role, content: m.content }));

      const resp = await fetch("http://127.0.0.1:8000/api/assistant/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage,
          history: historyToSend
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        let assistantReply = data.reply;
        if (data.status === "error") assistantReply = `⚠️ ${data.reply}`;

        const assistantMessage: Message = {
          role: "assistant",
          content: assistantReply,
          ...(data.tool_calls_info && { tool_calls_info: data.tool_calls_info })
        };
        setMessages((prev) => [...prev, assistantMessage]);

        if (data.tool_calls_info && data.tool_calls_info.length > 0) {
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("crmDataRefreshed", { bubbles: true, detail: { timestamp: Date.now() } }));
            window.dispatchEvent(new CustomEvent("tasksDataRefreshed", { bubbles: true, detail: { timestamp: Date.now() } }));
          }, 800);
        }
      } else {
        const errData = await resp.json().catch(() => ({}));
        setMessages((prev) => [...prev, {
          role: "assistant",
          content: `❌ Error del servidor: ${errData.detail || resp.statusText}`
        }]);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: `❌ Error de red: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const unreadCount = messages.filter(m => m.role === 'assistant').length - 1;

  const chatContent = (
    <div className="flex flex-col h-full">
      {/* Header con gradiente premium */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-indigo-900/40 shrink-0 relative overflow-hidden">
        {/* Header shimmer bg */}
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-transparent to-violet-900/20 pointer-events-none" />
        <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 relative z-10">
          <Bot size={22} className="text-white" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f1729] shadow-sm shadow-emerald-500/50"></div>
        </div>
        <div className="flex-1 min-w-0 relative z-10">
          <h2 className="text-base font-black tracking-wide truncate text-white">Asistente IA</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
            <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">En línea</p>
          </div>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden relative z-10 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 flex flex-col gap-4">
        {messages.map((msg, index) => (
          <div key={index} className={`flex flex-col max-w-[88%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
            {/* Label */}
            <div className="flex items-center gap-1.5 mb-1.5 px-1">
              {msg.role === 'user' ? (
                <span className="text-[9px] uppercase tracking-widest font-black text-indigo-300/60 ml-auto">Tú</span>
              ) : (
                <>
                  <Sparkles size={9} className="text-violet-400/80" />
                  <span className="text-[9px] uppercase tracking-widest font-black text-violet-400/80">Asistente</span>
                </>
              )}
            </div>
            {/* Bubble */}
            <div className={`px-4 py-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-md shadow-lg shadow-indigo-500/25'
                : 'bg-gradient-to-br from-slate-800/80 to-indigo-950/60 text-slate-200 rounded-2xl rounded-tl-md border border-indigo-800/30 shadow-sm'
            }`}>
              {msg.content}
              {msg.role === 'assistant' && msg.tool_calls_info && msg.tool_calls_info.length > 0 && (
                <div className="mt-2.5 pt-2.5 border-t border-indigo-700/30">
                  <div className="flex items-center gap-2 text-violet-400/70 text-xs">
                    <span className="w-1.5 h-1.5 bg-violet-400/70 rounded-full animate-pulse"></span>
                    <span className="font-medium italic">{msg.tool_calls_info.map(t => t.description).join(', ')}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="self-start bg-gradient-to-br from-slate-800/80 to-indigo-950/60 border border-indigo-800/30 px-5 py-4 rounded-2xl rounded-tl-md shadow-sm flex items-center gap-2">
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
            <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
            <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 shrink-0">
        <div className={`bg-slate-800/60 border rounded-2xl px-4 flex items-center relative transition-all duration-300 ${
          isLoading
            ? 'border-indigo-800/20 opacity-60'
            : 'border-indigo-700/30 focus-within:border-indigo-500/60 focus-within:bg-slate-800/80 focus-within:shadow-lg focus-within:shadow-indigo-500/10'
        }`}>
          <input
            type="text"
            placeholder={isLoading ? "Pensando..." : "Escribe un mensaje..."}
            className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder-slate-500 pr-12 py-4"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 transition-all text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform active:scale-90 absolute right-2.5 duration-200"
          >
            <Send size={15} className="translate-x-[1px]"/>
          </button>
        </div>
      </div>

      {/* Decorative Glows */}
      <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-20 left-0 w-32 h-32 bg-violet-600/8 rounded-full blur-[50px] -z-10 pointer-events-none"></div>
    </div>
  );

  return (
    <>
      {/* === DESKTOP: Panel lateral fijo === */}
      <aside className="hidden md:flex w-96 flex-shrink-0 bg-[#0f1729] text-white m-6 ml-0 rounded-[32px] overflow-hidden flex-col shadow-2xl shadow-indigo-950/50 relative border border-indigo-900/40">
        {chatContent}
      </aside>

      {/* === MOBILE: Botón flotante + Drawer === */}
      <div className="md:hidden">
        {/* Backdrop */}
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Drawer desde abajo - flex column directo */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-50 bg-[#0f1729] text-white rounded-t-[28px] border-t border-indigo-900/50 shadow-[0_-20px_60px_-10px_rgba(79,70,229,0.25)] transition-transform duration-300 ease-out flex flex-col ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
          style={{ height: '92dvh' }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2 shrink-0">
            <div className="w-10 h-1 bg-indigo-700/60 rounded-full" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-indigo-900/40 shrink-0 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-900/30 via-transparent to-violet-900/20 pointer-events-none" />
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 relative z-10">
              <Bot size={20} className="text-white" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-[#0f1729]"></div>
            </div>
            <div className="flex-1 min-w-0 relative z-10">
              <h2 className="text-base font-black tracking-wide truncate">Asistente IA</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                <p className="text-emerald-400 text-[10px] font-bold tracking-widest uppercase">En línea</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 p-2 rounded-xl bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages - flex-1 fills all remaining space */}
          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4 overscroll-contain">
            {messages.map((msg, index) => (
              <div key={index} className={`flex flex-col max-w-[88%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
                <div className="flex items-center gap-1.5 mb-1.5 px-1">
                  {msg.role === 'user' ? (
                    <span className="text-[9px] uppercase tracking-widest font-black text-indigo-300/60 ml-auto">Tú</span>
                  ) : (
                    <><Sparkles size={9} className="text-violet-400/80" /><span className="text-[9px] uppercase tracking-widest font-black text-violet-400/80">Asistente</span></>
                  )}
                </div>
                <div className={`px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-600 text-white rounded-2xl rounded-tr-md shadow-lg shadow-indigo-500/25'
                    : 'bg-gradient-to-br from-slate-800/80 to-indigo-950/60 text-slate-200 rounded-2xl rounded-tl-md border border-indigo-800/30 shadow-sm'
                }`}>
                  {msg.content}
                  {msg.role === 'assistant' && msg.tool_calls_info && msg.tool_calls_info.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-indigo-700/30">
                      <div className="flex items-center gap-2 text-violet-400/70 text-xs">
                        <span className="w-1.5 h-1.5 bg-violet-400/70 rounded-full animate-pulse"></span>
                        <span className="font-medium italic">{msg.tool_calls_info.map(t => t.description).join(', ')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="self-start bg-gradient-to-br from-slate-800/80 to-indigo-950/60 border border-indigo-800/30 px-5 py-4 rounded-2xl rounded-tl-md shadow-sm flex items-center gap-2">
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-violet-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input - always pinned at bottom */}
          <div className="p-4 pb-6 shrink-0 border-t border-indigo-900/40">
            <div className={`bg-slate-800/60 border rounded-2xl px-4 flex items-center relative transition-all duration-300 ${
              isLoading
                ? 'border-indigo-800/20 opacity-60'
                : 'border-indigo-700/30 focus-within:border-indigo-500/60 focus-within:shadow-lg focus-within:shadow-indigo-500/10'
            }`}>
              <input
                type="text"
                placeholder={isLoading ? "Pensando..." : "Escribe un mensaje..."}
                className="bg-transparent border-none outline-none text-sm text-slate-200 w-full placeholder-slate-500 pr-12 py-4"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={isLoading}
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-gradient-to-br from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 disabled:from-slate-700 disabled:to-slate-700 transition-all text-white w-9 h-9 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 transform active:scale-90 absolute right-2.5 duration-200"
              >
                <Send size={15} className="translate-x-[1px]"/>
              </button>
            </div>
          </div>

          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 rounded-full blur-[60px] -z-10 pointer-events-none"></div>
        </div>

        {/* Botón flotante de IA */}
        {!isOpen && (
          <button
            onClick={() => setIsOpen(true)}
            className="fixed bottom-20 right-4 z-40 w-14 h-14 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-full shadow-[0_8px_32px_-4px_rgba(99,102,241,0.5)] flex items-center justify-center text-white transition-all duration-300 hover:scale-110 hover:shadow-[0_12px_40px_-4px_rgba(99,102,241,0.6)] active:scale-95"
          >
            <Bot size={24} />
            {messages.length > 1 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-400 rounded-full border-2 border-white text-[9px] font-black text-white flex items-center justify-center shadow-sm">
                {Math.min(messages.filter(m => m.role === 'assistant').length, 9)}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}

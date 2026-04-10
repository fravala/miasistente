"use client";

import { 
  Bell, Search, Menu, 
  ChevronDown, Crown, 
  SearchIcon, Zap,
  Sparkles
} from "lucide-react";
import { useState, useEffect } from "react";

export default function Navbar({ toggleSidebar }: { toggleSidebar: () => void }) {
  const [user, setUser] = useState<any>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) setUser(JSON.parse(storedUser));

    const handleScroll = () => {
       setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <nav className={`h-20 flex items-center justify-between px-6 md:px-10 border-b transition-all duration-300 z-30 sticky top-0 ${scrolled ? 'bg-white/70 backdrop-blur-xl border-slate-200/50 shadow-lg shadow-indigo-500/5' : 'bg-transparent border-transparent'}`}>
      
      {/* Left side: Mobile Toggle & Search */}
      <div className="flex items-center gap-6">
        <button 
          onClick={toggleSidebar}
          className="p-3 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 hover:shadow-xl hover:border-indigo-100 transition-all group"
        >
          <Menu size={20} className="group-hover:scale-110 transition-transform" />
        </button>

        <div className="hidden lg:flex items-center gap-3 bg-slate-100/50 border border-slate-200/50 rounded-2xl px-4 py-2.5 w-80 group focus-within:bg-white focus-within:border-indigo-200 focus-within:shadow-xl focus-within:shadow-indigo-500/5 transition-all">
           <Search size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
           <input 
             type="text" 
             placeholder="Acceso rápido (⌘ + K)" 
             className="bg-transparent text-sm font-bold text-slate-600 placeholder:text-slate-400 outline-none w-full"
           />
        </div>
      </div>

      {/* Right side: Actions & User */}
      <div className="flex items-center gap-4 md:gap-7">
        <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-indigo-600/5 border border-indigo-100 rounded-2xl">
           <Crown size={14} className="text-indigo-600" />
           <span className="text-[10px] font-black uppercase tracking-widest text-indigo-700">Enterprise</span>
        </div>

        <div className="flex items-center gap-2 md:gap-4 border-r border-slate-100 pr-4 md:pr-7">
           <button className="relative p-3 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all group">
              <Bell size={20} className="group-hover:rotate-12 transition-transform" />
              <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 border-2 border-white rounded-full"></div>
           </button>
           <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-500 hover:text-amber-500 hover:bg-amber-50 transition-all group">
              <Sparkles size={20} className="group-hover:scale-110 transition-transform" />
           </button>
        </div>

        <div className="flex items-center gap-3 md:gap-4 pl-1 group cursor-pointer">
           <div className="flex flex-col items-end hidden md:flex">
              <p className="text-sm font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                 {user?.username || "Usuario"}
              </p>
              <div className="flex items-center gap-1.5">
                 <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Activo</p>
              </div>
           </div>
           <div className="relative">
              <div className="w-10 h-10 md:w-12 md:h-12 rounded-[1.25rem] bg-gradient-to-br from-slate-100 to-slate-200 border-2 border-white shadow-xl flex items-center justify-center text-slate-500 font-bold overflow-hidden group-hover:border-indigo-100 group-hover:shadow-indigo-500/20 transition-all duration-500">
                 {user?.username ? user.username.charAt(0).toUpperCase() : "U"}
              </div>
              <ChevronDown className="absolute -bottom-1 -right-1 bg-white text-slate-400 border border-slate-100 rounded-full group-hover:text-indigo-500 group-hover:translate-y-0.5 transition-all" size={14} />
           </div>
        </div>
      </div>
    </nav>
  );
}

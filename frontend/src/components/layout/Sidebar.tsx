"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Users, 
  CheckCircle2, 
  Settings, 
  LogOut, 
  Rocket,
  Zap,
  Globe,
  Plus
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();

  const navItems = [
    { label: "Dashboard", icon: BarChart3, href: "/dashboard" },
    { label: "CRM", icon: Users, href: "/crm" },
    { label: "Tareas", icon: CheckCircle2, href: "/tasks" },
    { label: "Configuración", icon: Settings, href: "/settings" },
  ];

  return (
    <aside className="hidden md:flex flex-col w-72 h-screen bg-white border-r border-slate-100/80 shadow-[1px_0_10px_rgba(0,0,0,0.01)] transition-all duration-500 relative z-30">
      <div className="p-8 pb-4">
        <Link href="/" className="flex items-center gap-3.5 group">
          <div className="w-11 h-11 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-100 group-hover:rotate-6 transition-transform duration-500">
            <Rocket size={20} strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-xl font-black text-slate-800 tracking-tighter block leading-none">MiAsistente</span>
            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1 block opacity-70">ERP Enterprise</span>
          </div>
        </Link>
      </div>

      <div className="p-6">
        <button className="w-full h-14 bg-slate-50 border border-slate-100 hover:border-indigo-200 hover:bg-white rounded-2xl flex items-center gap-4 px-5 transition-all group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-50/50 to-transparent translate-x-[-100%] group-hover:translate-x-0 transition-transform duration-500"></div>
          <div className="w-8 h-8 bg-indigo-100/50 rounded-xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 relative z-10">
            <Plus size={16} strokeWidth={3} />
          </div>
          <span className="text-xs font-black text-slate-600 group-hover:text-indigo-600 transition-colors uppercase tracking-widest relative z-10">Nuevo Registro</span>
        </button>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1.5 overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-4 px-5 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all duration-300 group ${
                isActive
                  ? "bg-indigo-50 text-indigo-600 shadow-sm shadow-indigo-50"
                  : "text-slate-400 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-indigo-600" : "text-slate-300 group-hover:text-slate-400"} />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="px-6 py-8 border-t border-slate-50 space-y-6">
        <div className="p-5 rounded-[2rem] bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden group">
          <Zap className="absolute -right-2 -top-2 text-white/10 w-24 h-24 rotate-12 group-hover:scale-125 transition-transform duration-700" />
          <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 mb-1">Plan Pro</p>
          <p className="text-xs font-bold leading-tight relative z-10">Uso de IA Ilimitado y Backup Diario</p>
          <button className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Ver Upgrade</button>
        </div>

        <button className="flex items-center gap-4 px-5 w-full text-slate-400 hover:text-rose-500 transition-colors group">
          <LogOut size={18} />
          <span className="text-[10px] font-black uppercase tracking-widest">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
}

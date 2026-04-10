"use client";

import { 
  Users, CheckCircle, Clock, Setting, 
  Menu, X, Home, LogOut, Sparkles,
  Zap, Database, LifeBuoy, Bell
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function Sidebar({ isOpen, setIsOpen }: { isOpen: boolean, setIsOpen: (val: boolean) => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    { name: "Resumen", icon: Home, href: "/" },
    { name: "Contactos (CRM)", icon: Users, href: "/crm" },
    { name: "Tareas", icon: CheckCircle, href: "/tasks" },
    { name: "Actividad", icon: Clock, href: "/activity" },
    { name: "Analíticas", icon: Zap, href: "/analytics" },
    { name: "Base de Datos", icon: Database, href: "/database" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    router.push("/login");
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {!isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 md:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(true)}
        ></div>
      )}

      <aside className={`fixed md:relative flex flex-col h-full bg-white border-r border-slate-100 transition-all duration-500 z-50 ${isOpen ? "w-0 -translate-x-full md:w-24 md:translate-x-0" : "w-[280px] translate-x-0"}`}>
        {/* Logo Section */}
        <div className="h-20 flex items-center justify-center border-b border-slate-50 shrink-0 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent"></div>
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30 group cursor-pointer relative z-10">
            <Sparkles size={20} className="text-white group-hover:rotate-12 transition-transform duration-500" />
          </div>
          {!isOpen && (
            <span className="ml-3 text-lg font-black text-slate-900 tracking-tighter animate-in slide-in-from-left-2 duration-500">
              Antigravity<span className="text-indigo-600">.</span>
            </span>
          )}
        </div>

        {/* Navigation Section */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden py-8 px-4 space-y-1">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all duration-300 group relative ${
                  isActive 
                    ? "bg-indigo-600 text-white shadow-xl shadow-indigo-500/20" 
                    : "text-slate-400 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <div className={`shrink-0 transition-transform duration-500 ${isActive ? "" : "group-hover:scale-110 group-hover:rotate-3"}`}>
                  <item.icon size={22} strokeWidth={isActive ? 3 : 2} />
                </div>
                {!isOpen && (
                  <span className="text-sm font-black whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-500">
                    {item.name}
                  </span>
                )}
                {isActive && !isOpen && (
                  <div className="absolute right-3 w-1.5 h-1.5 bg-white/40 rounded-full animate-pulse"></div>
                )}
              </Link>
            );
          })}
        </div>

        {/* Bottom Section */}
        <div className="p-4 space-y-2 border-t border-slate-50">
           <Link
              href="/support"
              className="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:bg-slate-50 hover:text-slate-900 transition-all group"
           >
              <LifeBuoy size={22} className="group-hover:rotate-12 transition-transform duration-500" />
              {!isOpen && <span className="text-sm font-black animate-in fade-in duration-500">Soporte VIP</span>}
           </Link>
           <button
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all group"
           >
              <LogOut size={22} className="group-hover:-translate-x-1 transition-transform" />
              {!isOpen && <span className="text-sm font-black animate-in fade-in duration-500">Cerrar Sesión</span>}
           </button>
        </div>
      </aside>
    </>
  );
}

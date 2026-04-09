"use client"
import { Calendar, LayoutDashboard, Settings, UserCircle, Briefcase, Activity, CheckCircle, PieChart, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  const navItems = [
    { name: "Tablero", href: "/", icon: LayoutDashboard },
    { name: "Tareas", href: "/tasks", icon: CheckCircle },
    { name: "Contactos", href: "/crm", icon: Briefcase },
    { name: "Analíticas", href: "/analytics", icon: Activity },
    { name: "Ajustes", href: "/settings", icon: Settings },
  ];

  return (
    <>
      {/* === DESKTOP SIDEBAR (oculto en móvil) === */}
      <aside className="hidden md:flex w-24 h-screen bg-white border-r border-slate-100 flex-col items-center py-8 justify-between shadow-sm z-10 shrink-0">
        <div className="flex flex-col items-center gap-10">
          {/* Logo */}
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-cyan-400 to-cyan-300 flex items-center justify-center text-white shadow-cyan-200 shadow-lg cursor-pointer hover:scale-105 transition-transform">
             <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
          </div>

          <nav className="flex flex-col gap-6 items-center">
            {navItems.filter(i => i.href !== '/settings').map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link href={item.href} key={item.name} title={item.name}
                   className={`p-3 rounded-2xl transition-all duration-300 relative group
                   ${isActive ? 'bg-cyan-50 text-cyan-500 shadow-sm' : 'text-slate-400 hover:text-cyan-500 hover:bg-slate-50'}`}>
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-cyan-400 rounded-r-full" />
                  )}
                  <Icon size={22} className={isActive ? "stroke-[2.5px]" : "stroke-2"} />
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex flex-col items-center gap-6">
          <Link href="/settings" className={`p-2 rounded-xl transition-all duration-300 ${pathname === '/settings' ? 'bg-cyan-50 text-cyan-500 shadow-sm' : 'text-slate-400 hover:text-cyan-500 hover:bg-slate-50'}`} title="Configuración">
            <Settings size={22} className={pathname === '/settings' ? "stroke-[2.5px]" : "stroke-2"} />
          </Link>
          <button
             onClick={handleLogout}
             className="p-2 rounded-xl transition-all duration-300 text-slate-400 hover:text-red-500 hover:bg-red-50"
             title="Cerrar Sesión">
            <LogOut size={22} className="stroke-2" />
          </button>
          <button className="w-10 h-10 rounded-full overflow-hidden border-2 border-slate-200 hover:border-cyan-400 transition cursor-pointer flex items-center justify-center bg-slate-100 mt-2" title="Perfil de Usuario">
            <UserCircle size={32} className="text-slate-400" />
          </button>
        </div>
      </aside>

      {/* === MOBILE BOTTOM NAV (solo en móvil) === */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-100 shadow-[0_-4px_20px_-4px_rgba(0,0,0,0.08)] flex items-center justify-around px-2 py-2 safe-area-inset-bottom">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              href={item.href}
              key={item.name}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-2xl transition-all duration-200 ${
                isActive
                  ? 'text-cyan-500 bg-cyan-50'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Icon size={20} className={isActive ? "stroke-[2.5px]" : "stroke-2"} />
              <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-cyan-500' : 'text-slate-400'}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className="flex flex-col items-center gap-1 px-3 py-2 rounded-2xl text-slate-400 hover:text-red-500 transition-all"
        >
          <LogOut size={20} className="stroke-2" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Salir</span>
        </button>
      </nav>
    </>
  );
}

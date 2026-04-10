"use client";

import { useState, useEffect } from "react";
import { 
  Users, CheckCircle, Clock, TrendingUp, 
  ArrowUpRight, ArrowDownRight, Sparkles,
  Calendar, MessageSquare, Plus, ArrowRight
} from "lucide-react";
import { useRouter } from "next/navigation";

// Stats Card Component
const StatCard = ({ title, value, change, isPositive, icon: Icon, color }: any) => (
  <div className="group bg-white p-6 md:p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-500">
    <div className="flex justify-between items-start mb-6">
      <div className={`p-4 rounded-2xl ${color} bg-opacity-10 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
        <Icon className={color.replace('bg-', 'text-')} size={24} />
      </div>
      <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black tracking-wider ${isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {isPositive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
        {change}%
      </div>
    </div>
    <h3 className="text-slate-400 text-xs font-black uppercase tracking-[0.2em] mb-1">{title}</h3>
    <p className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">{value}</p>
  </div>
);

export default function DashboardHome() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({
    customers: 0,
    tasks: 0,
    interactions: 0
  });
  const router = useRouter();

  useEffect(() => {
    const fetchDashboardData = async () => {
      const storedUser = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (storedUser) setUser(JSON.parse(storedUser));
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        // Parallel fetch for speed
        const [custResp, taskResp] = await Promise.all([
          fetch("http://127.0.0.1:8000/api/crm/customers", { headers: { "Authorization": `Bearer ${token}` } }),
          fetch("http://127.0.0.1:8000/api/tasks", { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (custResp.ok && taskResp.ok) {
          const customers = await custResp.json();
          const tasks = await taskResp.json();
          setStats({
            customers: customers.length,
            tasks: tasks.length,
            interactions: customers.reduce((acc: number, c: any) => acc + (c.interactions_count || 0), 0)
          });
        }
      } catch (err) {
        console.error("Dashboard fetch error:", err);
      }
    };

    fetchDashboardData();
  }, [router]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-6 duration-1000">
      {/* Welcome Section */}
      <section className="mb-12 md:mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-6 group">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[2.5rem] shadow-xl border border-slate-100 flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-all duration-700 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent"></div>
              <Sparkles className="text-indigo-600 relative z-10" size={32} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Resumen Ejecutivo</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Panel de Control</span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-none">
                Hola, <span className="bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">{user?.username || "Usuario"}</span>
              </h1>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <button className="h-14 px-8 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:border-indigo-200 hover:text-indigo-600 hover:shadow-xl transition-all active:scale-95">
                Configuración
             </button>
             <button 
               onClick={() => router.push('/crm')}
               className="h-14 px-8 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/25 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95"
             >
                Ir al CRM
             </button>
          </div>
        </div>
      </section>

      {/* Primary Stats Grid */}
      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 md:gap-8 mb-12 md:mb-20">
        <StatCard 
          title="Cartera Global" 
          value={stats.customers} 
          change="12.5" 
          isPositive={true} 
          icon={Users} 
          color="bg-indigo-600" 
        />
        <StatCard 
          title="Tasks Activas" 
          value={stats.tasks} 
          change="4.2" 
          isPositive={true} 
          icon={CheckCircle} 
          color="bg-emerald-600" 
        />
        <StatCard 
          title="Engagement" 
          value={stats.interactions} 
          change="2.4" 
          isPositive={false} 
          icon={Clock} 
          color="bg-amber-600" 
        />
        <StatCard 
          title="Performance" 
          value="94%" 
          change="8.1" 
          isPositive={true} 
          icon={TrendingUp} 
          color="bg-purple-600" 
        />
      </section>

      {/* Main Grid View */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 md:gap-12">
        
        {/* Activity & Tasks Column */}
        <div className="xl:col-span-2 space-y-8 md:space-y-12">
           
           {/* Section Header */}
           <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center">
                    <Calendar className="text-white" size={20} />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 tracking-tight">Actividad Crítica</h2>
              </div>
              <button onClick={() => router.push('/tasks')} className="text-[10px] font-black uppercase tracking-widest text-indigo-500 hover:text-indigo-400 flex items-center gap-2 group">
                 Ver todas <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
           </div>

           {/* Cards Container */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="group bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden h-[400px] flex flex-col justify-between">
                 <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                 <div className="relative z-10">
                    <Plus className="mb-8" size={32} strokeWidth={3} />
                    <h3 className="text-3xl font-black leading-tight mb-4">¿Algo nuevo en mente?</h3>
                    <p className="text-indigo-100 font-bold text-sm leading-relaxed mb-8 opacity-80 decoration-indigo-300">Organiza tu flujo de trabajo en segundos. Agrega tareas, prioriza y conquista el día.</p>
                 </div>
                 <button 
                  onClick={() => router.push('/tasks')}
                  className="relative z-10 w-full py-5 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-105 active:scale-95 transition-all"
                 >
                    Nueva Tarea
                 </button>
              </div>

              <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm flex flex-col justify-between h-[400px]">
                 <div>
                    <div className="flex items-center gap-3 mb-8">
                       <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center">
                          <CheckCircle className="text-emerald-500" size={24} />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Productividad</p>
                          <p className="text-lg font-black text-slate-800 tracking-tight">Estado de Cierre</p>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <div className="flex justify-between items-end mb-2">
                          <span className="text-sm font-black text-slate-700">Progreso Mensual</span>
                          <span className="text-2xl font-black text-indigo-600">82%</span>
                       </div>
                       <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                          <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-300 rounded-full" style={{ width: '82%' }}></div>
                       </div>
                    </div>
                 </div>
                 
                 <div className="pt-8 border-t border-slate-50">
                    <div className="flex items-center gap-4 text-slate-400">
                       <TrendingUp size={20} />
                       <p className="text-[10px] font-bold uppercase tracking-widest">+15% respecto al mes anterior</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>

        {/* Sidebar / Secondary Info */}
        <div className="space-y-12">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                <MessageSquare className="text-indigo-600" size={20} />
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">Notas Rápidas</h2>
            </div>

            <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden group">
               <div className="absolute top-4 right-8 text-[60px] font-black text-slate-50 -rotate-12 pointer-events-none group-hover:rotate-0 transition-transform duration-700">"</div>
               <div className="relative z-10 space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group-hover:border-indigo-100 group-hover:bg-white transition-all duration-500">
                     <p className="text-slate-500 font-bold italic text-sm mb-4 leading-relaxed">"Recordatorio: Llamar a los nuevos leads de la campaña de verano antes del viernes."</p>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Prioridad Alta</span>
                     </div>
                  </div>
                  
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 group-hover:border-indigo-100 group-hover:bg-white transition-all duration-500">
                     <p className="text-slate-500 font-bold italic text-sm mb-4 leading-relaxed">"Revisar el pipeline de ventas para el Q3 y ajustar proyecciones."</p>
                     <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200"></div>
                        <span className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Productividad</span>
                     </div>
                  </div>
               </div>
               
               <button className="mt-8 w-full py-4 border-2 border-dashed border-slate-200 text-slate-400 hover:text-indigo-500 hover:border-indigo-300 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">
                  + Agregar Nota
               </button>
            </div>
        </div>

      </div>
    </div>
  );
}

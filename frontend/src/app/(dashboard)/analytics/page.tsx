"use client"

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Target, 
  Zap, 
  ArrowUpRight, 
  ArrowDownRight, 
  Filter, 
  Calendar,
  Activity,
  PieChart as PieIcon,
  BarChart3,
  MousePointer2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";

// Mock Data
const mainTrendData = [
  { name: 'Lun', value: 400, interactions: 240 },
  { name: 'Mar', value: 300, interactions: 139 },
  { name: 'Mie', value: 200, interactions: 980 },
  { name: 'Jue', value: 278, interactions: 390 },
  { name: 'Vie', value: 189, interactions: 480 },
  { name: 'Sab', value: 239, interactions: 380 },
  { name: 'Dom', value: 349, interactions: 430 },
];

const funnelData = [
  { name: 'Prospectos', value: 450, fill: '#0ea5e9' },
  { name: 'Calificados', value: 300, fill: '#06b6d4' },
  { name: 'Negociación', value: 180, fill: '#22d3ee' },
  { name: 'Cerrados', value: 85, fill: '#10b981' },
];

const statusDistData = [
  { name: 'Activos', value: 400 },
  { name: 'Potenciales', value: 300 },
  { name: 'En Pausa', value: 200 },
  { name: 'Perdidos', value: 100 },
];

const COLORS = ['#0891b2', '#06b6d4', '#22d3ee', '#94a3b8'];

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        const resp = await fetch(`http://127.0.0.1:8000/api/analytics/summary?t=${Date.now()}`, {
           headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!resp.ok) throw new Error("Error cargando analíticas");
        
        const json = await resp.json();
        setData(json);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  const KPICard = ({ title, value, change, icon: Icon, color, isNegative = false }: any) => {
    const colorMap: any = {
      cyan: { 
        bg: 'bg-cyan-50', 
        text: 'bg-cyan-50 text-cyan-600',
        blur: 'bg-cyan-50'
      },
      emerald: { 
        bg: 'bg-emerald-50', 
        text: 'bg-emerald-50 text-emerald-600',
        blur: 'bg-emerald-50'
      },
      amber: { 
        bg: 'bg-amber-50', 
        text: 'bg-amber-50 text-amber-600',
        blur: 'bg-amber-50'
      },
      red: { 
        bg: 'bg-red-50', 
        text: 'bg-red-50 text-red-600',
        blur: 'bg-red-50'
      }
    };

    const colors = colorMap[color] || colorMap.cyan;

    return (
      <div className="bg-white border border-slate-100 p-6 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:shadow-slate-200/50 transition-all duration-500 group relative overflow-hidden">
        <div className={`absolute top-0 right-0 w-32 h-32 -mr-8 -mt-8 ${colors.blur} rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`}></div>
        <div className="flex justify-between items-start mb-4">
          <div className={`p-4 rounded-2xl ${colors.text} group-hover:scale-110 transition-transform duration-500 relative z-10`}>
            <Icon size={24} />
          </div>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${isNegative ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-500'} relative z-10 animate-in fade-in slide-in-from-right-4 duration-1000`}>
            {isNegative ? <ArrowDownRight size={12} /> : <ArrowUpRight size={12} />}
            {change}
          </div>
        </div>
        <div className="relative z-10">
          <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{title}</p>
          <h3 className="text-3xl font-black text-slate-900 tracking-tighter tracking-px">{value}</h3>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-10 animate-pulse p-4">
        <div className="h-12 w-1/4 bg-slate-100 rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1,2,3,4].map(i => <div key={i} className="h-44 bg-slate-50 rounded-[2.5rem]" />)}
        </div>
        <div className="h-[500px] bg-slate-50 rounded-[3rem]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div className="p-6 bg-red-50 text-red-500 rounded-full">
           <Activity size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">Ups! No pudimos cargar tus métricas</h2>
        <p className="text-slate-500 font-medium">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-xs tracking-widest mt-4">Reintentar</button>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-16 animate-in fade-in duration-700">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1.5 h-8 bg-cyan-500 rounded-full" />
            <h1 className="text-4xl font-black text-slate-900 tracking-tight">Inteligencia de Negocios</h1>
          </div>
          <p className="text-slate-500 font-medium">Análisis en tiempo real de tu tenant basado en datos reales del CRM.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-colors shadow-sm">
            <Calendar size={16} />
            Hoy: {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}
          </button>
          <button className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Leads Totales" 
          value={data?.kpis?.total_leads || 0} 
          change="+8.3%" 
          icon={Users} 
          color="cyan" 
        />
        <KPICard 
          title="Tasa de Cierre" 
          value={data?.kpis?.conversion_rate || "0%"} 
          change="+1.5%" 
          icon={Target} 
          color="emerald" 
        />
        <KPICard 
          title="Uso de IA" 
          value={data?.kpis?.ai_usage || 0} 
          change="+24%" 
          icon={Zap} 
          color="amber" 
        />
        <KPICard 
          title="Churn Rate" 
          value={data?.kpis?.churn_rate || "0%"} 
          change="-0.2%" 
          icon={Activity} 
          color="red" 
          isNegative={true}
        />
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Trend Area Chart */}
        <div className="xl:col-span-2 bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm flex flex-col gap-8 group transition-all duration-500 hover:shadow-2xl hover:shadow-slate-200/40 relative overflow-hidden">
          <div className="flex justify-between items-center relative z-10">
            <div>
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Actividad de la Última Semana</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-[0.1em] mt-1">Nuevos prospectos vs Notas procesadas</p>
            </div>
            <div className="flex gap-2">
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-50 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-cyan-500" />
                  <span className="text-[10px] font-black text-cyan-700 uppercase">Leads</span>
               </div>
               <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-slate-400" />
                  <span className="text-[10px] font-black text-slate-600 uppercase">Interacciones</span>
               </div>
            </div>
          </div>
          
          <div className="h-[350px] w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.main_trend || []}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 12, fontWeight: 700}}
                />
                <Tooltip 
                  contentStyle={{
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 20px 50px rgba(0,0,0,0.1)',
                    padding: '15px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#0891b2" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="interactions" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  fill="transparent" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Funnel Chart */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-[3rem] shadow-xl text-white flex flex-col gap-8 hover:scale-[1.02] transition-transform duration-500 group relative overflow-hidden">
           {/* Decorative background circle */}
           <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl opacity-50 group-hover:bg-cyan-500/10 transition-colors duration-1000" />
           
           <div className="flex items-center gap-3 relative z-10">
              <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                <Filter size={20} className="text-cyan-400" />
              </div>
              <div>
                <h3 className="text-xl font-black tracking-tight">Embudo de Ventas</h3>
                <p className="text-[10px] text-cyan-400/60 font-black uppercase tracking-widest leading-none mt-1">Pipeline Real del SaaS</p>
              </div>
           </div>

           <div className="flex-1 min-h-[300px] relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={data?.funnel || []} layout="vertical" margin={{ left: 0, right: 30 }}>
                    <XAxis type="number" hide />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: '#fff', fontSize: 11, fontWeight: 900}}
                      width={100}
                    />
                    <Tooltip 
                       cursor={{fill: 'rgba(255,255,255,0.05)'}}
                       contentStyle={{backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px'}}
                    />
                    <Bar dataKey="value" radius={[0, 10, 10, 0]} barSize={35}>
                       {(data?.funnel || []).map((entry: any, index: number) => {
                         const funnelColors = ['#0ea5e9', '#06b6d4', '#22d3ee', '#10b981'];
                         return <Cell key={`cell-${index}`} fill={funnelColors[index % 4]} />
                       })}
                    </Bar>
                 </BarChart>
              </ResponsiveContainer>
           </div>
           
           <div className="pt-6 border-t border-white/5 space-y-4 relative z-10">
              <div className="flex justify-between items-center">
                 <span className="text-xs text-white/40 font-bold uppercase tracking-widest">Tasa de Efectividad</span>
                 <span className="text-lg font-black text-emerald-400">{data?.kpis?.conversion_rate}</span>
              </div>
              <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                 <div className="bg-emerald-400 h-full rounded-full shadow-[0_0_15px_rgba(52,211,153,0.5)]" 
                      style={{ width: data?.kpis?.conversion_rate }} />
              </div>
           </div>
        </div>
      </div>

      {/* Bottom Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Sentiment Distribution */}
         <div className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm flex flex-col gap-6 group hover:shadow-xl transition-all duration-500">
            <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              <PieIcon size={20} className="text-cyan-500" />
              Distribución por Estatus
            </h3>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                    <Pie
                      data={data?.status_dist || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {(data?.status_dist || []).map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="middle" align="right" layout="vertical" />
                 </PieChart>
              </ResponsiveContainer>
            </div>
         </div>

         {/* Call to Action Card */}
         <div className="bg-gradient-to-br from-cyan-600 to-cyan-500 p-8 rounded-[3rem] shadow-2xl shadow-cyan-200 relative overflow-hidden flex flex-col justify-center gap-6 group">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
               <div className="w-16 h-16 bg-white/20 rounded-3xl backdrop-blur-md flex items-center justify-center text-white mb-6 transform group-hover:rotate-12 transition-transform duration-700">
                  <Zap size={32} />
               </div>
               <h3 className="text-3xl font-black text-white tracking-tight leading-tight mb-3">Maximiza tu rendimiento con IA</h3>
               <p className="text-cyan-50/80 font-medium text-lg leading-relaxed">
                 Nuestra asistente ha detectado {data?.kpis?.total_leads > 10 ? 'cuellos de botella' : 'oportunidades'} en tu ciclo de cierre. ¿Quieres ver el reporte estratégico?
               </p>
            </div>
            <button className="relative z-10 self-start mt-4 px-8 py-4 bg-white text-cyan-600 rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-all hover:-translate-y-1 active:translate-y-0 shadow-lg shadow-cyan-900/10">
               Ver Insights Estratégicos
            </button>
         </div>
      </div>
    </div>
  );
}

import { CalendarDays, Briefcase, TrendingUp, ArrowRight, Search } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Area */}
      <header className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-[2xl] md:text-3xl font-extrabold text-[#111827] tracking-tight">
            Buenos días, Alex
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Tu asistente de IA está listo para los objetivos de hoy.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative bg-white shadow-sm border border-slate-100 rounded-xl h-11 flex items-center px-4 w-64 focus-within:ring-2 ring-cyan-500/20 focus-within:border-cyan-400 transition-all">
            <Search size={18} className="text-slate-400 mr-2" />
            <input 
              type="text" 
              className="bg-transparent outline-none w-full text-sm text-slate-700 placeholder:text-slate-400"
              placeholder="Buscar información..."
            />
          </div>
        </div>
      </header>

      {/* KPI Cards Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-800">3</span>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Agendadas</span>
              </div>
            </div>
            <div className="bg-orange-100 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <CalendarDays className="text-orange-600" size={24} />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Citas</h3>
            <p className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
              <span className="min-w-[8px] h-2 rounded-full bg-orange-400"></span>
              Siguiente: Sincronización Diseño 11:00 AM
            </p>
          </div>
          <button className="text-orange-500 text-sm font-bold w-full mt-4 pt-4 border-t border-slate-100 hover:text-orange-600 transition flex items-center justify-center gap-1 group-hover:gap-2">
             Ver Calendario <ArrowRight size={16} />
          </button>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-800">5</span>
                <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Pendientes</span>
              </div>
            </div>
            <div className="bg-blue-100 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <Briefcase className="text-blue-600" size={24} />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Tareas Pendientes</h3>
             <p className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2 truncate">
              <span className="min-w-[8px] h-2 rounded-full bg-blue-400"></span>
              Propuesta Cliente
            </p>
          </div>
          <button className="text-blue-500 text-sm font-bold w-full mt-4 pt-4 border-t border-slate-100 hover:text-blue-600 transition flex items-center justify-center gap-1 group-hover:gap-2">
             Abrir Tareas <ArrowRight size={16} />
          </button>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 shadow-[0_4px_20px_-10px_rgba(0,0,0,0.05)] border border-slate-100 hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-3xl font-bold tracking-tight text-slate-800">+12%</span>
                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded-md">Crecimiento</span>
              </div>
            </div>
            <div className="bg-emerald-100 p-3 rounded-2xl group-hover:scale-110 transition-transform">
              <TrendingUp className="text-emerald-600" size={24} />
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-2">
             <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Estado Ventas</h3>
             <p className="text-sm font-medium text-slate-700 bg-slate-50 border border-slate-100 p-3 rounded-xl flex items-center gap-2">
              <span className="min-w-[8px] h-2 rounded-full bg-emerald-400"></span>
              $12,450.00 Ingresos del Mes
            </p>
          </div>
          <button className="text-emerald-600 text-sm font-bold w-full mt-4 pt-4 border-t border-slate-100 hover:text-emerald-700 transition flex items-center justify-center gap-1 group-hover:gap-2">
             Reporte Completo <ArrowRight size={16} />
          </button>
        </div>

      </div>

      {/* Main Content Area Placeholder */}
      <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-sm p-8 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight">Resumen de Actividad</h2>
            <select className="bg-slate-50 border border-slate-200 text-slate-600 text-sm rounded-xl px-4 py-2 outline-none font-semibold hover:bg-slate-100 transition-colors cursor-pointer">
              <option>Últimos 7 Días</option>
              <option>Últimos 30 Días</option>
            </select>
          </div>
          
          {/* Chart Placeholder */}
          <div className="h-[280px] w-full bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-200 border-dashed relative overflow-hidden">
             
             {/* Dummy Lines to simulate a chart background */}
             <div className="absolute inset-0 flex flex-col justify-between py-8 px-10 opacity-30 pointer-events-none">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="w-full border-t border-slate-300"></div>
                ))}
             </div>

            <span className="text-slate-400 font-semibold tracking-wide relative z-10 bg-slate-50 px-4 py-1 rounded-md">Cargando visualización de datos...</span>
          </div>
      </div>
    </div>
  );
}

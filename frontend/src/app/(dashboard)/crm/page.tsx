"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Mail, Phone, MapPin, Globe, CreditCard, Clock, Calendar, MessageSquare, MoreHorizontal, User, Building2, Trash2, Edit2, Filter, ArrowUpRight, CheckCircle, AlertCircle, TrendingUp } from "lucide-react";
import { useRouter } from "next/navigation";

interface Client {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: "lead" | "active" | "inactive";
  total_spend: number;
  last_contact: string | null;
  created_at: string;
  updated_at: string;
}

export default function CRMPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "lead" | "active" | "inactive">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newCompany, setNewCompany] = useState("");
  const [addingClient, setAddingClient] = useState(false);
  const router = useRouter();

  const fetchClients = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      setLoading(false);
      return;
    }

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/clients", {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        setClients(data);
      } else {
        console.error("Failed to load clients");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, [router]);

  const handleAddClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    setAddingClient(true);
    const token = localStorage.getItem("token");
    
    try {
      const resp = await fetch("http://127.0.0.1:8000/api/clients", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: newName,
          email: newEmail || null,
          company: newCompany || null,
          status: "lead"
        })
      });

      if (resp.ok) {
        const newClient = await resp.json();
        setClients([newClient, ...clients]);
        setNewName("");
        setNewEmail("");
        setNewCompany("");
        setShowAddForm(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingClient(false);
    }
  };

  const handleDeleteClient = async (clientId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este cliente?")) return;
    
    const token = localStorage.getItem("token");
    
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/clients/${clientId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (resp.ok) {
        setClients(clients.filter(c => c.id !== clientId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          client.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          client.company?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === "all" || client.status === filter;
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: clients.length,
    leads: clients.filter(c => c.status === "lead").length,
    active: clients.filter(c => c.status === "active").length,
    inactive: clients.filter(c => c.status === "inactive").length,
    totalSpent: clients.reduce((acc, c) => acc + c.total_spend, 0)
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Area */}
      <header className="flex flex-col gap-4 mb-8 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-[#00C2FF] rounded-2xl flex items-center justify-center shadow-xl shadow-cyan-100">
                <User size={20} className="text-white" strokeWidth={2.5} />
             </div>
             <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Gestión CRM</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Central de Inteligencia de Clientes</p>
             </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="md:hidden h-11 bg-slate-900 hover:bg-black text-white font-black text-[10px] px-5 rounded-2xl shadow-lg flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Nuevo
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group flex-1">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
             </div>
             <input 
                type="text" 
                placeholder="Buscar cliente, empresa o correo..." 
                className="bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 w-full text-sm font-bold text-slate-700 outline-none focus:border-cyan-400 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="hidden md:flex h-12 bg-slate-900 hover:bg-black text-white font-black uppercase tracking-widest text-[10px] px-8 rounded-2xl shadow-xl shadow-slate-200 active:translate-y-0 transition-all items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Nuevo Cliente
          </button>
        </div>
      </header>

      {/* Stats Quick View Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-10">
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-cyan-100 transition-all duration-300">
           <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-cyan-600 group-hover:bg-cyan-100 transition-colors">
              <TrendingUp size={24} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Leads</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.leads}</h3>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-emerald-100 transition-all duration-300">
           <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <CheckCircle size={24} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Activos</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.active}</h3>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-indigo-100 transition-all duration-300">
           <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:bg-indigo-100 transition-colors">
              <CreditCard size={24} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Ingresos</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">${stats.totalSpent.toLocaleString()}</h3>
           </div>
        </div>

        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 group hover:border-slate-200 transition-all duration-300">
           <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-600 group-hover:bg-slate-100 transition-colors">
              <User size={24} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Inactivos</p>
              <h3 className="text-2xl font-black text-slate-800 tracking-tight">{stats.inactive}</h3>
           </div>
        </div>
      </div>

       {/* Add Client Form */}
       {showAddForm && (
          <form onSubmit={handleAddClient} className="mb-8 bg-white p-8 rounded-[3rem] shadow-xl shadow-slate-200/50 border border-slate-100 animate-in slide-in-from-top-4 duration-500">
             <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">Registro de Nuevo Profiler</h3>
                <button type="button" onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-slate-600 p-2"><MoreHorizontal size={20} /></button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                   <input 
                     type="text"
                     placeholder="Ej: Juan Pérez"
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:bg-white transition-all font-bold"
                     value={newName}
                     onChange={(e) => setNewName(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                   <input 
                     type="email"
                     placeholder="usuario@dominio.com"
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:bg-white transition-all font-bold"
                     value={newEmail}
                     onChange={(e) => setNewEmail(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Empresa / Organización</label>
                   <input 
                     type="text"
                     placeholder="Nombre de la empresa"
                     className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:bg-white transition-all font-bold"
                     value={newCompany}
                     onChange={(e) => setNewCompany(e.target.value)}
                   />
                </div>
             </div>

             <div className="flex justify-end gap-3">
               <button 
                 type="button" 
                 onClick={() => setShowAddForm(false)}
                 className="px-8 py-3.5 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-2xl transition-all"
               >
                 Descartar
               </button>
               <button 
                 type="submit" 
                 disabled={addingClient || !newName.trim()}
                 className="px-10 py-3.5 bg-[#00C2FF] hover:bg-[#00b0e6] text-white text-[10px] font-black uppercase tracking-widest rounded-2xl shadow-lg shadow-cyan-200/50 hover:-translate-y-0.5 transition-all disabled:opacity-50"
               >
                 {addingClient ? "Procesando..." : "Finalizar Registro"}
               </button>
             </div>
          </form>
       )}

      {/* Filter Options Row */}
      <div className="flex items-center justify-between mb-8 overflow-x-auto pb-2 scrollbar-hide">
         <div className="flex p-1.5 bg-slate-100/70 rounded-2xl border border-slate-200/40 shrink-0">
            {[
              { id: "all", label: "Vista Global", icon: Globe },
              { id: "lead", label: "Nuevos Leads", icon: TrendingUp },
              { id: "active", label: "Activos", icon: CheckCircle },
              { id: "inactive", label: "Pasivos", icon: AlertCircle }
            ].map((opt) => (
               <button 
                 key={opt.id}
                 onClick={() => setFilter(opt.id as any)}
                 className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap ${
                   filter === opt.id 
                     ? "bg-white text-slate-900 shadow-md transform scale-105" 
                     : "text-slate-500 hover:text-slate-700"
                 }`}
               >
                 <opt.icon size={14} />
                 {opt.label}
               </button>
            ))}
         </div>
         
         <div className="flex items-center gap-4 ml-8 shrink-0">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{filteredClients.length} Entidades</p>
            <div className="h-8 w-px bg-slate-200"></div>
            <button className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-slate-100 text-slate-400 hover:text-slate-900 hover:shadow-md transition-all">
               <Filter size={18} />
            </button>
         </div>
      </div>

       {/* Content Area - Client Cards Grid */}
       {loading ? (
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
               <div key={i} className="h-64 bg-slate-50 rounded-[3rem] animate-pulse"></div>
            ))}
         </div>
       ) : filteredClients.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Building2 size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Sin resultados encontrados para "{searchQuery}"</p>
            <button onClick={() => setSearchQuery("")} className="mt-4 text-cyan-600 text-xs font-black uppercase tracking-widest hover:underline">Limpiar filtros</button>
         </div>
       ) : (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8 mb-12">
           {filteredClients.map((client) => (
             <div 
               key={client.id} 
               className="group bg-white rounded-[3rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_20px_50px_rgba(0,194,255,0.08)] hover:border-cyan-100 transition-all duration-500 flex flex-col h-[400px] relative overflow-hidden"
             >
               {/* Status Badge */}
               <div className="absolute top-8 right-8">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                    client.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                    client.status === 'lead' ? 'bg-cyan-50 text-cyan-600 border-cyan-100' : 
                    'bg-slate-50 text-slate-600 border-slate-100'
                  }`}>
                    {client.status}
                  </span>
               </div>

               {/* Profile Info */}
               <div className="flex flex-col items-center text-center mt-4 mb-8">
                  <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-4 border border-slate-100 group-hover:bg-[#00C2FF] group-hover:border-transparent transition-all duration-500 shadow-inner">
                     <User size={32} className="text-slate-300 group-hover:text-white transition-colors duration-500" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 tracking-tight mb-1 group-hover:text-[#00C2FF] transition-colors">{client.name}</h3>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{client.company || 'Entidad Independiente'}</p>
               </div>

               {/* Contact Actions */}
               <div className="space-y-3 mb-8">
                  <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl group/item hover:bg-slate-50 transition-colors">
                     <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover/item:text-cyan-500 shadow-sm">
                        <Mail size={14} />
                     </div>
                     <span className="text-[11px] font-bold text-slate-600 truncate">{client.email || 'Sin correo registrado'}</span>
                  </div>
                  <div className="flex items-center gap-4 bg-slate-50/50 p-3 rounded-2xl group/item hover:bg-slate-50 transition-colors">
                     <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-400 group-hover/item:text-cyan-500 shadow-sm">
                        <Phone size={14} />
                     </div>
                     <span className="text-[11px] font-bold text-slate-600">{client.phone || '-- --- --- --'}</span>
                  </div>
               </div>

               {/* Card Footer */}
               <div className="mt-auto pt-6 border-t border-slate-50 flex items-center justify-between">
                  <div>
                     <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mb-1">Inversión Total</p>
                     <p className="text-lg font-black text-slate-800 tracking-tight">${client.total_spend.toLocaleString()}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleDeleteClient(client.id)}
                    className="w-10 h-10 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 transform group-hover:translate-x-0 translate-x-4 opacity-0 group-hover:opacity-100"
                  >
                     <Trash2 size={16} />
                  </button>

                  <button className="h-10 px-5 flex items-center gap-2 rounded-2xl bg-slate-900 text-white text-[9px] font-black uppercase tracking-widest hover:bg-black transition-all group-hover:shadow-xl group-hover:shadow-slate-200">
                     Ver Perfil <ArrowUpRight size={14} strokeWidth={3} />
                  </button>
               </div>

               {/* Background Decorative Element */}
               <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-cyan-500/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
             </div>
           ))}
         </div>
       )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Phone, Mail, Filter, ArrowDownUp, X, Edit2, Trash2, User, Building2, MessageSquare, History, Globe, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  customer_type: string;
  status: string;
  interactions_count?: number;
}

export default function CRMContactsPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "prospect" | "client">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [savingCustomer, setSavingCustomer] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    company: "",
    email: "",
    phone: "",
    customer_type: "prospect" as "prospect" | "client",
    status: "ACTIVO" as "ACTIVO" | "PENDIENTE" | "CERRADO"
  });
  const router = useRouter();

  const handleViewCustomer = (customerId: string) => {
    router.push(`/crm/${customerId}`);
  };

  useEffect(() => {
    const fetchCustomers = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        let url = "http://127.0.0.1:8000/api/crm/customers";
        if (filter !== "all") {
          url += `?customer_type=${filter}`;
        }
        
        const resp = await fetch(url, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });
        
        if (resp.ok) {
          const data = await resp.json();
          setCustomers(data);
        }
      } catch (err) {
        console.error("Connection error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCustomers();

    const handleRefresh = () => {
      console.log("Señal de actualización del CRM recibida en Lista Contactos...");
      fetchCustomers();
    };

    window.addEventListener("crmDataRefreshed", handleRefresh);
    return () => window.removeEventListener("crmDataRefreshed", handleRefresh);
  }, [router, filter]);

  const handleFilterChange = (newFilter: "all" | "prospect" | "client") => {
    setFilter(newFilter);
  };

  const handleOpenAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      first_name: "",
      last_name: "",
      company: "",
      email: "",
      phone: "",
      customer_type: "prospect",
      status: "ACTIVO"
    });
    setShowCustomerModal(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      first_name: customer.first_name,
      last_name: customer.last_name || "",
      company: customer.company || "",
      email: customer.email || "",
      phone: customer.phone || "",
      customer_type: customer.customer_type as "prospect" | "client",
      status: customer.status as "ACTIVO" | "PENDIENTE" | "CERRADO"
    });
    setShowCustomerModal(true);
  };

  const handleCloseModal = () => {
    setShowCustomerModal(false);
    setEditingCustomer(null);
  };

  const handleSaveCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name.trim()) return;

    setSavingCustomer(true);
    const token = localStorage.getItem("token");

    try {
      const url = editingCustomer 
        ? `http://127.0.0.1:8000/api/crm/customers/${editingCustomer.id}`
        : "http://127.0.0.1:8000/api/crm/customers";

      const method = editingCustomer ? "PUT" : "POST";

      const resp = await fetch(url, {
        method: method,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          first_name: formData.first_name,
          last_name: formData.last_name || null,
          company: formData.company || null,
          email: formData.email || null,
          phone: formData.phone || null,
          customer_type: formData.customer_type,
          status: formData.status
        })
      });

      if (resp.ok) {
        const savedCustomer = await resp.json();
        if (editingCustomer) {
          setCustomers(customers.map(c => c.id === editingCustomer.id ? savedCustomer : c));
        } else {
          setCustomers([savedCustomer, ...customers]);
        }
        handleCloseModal();
      }
    } catch (err) {
      console.error("Error saving customer:", err);
    } finally {
      setSavingCustomer(false);
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar este contacto?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const resp = await fetch(`http://localhost:8000/api/crm/customers/${customerId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (resp.ok) {
        setCustomers(customers.filter(c => c.id !== customerId));
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    `${c.first_name} ${c.last_name} ${c.company}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getInitials = (first: string, last: string | null) => {
    return `${first.charAt(0)}${last ? last.charAt(0) : ''}`.toUpperCase();
  };

  const avatarGradients = [
    "from-indigo-500 to-purple-600",
    "from-emerald-500 to-teal-600",
    "from-rose-500 to-orange-600",
    "from-cyan-500 to-blue-600",
    "from-amber-500 to-orange-600"
  ];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Area */}
      <header className="flex flex-col gap-4 mb-6 md:mb-10">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 group">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-transform duration-500">
               <User className="text-indigo-600" size={22} />
            </div>
            <div>
              <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                Contactos
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm">
                  <Sparkles size={10} className="animate-pulse" />
                  CRM Premium
                </div>
              </div>
            </div>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-4 md:gap-8 bg-white/50 backdrop-blur-sm p-3 md:p-4 rounded-2xl border border-slate-200/60 shadow-sm overflow-x-auto">
            <div className="flex flex-col gap-0.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-widest text-center">Total</span>
              <span className="text-xl md:text-2xl font-black text-slate-800 leading-none text-center">{customers.length}</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex flex-col gap-0.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-widest text-center">Clientes</span>
              <span className="text-xl md:text-2xl font-black text-slate-800 leading-none text-center">{customers.filter(c => c.customer_type === 'client').length}</span>
            </div>
            <div className="w-px h-6 bg-slate-200"></div>
            <div className="flex flex-col gap-0.5 shrink-0">
              <span className="text-[10px] uppercase font-bold text-amber-400 tracking-widest text-center">Prospectos</span>
              <span className="text-xl md:text-2xl font-black text-slate-800 leading-none text-center">{customers.filter(c => c.customer_type === 'prospect').length}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
          <div className="relative group w-full">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Busca por nombre, empresa..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-12 bg-white/80 backdrop-blur-md shadow-md border border-slate-200 rounded-2xl pl-11 pr-4 text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none focus:border-indigo-400 transition-all" 
            />
          </div>
          <button
            onClick={handleOpenAddModal}
            className="h-12 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white font-bold tracking-wide px-6 rounded-2xl shadow-lg shadow-indigo-500/30 active:translate-y-0 transition-all flex items-center justify-center gap-2 shrink-0"
          >
            <Plus size={20} strokeWidth={3} /> Nuevo Contacto
          </button>
        </div>
      </header>

       {/* Filter and View Options */}
       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 md:mb-10">
          <div className="flex p-1 bg-slate-100 rounded-2xl shadow-inner border border-slate-200/50 overflow-x-auto w-full sm:w-auto">
             {[
               { id: "all", label: "Todos", count: customers.length },
               { id: "prospect", label: "Prospectos", count: customers.filter(c => c.customer_type === 'prospect').length },
               { id: "client", label: "Clientes", count: customers.filter(c => c.customer_type === 'client').length }
             ].map((btn) => (
               <button
                  key={btn.id}
                  onClick={() => handleFilterChange(btn.id as any)}
                  className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2 shrink-0 ${
                    filter === btn.id
                      ? "bg-white text-slate-900 shadow-md ring-1 ring-slate-200"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
               >
                  {btn.label}
                  <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                    filter === btn.id 
                      ? btn.id === "prospect" ? "bg-amber-100 text-amber-600" : btn.id === "client" ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"
                      : "bg-slate-200 text-slate-500"
                  }`}>
                    {btn.count}
                  </span>
               </button>
             ))}
          </div>
         
         <div className="hidden sm:flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
             <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors group">
                <ArrowDownUp size={14} className="group-hover:scale-110 transition-transform" /> 
                <span>Ordenar</span>
             </button>
             <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
             <button className="flex items-center gap-2 hover:text-indigo-600 transition-colors group">
                <Filter size={14} className="group-hover:scale-110 transition-transform" /> 
                <span>Filtros</span>
             </button>
         </div>
       </div>

       {/* Contacts Grid */}
       <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
         
         {loading ? (
               <div className="col-span-full flex flex-col items-center justify-center py-24 gap-4">
                 <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin"></div>
                 <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Sincronizando base de contactos...</p>
               </div>
         ) : filteredCustomers.length === 0 ? (
               <div className="col-span-full flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-300 gap-4">
                  <Building2 size={48} className="text-slate-200" />
                  <div className="text-center">
                    <p className="text-slate-500 font-bold text-lg">No hay contactos registrados</p>
                    <p className="text-slate-400 text-sm italic">Comienza agregando tu primer cliente o prospecto hoy.</p>
                  </div>
               </div>
         ) : (
               filteredCustomers.map((contact, idx) => {
                 const statusColors = {
                   ACTIVO: "bg-emerald-100 text-emerald-700 border-emerald-200",
                   PENDIENTE: "bg-amber-100 text-amber-700 border-amber-200",
                   CERRADO: "bg-rose-100 text-rose-700 border-rose-200"
                 };

                 const typeColors = {
                   client: "bg-indigo-50 text-indigo-700 border-indigo-100",
                   prospect: "bg-slate-50 text-slate-600 border-slate-200"
                 };
                 
                 const status = contact.status.toUpperCase() as keyof typeof statusColors;
                 const type = contact.customer_type as keyof typeof typeColors;

                 const gradientClass = avatarGradients[idx % avatarGradients.length];
                 
                  return (
                    <div
                      key={contact.id}
                      onClick={() => handleViewCustomer(contact.id)}
                      className="group bg-white rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 hover:shadow-[0_20px_50px_rgba(79,70,229,0.1)] hover:border-indigo-200 hover:-translate-y-2 transition-all duration-500 cursor-pointer relative overflow-hidden flex flex-col h-full"
                    >
                     {/* Decorative element */}
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
                     
                     {/* Header: Actions */}
                     <div className="flex justify-between items-start relative z-10 mb-8">
                        <div className="relative">
                           <div className={`w-20 h-20 rounded-[2.5rem] bg-gradient-to-br ${gradientClass} flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform duration-500`}>
                              {getInitials(contact.first_name, contact.last_name)}
                           </div>
                           <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white ${contact.status === 'ACTIVO' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                        </div>

                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white shadow-xl border border-slate-100 p-1.5 rounded-2xl">
                           <button 
                             onClick={(e) => { e.stopPropagation(); handleOpenEditModal(contact); }}
                             className="p-2 hover:bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                           >
                              <Edit2 size={16} />
                           </button>
                           <button 
                              onClick={(e) => { e.stopPropagation(); handleDeleteCustomer(contact.id); }}
                              className="p-2 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-xl transition-all"
                           >
                              <Trash2 size={16} />
                           </button>
                        </div>
                     </div>

                     {/* Content */}
                     <div className="relative z-10 flex-grow">
                       <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-tight mb-2 group-hover:text-indigo-600 transition-colors">
                         {contact.first_name} {contact.last_name || ""}
                       </h3>
                       <div className="flex items-center gap-2 mb-6">
                         <div className="flex items-center justify-center w-6 h-6 bg-slate-100 rounded-lg text-slate-400">
                            <Building2 size={12} />
                         </div>
                         <p className="text-sm font-bold text-slate-500 truncate max-w-[200px]">
                            {contact.company || "Particular"}
                         </p>
                       </div>

                       <div className="flex flex-wrap gap-2">
                         <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${typeColors[type]}`}>
                           {type === 'client' ? '💼 Socio Comercial' : '🔍 Lead Potencial'}
                         </span>
                         <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${statusColors[status] || statusColors.CERRADO}`}>
                           {contact.status}
                         </span>
                       </div>
                     </div>

                     {/* Footer: Quick Stats */}
                     <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between relative z-10 font-bold">
                        <div className="flex items-center gap-3">
                           <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-2xl text-[10px]">
                              <MessageSquare size={13} fill="currentColor" className="opacity-20" />
                              <span>{contact.interactions_count || 0} Historial</span>
                           </div>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 text-[10px] tracking-tight group-hover:text-indigo-400 transition-colors">
                           <History size={13} />
                           {contact.interactions_count && contact.interactions_count > 0 ? (
                             <span>Actividad <strong className="text-slate-800 ml-0.5">Reciente</strong></span>
                           ) : (
                             <span>Sin actividad <strong className="text-slate-800 ml-0.5">—</strong></span>
                           )}
                        </div>
                     </div>
                    </div>
                  );
               })
          )}

       </div>

       {/* Modal */}
       {showCustomerModal && (
         <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-0 md:p-6 animate-in fade-in duration-300">
           <div className="bg-white rounded-t-[2rem] md:rounded-[3rem] shadow-2xl w-full md:max-w-2xl max-h-[95dvh] md:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300">
             {/* Handle para móvil */}
             <div className="md:hidden flex justify-center pt-3 pb-1 shrink-0">
               <div className="w-10 h-1 bg-slate-200 rounded-full" />
             </div>
             {/* Modal Header */}
             <div className="relative p-6 md:p-10 pb-4 md:pb-6 shrink-0">
               <div className="flex items-center justify-between">
                 <div className="flex items-center gap-3 md:gap-5">
                   <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl md:rounded-[2rem] flex items-center justify-center shadow-xl shadow-indigo-500/40">
                     {editingCustomer ? <Edit2 size={20} className="text-white" /> : <Plus size={20} className="text-white" />}
                   </div>
                   <div>
                     <h2 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-none mb-1">
                       {editingCustomer ? "Editar Contacto" : "Nuevo Contacto"}
                     </h2>
                     <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Configuración de CRM</p>
                   </div>
                 </div>
                 <button
                   onClick={handleCloseModal}
                   className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl transition-all"
                 >
                   <X size={20} />
                 </button>
               </div>
             </div>

             {/* Modal Body */}
             <form onSubmit={handleSaveCustomer} className="flex-grow overflow-y-auto px-6 md:px-10 pb-6 md:pb-10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-8 py-4 md:py-6 border-y border-slate-100">
                 {/* Basic Info Group */}
                 <div className="md:col-span-2">
                    <h4 className="text-[10px] font-black uppercase text-indigo-500 mb-6 tracking-[0.3em]">Identidad</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Primer Nombre <span className="text-rose-500">*</span></label>
                        <div className="relative">
                           <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                           <input
                            type="text"
                            required
                            className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm text-slate-700 font-bold outline-none ring-offset-4 focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-300"
                            value={formData.first_name}
                            onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                            placeholder="Ej: Sebastián"
                          />
                        </div>
                      </div>
                      <div className="group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Apellido</label>
                        <input
                          type="text"
                          className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] px-6 py-4 text-sm text-slate-700 font-bold outline-none ring-offset-4 focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-300"
                          value={formData.last_name}
                          onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                          placeholder="Ej: Castillo"
                        />
                      </div>
                    </div>
                 </div>

                 {/* Organization Info */}
                 <div className="md:col-span-2 group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Firma / Organización</label>
                    <div className="relative">
                       <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input
                        type="text"
                        className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm text-slate-700 font-bold outline-none ring-offset-4 focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-300"
                        value={formData.company}
                        onChange={(e) => setFormData({...formData, company: e.target.value})}
                        placeholder="Ej: Vanguardia Digital S.A.P.I."
                      />
                    </div>
                 </div>

                 {/* Communication Details */}
                 <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Canal de Correo</label>
                    <div className="relative">
                       <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input
                        type="email"
                        className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm text-slate-700 font-bold outline-none ring-offset-4 focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-300"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="contacto@hub.com"
                      />
                    </div>
                 </div>
                 <div className="group">
                    <label className="block text-[10px) font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Móvil / Enlace</label>
                    <div className="relative">
                       <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <input
                        type="tel"
                        className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm text-slate-700 font-bold outline-none ring-offset-4 focus:bg-white focus:border-indigo-400 transition-all placeholder:text-slate-300"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        placeholder="+52 55..."
                      />
                    </div>
                 </div>

                 {/* Segmentation */}
                 <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Estratificación</label>
                    <div className="relative">
                       <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                       <select
                        className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm text-slate-700 font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                        value={formData.customer_type}
                        onChange={(e) => setFormData({...formData, customer_type: e.target.value as "prospect" | "client"})}
                      >
                        <option value="prospect">Lead Potencial (Prospecto)</option>
                        <option value="client">Socio Comercial (Cliente)</option>
                      </select>
                    </div>
                 </div>
                 <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 group-focus-within:text-indigo-500 transition-colors">Fase de Lifecycle</label>
                    <div className="relative">
                       <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full ${formData.status === 'ACTIVO' ? 'bg-emerald-500' : formData.status === 'PENDIENTE' ? 'bg-amber-500' : 'bg-rose-500 shadow-lg'}`}></div>
                       <select
                        className="w-full bg-slate-50 border-2 border-transparent rounded-[1.25rem] pl-12 pr-4 py-4 text-sm text-slate-700 font-bold outline-none focus:bg-white focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                        value={formData.status}
                        onChange={(e) => setFormData({...formData, status: e.target.value as "ACTIVO" | "PENDIENTE" | "CERRADO"})}
                      >
                        <option value="ACTIVO">Fase Activa</option>
                        <option value="PENDIENTE">Fase de Seguimiento</option>
                        <option value="CERRADO">Fase Inactiva / Cerrado</option>
                      </select>
                    </div>
                 </div>
               </div>

               {/* Action Footer */}
               <div className="flex items-center gap-4 mt-10">
                 <button
                   type="button"
                   onClick={handleCloseModal}
                   className="flex-1 px-8 py-5 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-[1.5rem] transition-all"
                 >
                   Cancelar
                 </button>
                 <button
                   type="submit"
                   disabled={savingCustomer}
                   className="flex-[2] px-8 py-5 bg-gradient-to-r from-indigo-600 to-indigo-800 text-white text-sm font-black uppercase tracking-[0.2em] rounded-[1.5rem] shadow-2xl shadow-indigo-500/40 hover:shadow-indigo-500/60 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50"
                 >
                   {savingCustomer ? "Sincronizando..." : (editingCustomer ? "Confirmar Cambios" : "Propulsar Lead")}
                 </button>
               </div>
             </form>
           </div>
         </div>
       )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { 
  Plus, Search, Filter, Calendar, CheckCircle, Clock, 
  AlertCircle, MoreVertical, Edit2, Trash2, X, ChevronRight,
  LayoutGrid, List, Tag, ArrowUpRight, Check, Sparkles
} from "lucide-react";
import { useRouter } from "next/navigation";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  tag: string | null;
  created_at: string;
  updated_at: string;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Create Task State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newDueDate, setNewDueDate] = useState("");
  const [newTag, setNewTag] = useState("");
  const [creatingTask, setCreatingTask] = useState(false);

  // Edit Task State
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editTag, setEditTag] = useState("");
  const [updatingTask, setUpdatingTask] = useState(false);

  const router = useRouter();

  useEffect(() => {
    fetchTasks();
  }, [filterStatus]);

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      let url = "http://127.0.0.1:8000/api/tasks";
      if (filterStatus !== "all") {
        url += `?status=${filterStatus}`;
      }
      
      const resp = await fetch(url, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Fetch tasks error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setCreatingTask(true);
    const token = localStorage.getItem("token");

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/tasks", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: newTitle,
          description: newDescription || null,
          priority: newPriority,
          status: "pending",
          due_date: newDueDate || null,
          tag: newTag.startsWith("#") ? newTag : newTag ? `#${newTag}` : null
        })
      });

      if (resp.ok) {
        const created = await resp.json();
        setTasks([created, ...tasks]);
        setShowCreateModal(false);
        resetCreateForm();
      }
    } catch (err) {
      console.error("Create task error:", err);
    } finally {
      setCreatingTask(false);
    }
  };

  const resetCreateForm = () => {
    setNewTitle("");
    setNewDescription("");
    setNewPriority("medium");
    setNewDueDate("");
    setNewTag("");
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editTitle.trim()) return;

    setUpdatingTask(true);
    const token = localStorage.getItem("token");

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${selectedTask.id}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          status: editStatus,
          priority: editPriority,
          due_date: editDueDate || null,
          tag: editTag ? (editTag.startsWith("#") ? editTag : `#${editTag}`) : null
        })
      });

      if (resp.ok) {
        const updated = await resp.json();
        setTasks(tasks.map(t => t.id === selectedTask.id ? updated : t));
        handleCloseTaskModal();
      }
    } catch (err) {
      console.error("Update task error:", err);
    } finally {
      setUpdatingTask(false);
    }
  };

  const handleQuickStatusUpdate = async (taskId: string, newStatus: string) => {
    const token = localStorage.getItem("token");
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ...task,
          status: newStatus
        })
      });

      if (resp.ok) {
        const updated = await resp.json();
        setTasks(tasks.map(t => t.id === taskId ? updated : t));
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("¿Eliminar esta tarea definitivamente?")) return;
    
    const token = localStorage.getItem("token");
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (resp.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
        if (selectedTask?.id === taskId) {
          handleCloseTaskModal();
        }
      }
    } catch (err) {
      console.error("Delete task error:", err);
    }
  };

  const handleOpenTaskModal = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditStatus(task.status);
    setEditPriority(task.priority);
    setEditDueDate(task.due_date ? task.due_date.split('T')[0] : "");
    setEditTag(task.tag || "");
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const filteredTasks = tasks.filter(t => 
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description?.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (t.tag?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-rose-600 bg-rose-50 border-rose-100";
      case "high": return "text-orange-600 bg-orange-50 border-orange-100";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-100";
      case "low": return "text-emerald-600 bg-emerald-50 border-emerald-100";
      default: return "text-slate-600 bg-slate-50 border-slate-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="text-emerald-500" size={18} />;
      case "in_progress": return <Clock className="text-indigo-500 animate-pulse" size={18} />;
      default: return <AlertCircle className="text-slate-300" size={18} />;
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Sin fecha";
    return new Date(dateStr).toLocaleDateString("es-ES", { day: '2-digit', month: 'short' });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("es-ES", { 
      day: '2-digit', 
      month: 'long',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Upper Header */}
      <header className="flex flex-col gap-6 mb-8 md:mb-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="flex items-center gap-4 group">
            <div className="w-12 h-12 md:w-16 md:h-16 bg-white rounded-[2rem] shadow-xl border border-slate-100 flex items-center justify-center -rotate-6 group-hover:rotate-0 transition-all duration-500">
               <CheckCircle className="text-indigo-600" size={28} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500">Workspace</span>
                <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Productividad</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight leading-none">
                Tareas
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex p-1 bg-white rounded-2xl shadow-sm border border-slate-100">
               <button 
                 onClick={() => setViewMode("grid")}
                 className={`p-2 rounded-xl transition-all ${viewMode === "grid" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               >
                 <LayoutGrid size={20} />
               </button>
               <button 
                 onClick={() => setViewMode("list")}
                 className={`p-2 rounded-xl transition-all ${viewMode === "list" ? "bg-indigo-50 text-indigo-600 shadow-sm" : "text-slate-400 hover:text-slate-600"}`}
               >
                 <List size={20} />
               </button>
             </div>
             
             <button
               onClick={() => setShowCreateModal(true)}
               className="h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black px-6 rounded-2xl shadow-lg shadow-indigo-500/25 flex items-center gap-2 transition-all active:scale-95"
             >
               <Plus size={20} strokeWidth={3} /> <span className="hidden sm:inline">Nueva Tarea</span>
             </button>
          </div>
        </div>

        {/* Search & Basic Filters */}
        <div className="flex flex-col lg:flex-row gap-4">
           <div className="relative group flex-grow">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
             <input 
               type="text" 
               placeholder="Busca por título, etiqueta o descripción..." 
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full h-14 bg-white shadow-sm border border-slate-200 rounded-2xl pl-12 pr-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 transition-all" 
             />
           </div>

           <div className="flex p-1 bg-slate-100 rounded-2xl shadow-inner border border-slate-200/50 overflow-x-auto">
             {[
               { id: "all", label: "Todas", color: "bg-slate-200 text-slate-600" },
               { id: "pending", label: "Pendientes", color: "bg-amber-100 text-amber-600" },
               { id: "in_progress", label: "En Curso", color: "bg-indigo-100 text-indigo-600" },
               { id: "completed", label: "Listas", color: "bg-emerald-100 text-emerald-600" }
             ].map((btn) => (
               <button
                  key={btn.id}
                  onClick={() => setFilterStatus(btn.id)}
                  className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all duration-300 flex items-center gap-2 shrink-0 ${
                    filterStatus === btn.id
                      ? "bg-white text-slate-900 shadow-md"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
               >
                  {btn.label}
                  <span className={`px-2 py-0.5 rounded-md text-[10px] ${
                    filterStatus === btn.id ? btn.color : "bg-slate-200 text-slate-400"
                  }`}>
                    {btn.id === "all" ? tasks.length : tasks.filter(t => t.status === btn.id).length}
                  </span>
               </button>
             ))}
           </div>
        </div>
      </header>

      {/* Task Creation Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl flex items-center justify-center z-[100] p-4 animate-in fade-in duration-300">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-8 md:p-12">
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center">
                        <Plus className="text-indigo-600" size={24} strokeWidth={3} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-slate-900">Nueva Tarea</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Define tu próximo objetivo</p>
                      </div>
                   </div>
                   <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all text-slate-400">
                     <X size={20} />
                   </button>
                </div>

                <form onSubmit={handleCreateTask} className="space-y-6">
                   <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-indigo-600">Título de la Tarea</label>
                      <input 
                        autoFocus
                        required
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                        placeholder="Ej: Revisar propuesta de marketing"
                        value={newTitle}
                        onChange={(e) => setNewTitle(e.target.value)}
                      />
                   </div>

                   <div className="group">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1 group-focus-within:text-indigo-600">Descripción (Opcional)</label>
                      <textarea 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm resize-none"
                        rows={3}
                        placeholder="Añade detalles relevantes..."
                        value={newDescription}
                        onChange={(e) => setNewDescription(e.target.value)}
                      />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Prioridad</label>
                        <select 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-400 transition-all shadow-sm appearance-none"
                          value={newPriority}
                          onChange={(e) => setNewPriority(e.target.value as any)}
                        >
                          <option value="low">Baja 🟢</option>
                          <option value="medium">Media 🟡</option>
                          <option value="high">Alta 🟠</option>
                          <option value="urgent">Urgente 🔴</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Vencimiento</label>
                        <input 
                          type="date"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none cursor-pointer focus:border-indigo-400 transition-all shadow-sm"
                          value={newDueDate}
                          onChange={(e) => setNewDueDate(e.target.value)}
                        />
                      </div>
                   </div>

                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 ml-1">Etiqueta (#)</label>
                      <div className="relative">
                        <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                        <input 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 focus:bg-white transition-all shadow-sm"
                          placeholder="marketing, ventas, personal..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                        />
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        type="button" 
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 h-14 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all"
                      >
                        Cancelar
                      </button>
                      <button 
                         disabled={creatingTask || !newTitle.trim()}
                         className="flex-[2] h-14 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50"
                      >
                         {creatingTask ? "Creando..." : "Lanzar Tarea"}
                      </button>
                   </div>
                </form>
             </div>
           </div>
        </div>
      )}

      {/* Main Content Area */}
      {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div className="w-16 h-16 border-4 border-slate-100 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="text-center">
              <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-xs">Cargando Tareas</p>
              <p className="text-slate-300 text-[10px] italic">Organizando tu productividad...</p>
            </div>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-8 bg-white/50 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-200 text-center animate-in zoom-in-95 duration-500">
             <div className="w-20 h-20 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6">
                <Calendar className="text-slate-300" size={32} />
             </div>
             <h3 className="text-2xl font-black text-slate-800 mb-2">No se encontraron tareas</h3>
             <p className="text-slate-400 font-medium max-w-md mx-auto mb-8">
               {searchTerm ? `No hay resultados para "${searchTerm}". Intenta con otros términos.` : "Tu bandeja de entrada está limpia. Es un buen momento para planificar nuevos objetivos."}
             </p>
             {!searchTerm && (
                <button 
                  onClick={() => setShowCreateModal(true)}
                  className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-indigo-500/20 hover:scale-105 active:scale-95 transition-all"
                >
                  Crear mi Primera Tarea
                </button>
             )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
            {filteredTasks.map((task) => (
              <div 
                key={task.id}
                onClick={() => handleOpenTaskModal(task)}
                className="group relative bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-100 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col h-full"
              >
                {/* Priority Indicator Line */}
                <div className={`absolute top-0 left-0 w-full h-1.5 ${
                  task.priority === 'urgent' ? 'bg-rose-500' : 
                  task.priority === 'high' ? 'bg-orange-500' :
                  task.priority === 'medium' ? 'bg-amber-500' : 'bg-emerald-500'
                }`}></div>

                {/* Card Top */}
                <div className="flex justify-between items-start mb-6">
                   <div className={`p-2.5 rounded-2xl ${getPriorityColor(task.priority)}`}>
                      <span className="text-[9px] font-black uppercase tracking-widest">{task.priority}</span>
                   </div>
                   <div className="flex items-center gap-1">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleQuickStatusUpdate(task.id, task.status === 'completed' ? 'pending' : 'completed');
                        }}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                          task.status === 'completed' 
                            ? 'bg-emerald-50 text-emerald-600' 
                            : 'bg-slate-50 text-slate-300 hover:bg-slate-100 hover:text-slate-400'
                        }`}
                      >
                         <Check size={18} strokeWidth={3} />
                      </button>
                   </div>
                </div>

                {/* Card Info */}
                <div className="flex-grow">
                   <h3 className={`text-xl font-black tracking-tight leading-tight mb-3 transition-all ${
                     task.status === 'completed' ? 'text-slate-400 line-through decoration-2' : 'text-slate-800'
                   }`}>
                     {task.title}
                   </h3>
                   {task.description && (
                     <p className="text-sm font-bold text-slate-400 line-clamp-2 mb-6">
                        {task.description}
                     </p>
                   )}
                </div>

                {/* Card Footer */}
                <div className="mt-auto space-y-4">
                   <div className="flex flex-wrap gap-2">
                      {task.tag && (
                         <div className="flex items-center gap-1.5 bg-slate-50 text-slate-500 px-3 py-1.5 rounded-xl border border-slate-100">
                            <Tag size={12} className="opacity-50" />
                            <span className="text-[10px] font-black">{task.tag}</span>
                         </div>
                      )}
                      <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-500 px-3 py-1.5 rounded-xl border border-indigo-100 ml-auto">
                        <Calendar size={12} className="opacity-50" />
                        <span className="text-[10px] font-black">{formatDate(task.due_date)}</span>
                      </div>
                   </div>

                   <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                         <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                           task.status === 'completed' ? 'bg-emerald-50' : task.status === 'in_progress' ? 'bg-indigo-50' : 'bg-slate-50'
                         }`}>
                           {getStatusIcon(task.status)}
                         </div>
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                           {task.status === 'in_progress' ? 'En Progreso' : task.status === 'completed' ? 'Completado' : 'Pendiente'}
                         </span>
                      </div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-50">
                    <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tarea</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Estado</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Prioridad</th>
                    <th className="px-6 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vencimiento</th>
                    <th className="px-8 py-6 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredTasks.map((task) => (
                    <tr 
                      key={task.id} 
                      onClick={() => handleOpenTaskModal(task)}
                      className="group hover:bg-slate-50/50 transition-colors cursor-pointer"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                           <button 
                             onClick={(e) => {
                               e.stopPropagation();
                               handleQuickStatusUpdate(task.id, task.status === 'completed' ? 'pending' : 'completed');
                             }}
                             className={`w-9 h-9 rounded-[1rem] flex items-center justify-center transition-all shrink-0 ${
                               task.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-white border-2 border-slate-100 text-slate-200 hover:border-indigo-400 hover:text-indigo-400'
                             }`}
                           >
                             <Check size={16} strokeWidth={4} />
                           </button>
                           <div>
                             <p className={`font-black tracking-tight ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
                               {task.title}
                             </p>
                             {task.tag && (
                               <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{task.tag}</span>
                             )}
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex items-center gap-2">
                           {getStatusIcon(task.status)}
                           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">{task.status}</span>
                         </div>
                      </td>
                      <td className="px-6 py-6">
                         <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest inline-block border ${getPriorityColor(task.priority)}`}>
                            {task.priority}
                         </span>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-slate-600">{formatDate(task.due_date)}</span>
                            {task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed' && (
                              <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Vencido</span>
                            )}
                         </div>
                      </td>
                      <td className="px-8 py-6 text-right">
                         <button className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-white rounded-xl shadow-sm transition-all">
                            <ChevronRight size={18} />
                         </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Floating Add Button for Mobile */}
        <button 
          onClick={() => setShowCreateModal(true)}
          className="md:hidden fixed bottom-6 right-6 w-16 h-16 bg-indigo-600 text-white rounded-[2rem] shadow-2xl shadow-indigo-500/40 flex items-center justify-center active:scale-90 transition-all z-40 border-4 border-white"
        >
          <Plus size={32} strokeWidth={3} />
        </button>

        {/* Task Cards Context Grid (Sub-Task Example Visualization) */}
        {!loading && filterStatus === "all" && filteredTasks.length > 0 && (
          <div className="mt-12 md:mt-24 grid grid-cols-1 md:grid-cols-2 gap-8 items-center bg-slate-900 rounded-[3rem] p-10 md:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/10 rounded-full -mr-48 -mt-48 blur-3xl"></div>
            <div className="relative z-10">
               <div className="inline-flex items-center gap-2 bg-indigo-500/10 text-indigo-400 px-4 py-2 rounded-2xl mb-6">
                  <Sparkles size={16} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Inteligencia de Flujo</span>
               </div>
               <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight mb-8">
                  Maximiza tu rendimiento diario.
               </h2>
               <div className="space-y-4">
                  {[
                    "Prioriza tareas críticas automáticamente",
                    "Seguimiento de fechas de vencimiento en tiempo real",
                    "Organización por etiquetas inteligentes"
                  ].map((text, i) => (
                    <div key={i} className="flex items-center gap-4 group">
                       <div className="w-6 h-6 bg-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                          <Check size={12} strokeWidth={4} />
                       </div>
                       <p className="text-slate-400 font-bold text-sm tracking-wide">{text}</p>
                    </div>
                  ))}
               </div>
               <button className="mt-10 group flex items-center gap-3 text-white text-xs font-black uppercase tracking-widest hover:text-indigo-400 transition-colors">
                  Explorar Analíticas <ArrowUpRight size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
               </button>
            </div>
            
            <div className="relative hidden md:flex justify-end gap-4 h-[300px]">
               {filteredTasks.slice(0, 3).map((task, i) => {
                 const angles = [-6, 3, -2];
                 const offsets = [0, 20, 40];
                 return (
                   <div 
                    key={task.id}
                    style={{ transform: `rotate(${angles[i]}deg) translateY(${offsets[i]}px)`, zIndex: 10 - i }}
                    className="absolute right-0 bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-[2rem] w-64 shadow-2xl"
                   >
                      <div className="flex items-center gap-3 mb-4">
                         <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                            {getStatusIcon(task.status)}
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <div className="h-2 w-2/3 bg-white/10 rounded-full mb-1"></div>
                            <div className="h-2 w-1/3 bg-white/5 rounded-full"></div>
                         </div>
                      </div>
                      <p className="text-white/60 font-black text-xs leading-relaxed mb-4 line-clamp-2">{task.title}</p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                         <div className="w-12 h-4 bg-indigo-500/20 rounded-full"></div>
                         <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                            {formatDate(task.due_date)}
                         </span>
                      </div>
                   </div>
                 );
               })}
            </div>
          </div>
        )}

        {/* Task Detail Modal */}
        {showTaskModal && selectedTask && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md flex items-end md:items-center justify-center z-50 p-0 md:p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-t-[2rem] md:rounded-[3rem] shadow-2xl max-w-2xl w-full max-h-[95dvh] md:max-h-[90vh] overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-300 flex flex-col">
              <div className="md:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
              
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 md:p-8 border-b border-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-slate-50 rounded-2xl flex items-center justify-center">
                     {getStatusIcon(selectedTask.status)}
                  </div>
                  <div>
                    <h2 className="text-base md:text-xl font-black text-slate-800">Detalles de Tarea</h2>
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {selectedTask.id.split('-')[0]}</p>
                  </div>
                </div>
                <button onClick={handleCloseTaskModal} className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-xl transition-all text-slate-400">
                  <X size={18} strokeWidth={3} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleUpdateTask} className="px-5 py-4 md:p-8 overflow-y-auto flex-1">
                <div className="space-y-8">
                  {/* Title */}
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 transition-colors group-focus-within:text-indigo-500">Título</label>
                    <input
                      type="text"
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500/30 focus:bg-white transition-all shadow-sm"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                    />
                  </div>

                  {/* Description */}
                  <div className="group">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 transition-colors group-focus-within:text-indigo-500">Descripción</label>
                    <textarea
                      rows={4}
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500/30 focus:bg-white transition-all shadow-sm resize-none"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Sin descripción..."
                    />
                  </div>

                  {/* Status and Priority */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Estado</label>
                      <select
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500/30 focus:bg-white transition-all shadow-sm cursor-pointer"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as any)}
                      >
                        <option value="pending">⏳ Pendiente</option>
                        <option value="in_progress">🔄 En Progreso</option>
                        <option value="completed">✅ Completada</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Prioridad</label>
                      <select
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500/30 focus:bg-white transition-all shadow-sm cursor-pointer"
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as any)}
                      >
                        <option value="low">🟢 Baja</option>
                        <option value="medium">🟡 Media</option>
                        <option value="high">🟠 Alta</option>
                        <option value="urgent">🔴 Urgente</option>
                      </select>
                    </div>
                  </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Due Date */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Vencimiento</label>
                        <input
                          type="date"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500/30 focus:bg-white transition-all shadow-sm cursor-pointer"
                          value={editDueDate}
                          onChange={(e) => setEditDueDate(e.target.value)}
                        />
                      </div>

                      {/* Tag */}
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Etiqueta (#)</label>
                        <input
                          type="text"
                          placeholder="Ej: #ventas"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:border-indigo-500/30 focus:bg-white transition-all shadow-sm"
                          value={editTag}
                          onChange={(e) => setEditTag(e.target.value)}
                        />
                      </div>
                   </div>

                   {/* Meta Information Tags */}
                  <div className="flex flex-wrap gap-4 pt-4">
                    <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Creada:</span>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{formatDateTime(selectedTask.created_at)}</span>
                    </div>
                    <div className="bg-slate-50 px-4 py-2 rounded-xl flex items-center gap-3">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Actualizada:</span>
                      <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{formatDateTime(selectedTask.updated_at)}</span>
                    </div>
                  </div>
                </div>
              </form>

              {/* Modal Footer */}
              <div className="px-5 py-4 md:p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between gap-3">
                 <button
                   type="button"
                   onClick={() => handleDeleteTask(selectedTask.id)}
                   className="h-10 px-4 flex items-center gap-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-all text-[10px] font-black uppercase tracking-wider"
                 >
                   <Trash2 size={14} /> <span className="hidden sm:inline">Eliminar</span>
                 </button>
                 <div className="flex gap-2">
                   <button type="button" onClick={handleCloseTaskModal} className="h-10 px-4 text-[10px] font-black uppercase tracking-wide text-slate-400 hover:text-slate-600">
                     Cerrar
                   </button>
                   <button
                     type="button"
                     onClick={(e) => { e.preventDefault(); handleUpdateTask(e as any); }}
                     disabled={updatingTask || !editTitle.trim()}
                     className="h-10 px-6 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-wide rounded-xl shadow-lg transition-all disabled:opacity-50 flex items-center gap-2"
                   >
                     {updatingTask ? "Guardando..." : <><CheckCircle size={14} /> Guardar</>}
                   </button>
                 </div>
               </div>
            </div>
          </div>
        )}
     </div>
  );
}

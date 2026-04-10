"use client";

import { useState, useEffect } from "react";
import { 
  Search, Plus, CheckCircle, Clock, AlertCircle, 
  Trash2, MoreHorizontal, Calendar, Tag, Filter,
  ChevronDown, BarChart3, ListTodo, X, ArrowUpRight
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
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high" | "urgent">("all");
  
  // Create / Edit modal state
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editStatus, setEditStatus] = useState<Task["status"]>("pending");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editTag, setEditTag] = useState("");
  const [updatingTask, setUpdatingTask] = useState(false);

  const router = useRouter();

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/tasks", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) {
        const data = await resp.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [router]);

  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setSelectedTask(task);
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      setEditStatus(task.status);
      setEditPriority(task.priority);
      setEditDueDate(task.due_date ? task.due_date.split('T')[0] : "");
      setEditTag(task.tag || "");
    } else {
      setSelectedTask(null);
      setEditTitle("");
      setEditDescription("");
      setEditStatus("pending");
      setEditPriority("medium");
      setEditDueDate("");
      setEditTag("");
    }
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle.trim()) return;

    setUpdatingTask(true);
    const token = localStorage.getItem("token");
    const method = selectedTask ? "PUT" : "POST";
    const url = selectedTask 
      ? `http://127.0.0.1:8000/api/tasks/${selectedTask.id}`
      : "http://127.0.0.1:8000/api/tasks";

    try {
      const resp = await fetch(url, {
        method,
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
          tag: editTag || null
        })
      });

      if (resp.ok) {
        const updated = await resp.json();
        if (selectedTask) {
          setTasks(tasks.map(t => t.id === updated.id ? updated : t));
        } else {
          setTasks([updated, ...tasks]);
        }
        handleCloseTaskModal();
      }
    } catch (err) {
      console.error("Error saving task:", err);
    } finally {
      setUpdatingTask(false);
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
        if (selectedTask?.id === taskId) handleCloseTaskModal();
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent": return "text-rose-600 bg-rose-50 border-rose-100";
      case "high": return "text-orange-600 bg-orange-50 border-orange-100";
      case "medium": return "text-amber-600 bg-amber-50 border-amber-100";
      default: return "text-emerald-600 bg-emerald-50 border-emerald-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle className="text-emerald-500" size={18} />;
      case "in_progress": return <Clock className="text-indigo-500" size={18} />;
      default: return <AlertCircle className="text-slate-300" size={18} />;
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          task.tag?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === "completed").length,
    inProgress: tasks.filter(t => t.status === "in_progress").length,
    pending: tasks.filter(t => t.status === "pending").length,
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "Sin fecha";
    return new Date(dateStr).toLocaleDateString();
  };

  const formatDateTime = (dateStr: string) => {
     return new Date(dateStr).toLocaleString();
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Area */}
      <header className="flex flex-col gap-6 mb-10 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center shadow-xl shadow-indigo-100">
                <ListTodo size={22} className="text-white" strokeWidth={2.5} />
             </div>
             <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Gestión de Tareas</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mt-0.5">Control de Flujo de Trabajo</p>
             </div>
          </div>
          <button 
            onClick={() => handleOpenTaskModal()}
            className="h-12 bg-slate-900 hover:bg-black text-white px-6 md:px-8 rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95 flex items-center gap-2 group"
          >
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            <span className="text-[10px] font-black uppercase tracking-widest">Nueva Tarea</span>
          </button>
        </div>

        {/* Stats Summary Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
           <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-900 group-hover:text-white transition-all">
                 <BarChart3 size={18} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Total</p>
                 <p className="text-lg font-black text-slate-800">{stats.total}</p>
              </div>
           </div>
           <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white transition-all">
                 <CheckCircle size={18} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Completadas</p>
                 <p className="text-lg font-black text-slate-800">{stats.completed}</p>
              </div>
           </div>
           <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                 <Clock size={18} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">En Proceso</p>
                 <p className="text-lg font-black text-slate-800">{stats.inProgress}</p>
              </div>
           </div>
           <div className="bg-white border border-slate-100 p-5 rounded-[2rem] shadow-sm flex items-center gap-4 group hover:shadow-md transition-all">
              <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:bg-slate-400 group-hover:text-white transition-all">
                 <AlertCircle size={18} />
              </div>
              <div>
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Pendientes</p>
                 <p className="text-lg font-black text-slate-800">{stats.pending}</p>
              </div>
           </div>
        </div>
      </header>

      {/* Filters Area */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative group flex-1">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
           </div>
           <input 
              type="text" 
              placeholder="Buscar por título o etiqueta (#)..." 
              className="bg-white border-2 border-slate-100 rounded-2xl py-3.5 pl-11 pr-4 w-full text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
           />
        </div>
        
        <div className="flex gap-3">
          <select 
            className="bg-white border-2 border-slate-100 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 outline-none focus:border-indigo-400 cursor-pointer shadow-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
          >
            <option value="all">Filtro Estado</option>
            <option value="pending">Pendientes</option>
            <option value="in_progress">En Progreso</option>
            <option value="completed">Completadas</option>
          </select>

          <select 
            className="bg-white border-2 border-slate-100 rounded-2xl px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-500 outline-none focus:border-indigo-400 cursor-pointer shadow-sm"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as any)}
          >
            <option value="all">Filtro Prioridad</option>
            <option value="low">Baja</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

       {/* Task List Content */}
       {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-slate-50 rounded-3xl animate-pulse"></div>
            ))}
          </div>
       ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
             <ListTodo size={48} className="text-slate-200 mb-4" />
             <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Sin tareas encontradas</p>
             <button onClick={() => {setSearchQuery(""); setStatusFilter("all"); setPriorityFilter("all");}} className="mt-4 text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">Limpiar filtros</button>
          </div>
       ) : (
          <div className="grid grid-cols-1 gap-4 mb-20">
            {filteredTasks.map((task) => {
              const overdue = task.due_date && new Date(task.due_date) < new Date() && task.status !== 'completed';
              
              return (
                <div 
                  key={task.id}
                  onClick={() => handleOpenTaskModal(task)}
                  className="group bg-white rounded-[2rem] md:rounded-[2.5rem] p-5 md:p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 hover:border-indigo-100 transition-all duration-300 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="flex items-start md:items-center gap-5 flex-1 min-w-0">
                    <div className="mt-1 md:mt-0">
                      {getStatusIcon(task.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                       <div className="flex items-center gap-3 mb-1">
                          <h3 className={`text-base font-bold text-slate-800 truncate ${task.status === 'completed' ? 'line-through text-slate-400' : ''}`}>
                             {task.title}
                          </h3>
                          {task.tag && (
                             <span className="shrink-0 flex items-center gap-1 px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[9px] font-black uppercase tracking-widest border border-slate-100">
                                <Tag size={8} /> {task.tag}
                             </span>
                          )}
                       </div>
                       <p className="text-xs text-slate-500 truncate group-hover:text-slate-700 transition-colors">
                          {task.description || "Sin descripción adicional"}
                       </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-6 md:gap-8 shrink-0">
                    <div className="flex flex-col items-start md:items-end">
                       <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                       </span>
                    </div>

                    <div className="flex items-center gap-6">
                       <div className="flex flex-col items-end">
                          <span className={`text-[9px] font-black uppercase tracking-widest mb-1 ${overdue ? 'text-rose-500' : 'text-slate-400'}`}>
                             {overdue ? 'Vencido' : 'Plazo'}
                          </span>
                          <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                             {formatDate(task.due_date)}
                          </span>
                       </div>
                    </div>
                  </div>
                </div>
              );
            })}
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

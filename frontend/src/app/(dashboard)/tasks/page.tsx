"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Plus, CheckCircle, Circle, AlertCircle, Clock, Calendar, Flag, Trash2, Edit2, Filter, ArrowDownUp, LayoutGrid, Columns, X } from "lucide-react";
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

type ViewMode = "grid" | "kanban";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "in_progress" | "completed">("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "low" | "medium" | "high" | "urgent">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newPriority, setNewPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [newDueDate, setNewDueDate] = useState<string>("");
  const [addingTask, setAddingTask] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editPriority, setEditPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [editStatus, setEditStatus] = useState<"pending" | "in_progress" | "completed">("pending");
  const [editDueDate, setEditDueDate] = useState<string>("");
  const [editTag, setEditTag] = useState<string>("");
  const [updatingTask, setUpdatingTask] = useState(false);
  const router = useRouter();

  const fetchTasks = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login");
      setLoading(false);
      return;
    }

    try {
      let url = "http://127.0.0.1:8000/api/tasks";
      
      const params = new URLSearchParams();
      if (filter !== "all") {
        params.append("status_filter", filter);
      }
      if (priorityFilter !== "all") {
        params.append("priority_filter", priorityFilter);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const resp = await fetch(url, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (resp.ok) {
        const data = await resp.json();
        setTasks(data);
      } else {
        console.error("Failed to load tasks", await resp.json());
      }
    } catch (err) {
      console.error("Connection error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Event listener for real-time updates from AI or other components
    const handleRefreshed = () => {
      console.log("Tasks data refreshed event received. Fetching tasks...");
      fetchTasks();
    };

    window.addEventListener("tasksDataRefreshed", handleRefreshed);
    return () => {
      window.removeEventListener("tasksDataRefreshed", handleRefreshed);
    };
  }, [router, filter, priorityFilter]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setAddingTask(true);
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
           due_date: newDueDate || null,
           tag: newTag || null
         })
      });

      if (resp.ok) {
        const newTask = await resp.json();
        setTasks([newTask, ...tasks]);
        setNewTitle("");
        setNewDescription("");
        setNewTag("");
        setNewPriority("medium");
        setNewDueDate("");
        setShowAddForm(false);
      } else {
        const errorData = await resp.json();
        console.error("Failed to add task:", errorData);
        alert(`Error al crear tarea: ${errorData.detail || "Error desconocido"}`);
      }
    } catch (err) {
      console.error("Connection error adding task:", err);
      alert("Error de conexión al intentar crear la tarea");
    } finally {
      setAddingTask(false);
    }
  };

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    const token = localStorage.getItem("token");
    
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (resp.ok) {
        const updatedTask = await resp.json();
        setTasks(prevTasks => prevTasks.map(t => t.id === taskId ? updatedTask : t));
        if (selectedTask?.id === taskId) {
          setSelectedTask(updatedTask);
        }
      } else {
        const errorData = await resp.json();
        console.error("Failed to update task status:", errorData);
        alert(`Error al actualizar estado: ${errorData.detail || "Error desconocido"}`);
      }
    } catch (err) {
      console.error("Error updating task status:", err);
      alert("Error de red al actualizar estado de la tarea");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("¿Estás seguro de que quieres eliminar esta tarea?")) return;
    
    const token = localStorage.getItem("token");
    
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (resp.ok) {
        setTasks(tasks.filter(t => t.id !== taskId));
        if (selectedTask?.id === taskId) {
          setShowTaskModal(false);
          setSelectedTask(null);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenTaskModal = (task: Task) => {
    setSelectedTask(task);
    setEditTitle(task.title);
    setEditDescription(task.description || "");
    setEditPriority(task.priority);
    setEditStatus(task.status);
    setEditDueDate(task.due_date || "");
    setEditTag(task.tag || "");
    setShowTaskModal(true);
  };

  const handleCloseTaskModal = () => {
    setShowTaskModal(false);
    setSelectedTask(null);
  };

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask || !editTitle.trim()) return;

    setUpdatingTask(true);
    const token = localStorage.getItem("token");
    
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/tasks/${selectedTask.id}`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          title: editTitle,
          description: editDescription || null,
          priority: editPriority,
          status: editStatus,
          due_date: editDueDate || null,
          tag: editTag || null
        })
      });

      if (resp.ok) {
        const updatedTask = await resp.json();
        setTasks(prevTasks => prevTasks.map(t => t.id === selectedTask.id ? updatedTask : t));
        setSelectedTask(updatedTask);
        alert("Tarea actualizada exitosamente");
      } else {
        const errorData = await resp.json();
        console.error("Failed to update task:", errorData);
        alert(`Error al actualizar tarea: ${errorData.detail || "Error desconocido"}`);
      }
    } catch (err) {
      console.error("Error updating task:", err);
      alert("Error de red al actualizar tarea");
    } finally {
      setUpdatingTask(false);
    }
  };

  // Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", task.id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (e: React.DragEvent, newStatus: Task["status"]) => {
    e.preventDefault();
    if (!draggedTask) return;

    await handleStatusChange(draggedTask.id, newStatus);
    setDraggedTask(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
  };

  const getPriorityStyles = (priority: Task["priority"]) => {
    switch (priority) {
      case "urgent":
        return {
          bg: "bg-rose-50/50",
          text: "text-rose-600",
          border: "border-rose-100",
          accent: "bg-rose-500",
          light: "bg-rose-100/50"
        };
      case "high":
        return {
          bg: "bg-orange-50/50",
          text: "text-orange-600",
          border: "border-orange-100",
          accent: "bg-orange-500",
          light: "bg-orange-100/50"
        };
      case "medium":
        return {
          bg: "bg-amber-50/50",
          text: "text-amber-600",
          border: "border-amber-100",
          accent: "bg-amber-500",
          light: "bg-amber-100/50"
        };
      case "low":
        return {
          bg: "bg-emerald-50/50",
          text: "text-emerald-600",
          border: "border-emerald-100",
          accent: "bg-emerald-500",
          light: "bg-emerald-100/50"
        };
      default:
        return {
          bg: "bg-slate-50/50",
          text: "text-slate-600",
          border: "border-slate-100",
          accent: "bg-slate-500",
          light: "bg-slate-100/50"
        };
    }
  };

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle size={18} className="text-emerald-500" />;
      case "in_progress":
        return <Clock size={18} className="text-indigo-500" />;
      case "pending":
        return <Circle size={18} className="text-slate-300 group-hover:text-indigo-400 transition-colors" />;
      default:
        return <AlertCircle size={18} className="text-slate-300" />;
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { 
      month: "short", 
      day: "numeric",
      year: "numeric"
    });
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return "Sin fecha";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", { 
      month: "short", 
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const handleFilterChange = (newFilter: "all" | "pending" | "in_progress" | "completed") => {
    setFilter(newFilter);
  };

  const handlePriorityFilterChange = (newFilter: "all" | "low" | "medium" | "high" | "urgent") => {
    setPriorityFilter(newFilter);
  };

  const filteredTasksList = tasks.filter(task => {
    const searchLower = searchQuery.toLowerCase();
    const titleMatch = task.title.toLowerCase().includes(searchLower);
    const tagMatch = task.tag?.toLowerCase().includes(searchLower);
    return titleMatch || tagMatch;
  });

  const tasksByStatus = {
    pending: filteredTasksList.filter(t => t.status === "pending"),
    in_progress: filteredTasksList.filter(t => t.status === "in_progress"),
    completed: filteredTasksList.filter(t => t.status === "completed")
  };

  const urgentCount = filteredTasksList.filter(t => t.priority === "urgent" || t.priority === "high").length;
  const completionRate = filteredTasksList.length > 0 ? Math.round((tasksByStatus.completed.length / filteredTasksList.length) * 100) : 0;

  const KanbanColumn = ({ status, title, tasks: columnTasks, bgColor, borderColor }: { 
    status: Task["status"]; 
    title: string; 
    tasks: Task[]; 
    bgColor: string; 
    borderColor: string; 
  }) => (
    <div 
      className={`flex-1 min-w-[320px] max-w-[400px] bg-slate-50/50 rounded-[2.5rem] p-6 flex flex-col gap-4 transition-all duration-300 border border-slate-200/50 hover:bg-slate-50`}
      onDragOver={handleDragOver}
      onDrop={(e) => handleDrop(e, status)}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <div className="w-2 h-8 bg-indigo-500 rounded-full"></div>
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">{title}</h3>
          <span className="bg-white text-slate-400 text-[10px] font-black px-2.5 py-1 rounded-lg border border-slate-100 shadow-sm">
            {columnTasks.length}
          </span>
        </div>
      </div>
      
      <div className="flex-1 space-y-4 overflow-y-auto max-h-[calc(100vh-400px)] no-scrollbar pt-2">
        {columnTasks.map((task) => {
          const styles = getPriorityStyles(task.priority);
          return (
            <div
              key={task.id}
              draggable
              onDragStart={(e) => handleDragStart(e, task)}
              onDragEnd={handleDragEnd}
              onClick={() => handleOpenTaskModal(task)}
              className={`bg-white rounded-3xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-slate-100 cursor-grab active:cursor-grabbing hover:shadow-[0_12px_24px_rgba(79,70,229,0.06)] hover:border-indigo-100 transition-all duration-300 relative group ${
                draggedTask?.id === task.id ? "opacity-40 scale-95" : ""
              }`}
            >
              <div className={`absolute top-4 left-0 w-1 h-10 ${styles.accent} rounded-r-full opacity-40`}></div>
              
              <div className="flex items-start justify-between mb-3 pl-2">
                <h4 className="font-black text-slate-800 text-sm leading-snug flex-1">
                  {task.title}
                </h4>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTask(task.id);
                  }}
                  className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {task.description && (
                <p className="text-[11px] font-bold text-slate-400 mb-4 line-clamp-2 pl-2">
                  {task.description}
                </p>
              )}
              
              <div className="flex items-center justify-between pl-2">
                <div className={`px-2.5 py-1 rounded-md border ${styles.border} ${styles.bg}`}>
                  <p className={`text-[8px] font-black uppercase tracking-wider ${styles.text}`}>{task.priority}</p>
                </div>
                
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar size={12} className="opacity-60" />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {formatDate(task.due_date)}
                  </span>
                </div>
              </div>

              {task.tag && (
                <div className="mt-3 pl-2">
                  <span className="px-2.5 py-1 bg-indigo-50/50 text-indigo-500 text-[9px] font-black uppercase tracking-widest rounded-lg border border-indigo-100/30">
                    #{task.tag.replace('#', '')}
                  </span>
                </div>
              )}
            </div>
          );
        })}
        
        {columnTasks.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 px-6 border-2 border-dashed border-slate-200 rounded-[2rem] opacity-40">
             <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                <Plus size={20} className="text-slate-400" />
             </div>
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrastra aquí</p>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Area */}
      <header className="flex flex-col gap-4 mb-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-200">
                <CheckCircle size={20} className="text-white" strokeWidth={2.5} />
             </div>
             <div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Mis Tareas</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Centro de Operaciones</p>
             </div>
          </div>
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="md:hidden h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] px-5 rounded-2xl shadow-lg flex items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Nueva
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group flex-1">
             <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                <Search size={16} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
             </div>
             <input 
                type="text" 
                placeholder="Buscar tarea..." 
                className="bg-white border-2 border-slate-100 rounded-2xl py-3 pl-11 pr-4 w-full text-sm font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
             />
          </div>
          
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-xl border border-slate-200/50 shrink-0">
            <button onClick={() => setViewMode("grid")} className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-indigo-600 shadow" : "text-slate-400"}`}><LayoutGrid size={16} /></button>
            <button onClick={() => setViewMode("kanban")} className={`p-2 rounded-lg transition-all ${viewMode === "kanban" ? "bg-white text-indigo-600 shadow" : "text-slate-400"}`}><Columns size={16} /></button>
          </div>
          
          <button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="hidden md:flex h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] px-6 rounded-2xl shadow-xl shadow-indigo-200 active:translate-y-0 transition-all items-center gap-2"
          >
            <Plus size={16} strokeWidth={3} /> Nueva Tarea
          </button>
        </div>
      </header>

      {/* Stats Quick View Card */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-6 mb-6 md:mb-10">
        <div className="bg-white p-4 md:p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-5">
           <div className="w-10 h-10 md:w-14 md:h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <LayoutGrid size={20} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800">{tasks.length}</h3>
           </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-5">
           <div className="w-10 h-10 md:w-14 md:h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <CheckCircle size={20} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hechas</p>
              <div className="flex items-center gap-1.5">
                 <h3 className="text-xl md:text-2xl font-black text-slate-800">{tasksByStatus.completed.length}</h3>
                 <span className="text-[9px] font-black text-green-500 bg-green-50 px-1 py-0.5 rounded">{completionRate}%</span>
              </div>
           </div>
        </div>

        <div className="bg-white p-4 md:p-6 rounded-[1.75rem] border border-slate-100 shadow-sm flex items-center gap-3 md:gap-5">
           <div className="w-10 h-10 md:w-14 md:h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <Clock size={20} />
           </div>
           <div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">En Proceso</p>
              <h3 className="text-xl md:text-2xl font-black text-slate-800">{tasksByStatus.in_progress.length}</h3>
           </div>
        </div>

        <div className="bg-rose-50 p-4 md:p-6 rounded-[1.75rem] border border-rose-100 shadow-sm flex items-center gap-3 md:gap-5">
           <div className="w-10 h-10 md:w-14 md:h-14 bg-white rounded-2xl flex items-center justify-center text-rose-500">
              <AlertCircle size={20} />
           </div>
           <div>
              <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">Críticas</p>
              <h3 className="text-xl md:text-2xl font-black text-rose-600">{urgentCount}</h3>
           </div>
        </div>
      </div>

       {/* Filter Options Row */}
       <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-1">
          <div className="flex p-1 bg-slate-100/70 rounded-xl border border-slate-200/40 shrink-0">
             {[
               { id: "all", label: "Todas" },
               { id: "pending", label: "Pend." },
               { id: "in_progress", label: "Proceso" },
               { id: "completed", label: "Listas" }
             ].map((opt) => (
                <button 
                  key={opt.id}
                  onClick={() => handleFilterChange(opt.id as any)}
                  className={`px-3 md:px-6 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all duration-200 whitespace-nowrap ${
                    filter === opt.id 
                      ? "bg-white text-indigo-600 shadow" 
                      : "text-slate-400"
                  }`}
                >
                  {opt.label}
                </button>
             ))}
          </div>
          
          <div className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-100 rounded-xl shadow-sm shrink-0">
             <Flag size={12} className="text-slate-400" />
             <select 
               value={priorityFilter}
               onChange={(e) => handlePriorityFilterChange(e.target.value as any)}
               className="bg-transparent text-[10px] font-black uppercase tracking-widest text-slate-600 outline-none cursor-pointer border-none p-0"
             >
               <option value="all">Prioridad</option>
               <option value="urgent">🔴 Urgente</option>
               <option value="high">🟠 Alta</option>
               <option value="medium">🟡 Media</option>
               <option value="low">🟢 Baja</option>
             </select>
          </div>
       </div>

       {/* Add Task Form */}
       {showAddForm && (
          <form onSubmit={handleAddTask} className="mb-8 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 animate-in slide-in-from-top-2 fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Título de la Tarea</label>
                   <input 
                     type="text"
                     placeholder="Ej: Preparar propuesta para cliente X"
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium placeholder:text-slate-400"
                     value={newTitle}
                     onChange={(e) => setNewTitle(e.target.value)}
                   />
                </div>
                <div>
                   <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Prioridad</label>
                   <select 
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium appearance-none"
                     value={newPriority}
                     onChange={(e) => setNewPriority(e.target.value as any)}
                   >
                     <option value="low">🟢 Baja</option>
                     <option value="medium">🟡 Media</option>
                     <option value="high">🟠 Alta</option>
                     <option value="urgent">🔴 Urgente</option>
                   </select>
                </div>
              </div>
              <div className="mb-4">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Descripción (opcional)</label>
                 <textarea 
                   rows={3}
                   placeholder="Describe los detalles de la tarea..."
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium resize-none placeholder:text-slate-400"
                   value={newDescription}
                   onChange={(e) => setNewDescription(e.target.value)}
                 />
              </div>
              <div className="mb-4">
                 <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Etiqueta / Tag (opcional)</label>
                 <input 
                   type="text"
                   placeholder="#ventas, #soporte, #urgente"
                   className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium placeholder:text-slate-400"
                   value={newTag}
                   onChange={(e) => setNewTag(e.target.value)}
                 />
              </div>
             <div className="mb-4">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Fecha de Vencimiento (opcional)</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm text-slate-700 outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-500/20 transition-all font-medium"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                />
             </div>
             
             <div className="flex justify-end gap-3 pt-2">
               <button 
                 type="button" 
                 onClick={() => setShowAddForm(false)}
                 className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
               >
                 Cancelar
               </button>
               <button 
                 type="submit" 
                 disabled={addingTask || !newTitle.trim()}
                 className="px-6 py-2 bg-gradient-to-r from-[#00C2FF] to-[#00a6da] text-white text-xs font-bold rounded-xl shadow-sm shadow-cyan-500/30 hover:shadow-cyan-500/50 hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center gap-2"
               >
                 {addingTask ? "Guardando..." : <><Plus size={14} /> Crear Tarea</>}
               </button>
             </div>
          </form>
       )}

       {/* Content Area */}
       {loading ? (
         <p className="text-slate-400 font-medium italic animate-pulse text-center py-12">Cargando tareas...</p>
       ) : tasks.length === 0 ? (
         <p className="text-slate-400 font-medium italic text-center py-12">No hay tareas registradas aún. ¡Crea tu primera tarea!</p>
       ) : filteredTasksList.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 rounded-[3rem] border-2 border-dashed border-slate-200">
            <Search size={48} className="text-slate-200 mb-4" />
            <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">No se encontraron tareas para "{searchQuery}"</p>
            <button onClick={() => setSearchQuery("")} className="mt-4 text-indigo-600 text-xs font-black uppercase tracking-widest hover:underline">Limpiar búsqueda</button>
         </div>
       ) : viewMode === "kanban" ? (
         /* Kanban View */
         <div className="flex gap-4 overflow-x-auto pb-4">
           <KanbanColumn 
             status="pending" 
             title="Pendientes" 
             tasks={tasksByStatus.pending} 
             bgColor="bg-slate-50" 
             borderColor="border-slate-300" 
           />
           <KanbanColumn 
             status="in_progress" 
             title="En Progreso" 
             tasks={tasksByStatus.in_progress} 
             bgColor="bg-blue-50" 
             borderColor="border-blue-300" 
           />
           <KanbanColumn 
             status="completed" 
             title="Completadas" 
             tasks={tasksByStatus.completed} 
             bgColor="bg-emerald-50" 
             borderColor="border-emerald-300" 
           />
         </div>
       ) : (
         /* Grid View */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 md:gap-6">
           {filteredTasksList.map((task) => {
             const styles = getPriorityStyles(task.priority);
             return (
               <div 
                 key={task.id} 
                 onClick={() => handleOpenTaskModal(task)}
                 className="group bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-100 hover:shadow-[0_20px_50px_rgba(79,70,229,0.08)] hover:border-indigo-100 transition-all duration-500 flex flex-col h-[320px] cursor-pointer relative overflow-hidden"
               >
                 {/* Priority Accent Line */}
                 <div className={`absolute top-0 left-0 w-full h-1.5 ${styles.accent} opacity-20`}></div>
                 
                 {/* Top: Status & Priority */}
                 <div className="flex justify-between items-start mb-8">
                   <div className="flex items-center gap-3">
                     <button
                       onClick={(e) => {
                         e.stopPropagation();
                         const newStatus: Task["status"] = task.status === "completed" ? "pending" : "completed";
                         handleStatusChange(task.id, newStatus);
                       }}
                       className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-300 ${task.status === 'completed' ? 'bg-emerald-50 text-emerald-600 shadow-inner' : 'bg-slate-50 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 shadow-sm'}`}
                     >
                       {getStatusIcon(task.status)}
                     </button>
                     <div className={`px-4 py-1.5 rounded-lg border-2 ${styles.border} ${styles.bg}`}>
                       <p className={`text-[9px] font-black uppercase tracking-[0.2em] ${styles.text}`}>{task.priority}</p>
                     </div>
                   </div>
                   <button 
                     onClick={(e) => {
                       e.stopPropagation();
                       handleDeleteTask(task.id);
                     }}
                     className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-50 text-slate-300 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                   >
                     <Trash2 size={16} />
                   </button>
                 </div>

                 {/* Body */}
                 <div className="space-y-3">
                   <h3 className={`text-xl font-black tracking-tight leading-tight transition-colors duration-300 ${task.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800 group-hover:text-indigo-600'}`}>
                     {task.title}
                   </h3>
                   {task.description && (
                     <p className="text-sm font-bold text-slate-400 line-clamp-2 leading-relaxed">
                        {task.description}
                     </p>
                   )}
                 </div>

                 {/* Footer */}
                 <div className="mt-auto pt-6 flex flex-col gap-4">
                   <div className="flex items-center justify-between">
                      {task.tag && (
                         <div className="flex items-center gap-2 bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-indigo-100/50">
                            <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">#{task.tag.replace('#', '')}</span>
                         </div>
                      )}
                      <div className="flex items-center gap-2.5 ml-auto">
                         <div className="p-2 bg-slate-50 rounded-lg text-slate-400 group-hover:text-indigo-400 transition-colors">
                            <Calendar size={14} />
                         </div>
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

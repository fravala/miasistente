"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, Building2, Clock, FileText, Calendar, MessageSquare, Briefcase, Plus, Send, Sparkles, Thermometer, Target, Copy, Mic, Loader2, File, Paperclip, Trash2, Download, Pencil, X, CheckCircle2, AlertCircle, TrendingUp, MailCheck, History, Check, Receipt, Printer } from "lucide-react";
import ReactMarkdown from 'react-markdown';

interface Customer {
  id: string;
  first_name: string;
  last_name: string | null;
  company: string | null;
  email: string | null;
  phone: string | null;
  customer_type: string;
  status: string;
  created_at: string;
}

interface Interaction {
  id: string;
  interaction_type: string;
  description: string;
  interaction_date: string;
  created_at: string;
  task_id: string | null;
  tasks?: {
    id: string;
    title: string;
    status: string;
    priority: string;
    due_date: string | null;
  } | null;
}

interface CustomerFile {
  id: string;
  file_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params.id as string;

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [loading, setLoading] = useState(true);

  // States for new interaction
  const [showAddForm, setShowAddForm] = useState(false);
  const [newInteractionType, setNewInteractionType] = useState("note");
  const [newDescription, setNewDescription] = useState("");
  const [newInteractionDate, setNewInteractionDate] = useState<string>("");
  const [selectedTaskId, setSelectedTaskId] = useState<string>("");
  const [tasks, setTasks] = useState<any[]>([]);
  
  // States for task mention autocomplete
  const [showTaskSuggestions, setShowTaskSuggestions] = useState(false);
  const [filteredTasks, setFilteredTasks] = useState<any[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const textareaEditRef = useRef<HTMLTextAreaElement>(null);
  const [addingInteraction, setAddingInteraction] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileForNoteRef = useRef<HTMLInputElement>(null);
  const [editSelectedTaskId, setEditSelectedTaskId] = useState<string>("");

  // States for AI Insights
  const [aiInsights, setAiInsights] = useState<{temperatura: string, siguiente_paso: string, borrador_email: any} | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  // States for Audio Upload
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Files
  const [files, setFiles] = useState<CustomerFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileUploadRef = useRef<HTMLInputElement>(null);

  // States for editing interaction
  const [editingInteraction, setEditingInteraction] = useState<string | null>(null);
  const [editInteractionType, setEditInteractionType] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editInteractionDate, setEditInteractionDate] = useState<string>("");
  const [updatingInteraction, setUpdatingInteraction] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // States for Quotation builder
  interface QuoteItem { description: string; qty: number; unitPrice: number; }
  const [quoteItems, setQuoteItems] = useState<QuoteItem[]>([{ description: "", qty: 1, unitPrice: 0 }]);
  const [quoteTitle, setQuoteTitle] = useState("");
  const [quoteNotes, setQuoteNotes] = useState("");
  const [printingQuote, setPrintingQuote] = useState<string | null>(null);

  // States for Audio Focus Modal
  const [audioModal, setAudioModal] = useState<{
    open: boolean;
    transcription: string;
    wordCount: number;
    duration: number;
    topic: string;
    step: 'topic' | 'generating' | 'preview';
    focusedExtract: string;
  }>({
    open: false,
    transcription: '',
    wordCount: 0,
    duration: 0,
    topic: '',
    step: 'topic',
    focusedExtract: ''
  });

  // States for Audio Trimmer
  const [audioTrimmer, setAudioTrimmer] = useState<{
    open: boolean;
    file: File | null;
    objectUrl: string;
    duration: number;
    startTime: number;
    endTime: number;
    probing: boolean;
    transcribing: boolean;
  }>({
    open: false,
    file: null,
    objectUrl: '',
    duration: 0,
    startTime: 0,
    endTime: 0,
    probing: false,
    transcribing: false
  });


  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const t = Date.now();
        const [custResp, intResp, tasksResp, filesResp] = await Promise.all([
          fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}?t=${t}`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions?t=${t}`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`http://127.0.0.1:8000/api/tasks?t=${t}`, { headers: { "Authorization": `Bearer ${token}` } }),
          fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/files?t=${t}`, { headers: { "Authorization": `Bearer ${token}` } })
        ]);

        if (custResp.ok) setCustomer(await custResp.json());
        if (intResp.ok) setInteractions(await intResp.json());
        if (tasksResp.ok) setTasks(await tasksResp.json());
        if (filesResp.ok) setFiles(await filesResp.json());

      } catch (err) {
        console.error("Connection error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (customerId) fetchData();

    // Listener para actualizaciones en tiempo real (ej. desde el Asistente IA)
    const handleRefresh = () => {
      console.log("Señal de actualización del CRM recibida en Detalle Cliente...");
      fetchData();
    };

    window.addEventListener("crmDataRefreshed", handleRefresh);
    return () => {
      window.removeEventListener("crmDataRefreshed", handleRefresh);
    };
  }, [customerId, router]);

  if (loading) {
     return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
           <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
           <p className="text-slate-400 font-black uppercase tracking-widest text-[10px] animate-pulse">Sincronizando expediente del cliente...</p>
        </div>
     );
  }

  if (!customer) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <AlertCircle size={64} className="text-rose-200" />
        <div className="text-center">
          <p className="text-slate-600 font-black text-2xl tracking-tight">Contacto no encontrado</p>
          <button onClick={() => router.push("/crm")} className="mt-4 text-indigo-600 font-bold hover:underline">Volver al listado</button>
        </div>
      </div>
    );
  }

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'meeting': return <div className="p-2.5 bg-purple-50 text-purple-600 rounded-2xl border border-purple-100 shadow-sm"><Calendar size={20} /></div>;
      case 'call': return <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 shadow-sm"><Phone size={20} /></div>;
      case 'email': return <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 shadow-sm"><Mail size={20} /></div>;
      case 'sale': return <div className="p-2.5 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 shadow-sm"><Briefcase size={20} /></div>;
      case 'quotation': return <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 shadow-sm"><Receipt size={20} /></div>;
      default: return <div className="p-2.5 bg-slate-50 text-slate-500 rounded-2xl border border-slate-200 shadow-sm"><FileText size={20} /></div>;
    }
  };

  const getFileIcon = (mime: string) => {
    if (mime.includes("pdf")) return <FileText size={18} className="text-rose-500" />;
    if (mime.includes("image")) return <File size={18} className="text-blue-500" />;
    if (mime.includes("word") || mime.includes("officedocument")) return <FileText size={18} className="text-indigo-500" />;
    if (mime.includes("excel") || mime.includes("spreadsheet")) return <FileText size={18} className="text-emerald-500" />;
    return <File size={18} className="text-slate-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const statusColors: Record<string, string> = {
    ACTIVO: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PENDIENTE: "bg-amber-50 text-amber-700 border-amber-200",
    CERRADO: "bg-rose-50 text-rose-700 border-rose-200"
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const query = textBeforeCursor.substring(lastHashIndex + 1);
      const lastSpaceIndex = query.lastIndexOf(' ');
      if (lastSpaceIndex === -1) {
        setMentionQuery(query);
        setMentionStartPos(lastHashIndex);
        const filtered = tasks.filter((task: any) => 
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.status.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredTasks(filtered);
        setShowTaskSuggestions(true);
        setActiveSuggestionIndex(0);
      } else { setShowTaskSuggestions(false); }
    } else { setShowTaskSuggestions(false); }
    setNewDescription(value);
  };

  const handleEditDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    
    if (lastHashIndex !== -1) {
      const query = textBeforeCursor.substring(lastHashIndex + 1);
      const lastSpaceIndex = query.lastIndexOf(' ');
      if (lastSpaceIndex === -1) {
        setMentionQuery(query);
        setMentionStartPos(lastHashIndex);
        const filtered = tasks.filter((task: any) => 
          task.title.toLowerCase().includes(query.toLowerCase()) ||
          task.status.toLowerCase().includes(query.toLowerCase())
        );
        setFilteredTasks(filtered);
        setShowTaskSuggestions(true);
        setActiveSuggestionIndex(0);
      } else { setShowTaskSuggestions(false); }
    } else { setShowTaskSuggestions(false); }
    setEditDescription(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>, isEdit = false) => {
    if (!showTaskSuggestions || filteredTasks.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev + 1) % filteredTasks.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveSuggestionIndex(prev => (prev - 1 + filteredTasks.length) % filteredTasks.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      if (isEdit) {
        handleEditSelectTask(filteredTasks[activeSuggestionIndex]);
      } else {
        handleSelectTask(filteredTasks[activeSuggestionIndex]);
      }
    } else if (e.key === 'Escape' || e.key === ' ') {
      if (e.key === 'Escape') {
        setShowTaskSuggestions(false);
      }
    }
  };

  const handleSelectTask = (task: any) => {
    const textBeforeMention = newDescription.substring(0, mentionStartPos);
    const textAfterMention = newDescription.substring(mentionStartPos + mentionQuery.length + 1);
    const taskLink = `[${task.title}](/tasks)`;
    const newDescriptionWithTask = `${textBeforeMention}${taskLink} ${textAfterMention}`;
    setNewDescription(newDescriptionWithTask);
    setShowTaskSuggestions(false);
    setSelectedTaskId(String(task.id));
    if (textareaRef.current) {
      const newCursorPosition = mentionStartPos + taskLink.length + 1;
      textareaRef.current.focus();
      setTimeout(() => textareaRef.current?.setSelectionRange(newCursorPosition, newCursorPosition), 0);
    }
  };

  const handleEditSelectTask = (task: any) => {
    const textBeforeMention = editDescription.substring(0, mentionStartPos);
    const textAfterMention = editDescription.substring(mentionStartPos + mentionQuery.length + 1);
    const taskLink = `[${task.title}](/tasks)`;
    const editDescriptionWithTask = `${textBeforeMention}${taskLink} ${textAfterMention}`;
    setEditDescription(editDescriptionWithTask);
    setShowTaskSuggestions(false);
    setEditSelectedTaskId(String(task.id));
    if (textareaEditRef.current) {
      const newCursorPosition = mentionStartPos + taskLink.length + 1;
      textareaEditRef.current.focus();
      setTimeout(() => textareaEditRef.current?.setSelectionRange(newCursorPosition, newCursorPosition), 0);
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();

    // Build description based on type
    let description = newDescription;
    if (newInteractionType === 'quotation') {
      if (!quoteTitle.trim() || quoteItems.every(i => !i.description.trim())) return;
      const quoteData = {
        __type: 'quotation',
        title: quoteTitle,
        items: quoteItems.filter(i => i.description.trim()),
        notes: quoteNotes,
        total: quoteItems.reduce((s, i) => s + i.qty * i.unitPrice, 0),
        currency: 'MXN',
        date: new Date().toISOString(),
        client: `${customer?.first_name || ''} ${customer?.last_name || ''}`.trim(),
        company: customer?.company || '',
      };
      description = JSON.stringify(quoteData);
    } else {
      if (!newDescription.trim()) return;
    }

    setAddingInteraction(true);
    const token = localStorage.getItem("token");
    
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          interaction_type: newInteractionType,
          description,
          interaction_date: newInteractionDate || null,
          task_id: selectedTaskId ? String(selectedTaskId) : null
        })
      });

      if (resp.ok) {
        const newInteraction = await resp.json();
        setInteractions([newInteraction, ...interactions]);
        setNewDescription("");
        setShowAddForm(false);
        setSelectedTaskId("");
        // Reset quote state
        setQuoteTitle("");
        setQuoteItems([{ description: "", qty: 1, unitPrice: 0 }]);
        setQuoteNotes("");
        
        if (selectedFile) {
            const formData = new FormData();
            formData.append("file", selectedFile);
            await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/files`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${token}` },
              body: formData
            });
            setSelectedFile(null);
            if (fileForNoteRef.current) fileForNoteRef.current.value = "";
        }
      }
    } catch (err) { console.error(err); } finally { setAddingInteraction(false); }
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Show the trimmer panel immediately — no upload yet
    const objectUrl = URL.createObjectURL(file);
    setAudioTrimmer({
      open: true,
      file,
      objectUrl,
      duration: 0,
      startTime: 0,
      endTime: 0,
      probing: true,
      transcribing: false
    });

    // Probe duration via backend (ffprobe)
    const doProbe = async () => {
      const token = localStorage.getItem("token");
      const fd = new FormData();
      fd.append("file", file);
      try {
        const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions/audio-probe`, {
          method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: fd
        });
        if (resp.ok) {
          const data = await resp.json();
          setAudioTrimmer(prev => ({
            ...prev,
            duration: data.duration || 0,
            endTime: data.duration || 0,
            probing: false
          }));
        } else {
          setAudioTrimmer(prev => ({ ...prev, probing: false }));
        }
      } catch { setAudioTrimmer(prev => ({ ...prev, probing: false })); }
    };
    doProbe();
  };

  const handleTranscribeSegment = async () => {
    if (!audioTrimmer.file) return;
    setAudioTrimmer(prev => ({ ...prev, transcribing: true }));
    const token = localStorage.getItem("token");
    const fd = new FormData();
    fd.append("file", audioTrimmer.file);
    fd.append("language", "es");
    fd.append("model_size", "base");
    fd.append("start_time", String(audioTrimmer.startTime));
    fd.append("end_time", String(audioTrimmer.endTime));

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions/audio-transcribe-only`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: fd
      });
      if (resp.ok) {
        const data = await resp.json();
        // Close trimmer, open focus modal
        if (audioTrimmer.objectUrl) URL.revokeObjectURL(audioTrimmer.objectUrl);
        setAudioTrimmer({ open: false, file: null, objectUrl: '', duration: 0, startTime: 0, endTime: 0, probing: false, transcribing: false });
        setAudioModal({
          open: true,
          transcription: data.transcription,
          wordCount: data.word_count || 0,
          duration: data.duration || 0,
          topic: '',
          step: 'topic',
          focusedExtract: ''
        });
      } else {
        const err = await resp.json();
        alert(`Error: ${err.detail || 'No se pudo transcribir'}`);
        setAudioTrimmer(prev => ({ ...prev, transcribing: false }));
      }
    } catch (err) {
      console.error(err);
      setAudioTrimmer(prev => ({ ...prev, transcribing: false }));
    }
  };



  const handleGenerateFocusedExtract = async () => {
    if (!audioModal.topic.trim()) return;
    setAudioModal(prev => ({ ...prev, step: 'generating' }));
    const token = localStorage.getItem("token");
    const prompt = `Analiza la siguiente transcripción de una reunión y genera un extracto profesional enfocado únicamente en el tema: "${audioModal.topic}".

INSTRUCCIONES:
- Extrae SOLO la información relevante al tema solicitado
- Si hay acuerdos, compromisos o próximos pasos relacionados con ese tema, inclúyeloس
- Usa formato claro: resumen en 2-3 oraciones, seguido de puntos clave si aplica
- Si el tema NO se menciona en la transcripción, indícalo claramente
- Mantener tono profesional y conciso
- Responde SOLO en español

TEMA DE ENFOQUE: ${audioModal.topic}

TRANSCRIPCIÓN COMPLETA:
${audioModal.transcription.substring(0, 8000)}`;

    try {
      const resp = await fetch("http://127.0.0.1:8000/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message: prompt, history: [] })
      });
      if (resp.ok) {
        const data = await resp.json();
        setAudioModal(prev => ({ ...prev, step: 'preview', focusedExtract: data.reply || '' }));
      }
    } catch (err) {
      console.error(err);
      setAudioModal(prev => ({ ...prev, step: 'topic' }));
    }
  };

  const handleSaveFocusedNote = async () => {
    const token = localStorage.getItem("token");
    const description = `🎤 EXTRACTO DE AUDIO — Tema: **${audioModal.topic}**

${audioModal.focusedExtract}

---
*Fuente: grabación de reunión transcrita con Whisper (${audioModal.wordCount} palabras totales)*`;

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          interaction_type: "meeting",
          description,
          interaction_date: null,
          task_id: null
        })
      });
      if (resp.ok) {
        const newInteraction = await resp.json();
        setInteractions([newInteraction, ...interactions]);
        setAudioModal({ open: false, transcription: '', wordCount: 0, duration: 0, topic: '', step: 'topic', focusedExtract: '' });
      }
    } catch (err) { console.error(err); }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/files`, {
        method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData
      });
      if (resp.ok) {
        const newFile = await resp.json();
        setFiles([newFile, ...files]);
      }
    } catch (err) { console.error(err); } finally { setUploadingFile(false); if (fileUploadRef.current) fileUploadRef.current.value = ""; }
  };

  const handleFileDelete = async (fileId: string) => {
    if (!confirm("¿Eliminar archivo permanentemente?")) return;
    const token = localStorage.getItem("token");
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/files/${fileId}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) setFiles(files.filter(f => f.id !== fileId));
    } catch (err) { console.error(err); }
  };

  const handleDeleteCustomer = async () => {
    if (!confirm("¿Estás seguro de que quieres eliminar este contacto? Esta acción eliminará permanentemente todo su historial y archivos.")) return;
    
    const token = localStorage.getItem("token");
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (resp.ok) {
        router.push("/crm");
      }
    } catch (err) {
      console.error("Error deleting customer:", err);
    }
  };

  const handleEditInteraction = (interaction: Interaction) => {
    setEditingInteraction(interaction.id);
    setEditInteractionType(interaction.interaction_type);
    setEditDescription(interaction.description);
    setEditInteractionDate(interaction.interaction_date ? interaction.interaction_date.substring(0, 16) : "");
    setEditSelectedTaskId(interaction.task_id || "");
  };

  const handleUpdateInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInteraction) return;
    setUpdatingInteraction(true);
    const token = localStorage.getItem("token");
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions/${editingInteraction}`, {
        method: "PUT", headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ 
          interaction_type: editInteractionType, 
          description: editDescription, 
          interaction_date: editInteractionDate || null,
          task_id: editSelectedTaskId || null
        })
      });
      if (resp.ok) {
        const updated = await resp.json();
        setInteractions(interactions.map(i => i.id === editingInteraction ? updated : i));
        setEditingInteraction(null);
        setEditSelectedTaskId("");
      }
    } catch (err) { console.error(err); } finally { setUpdatingInteraction(false); }
  };

  const handleDeleteInteraction = async (interactionId: string) => {
    if (!confirm("¿Eliminar este registro de actividad?")) return;
    const token = localStorage.getItem("token");
    try {
      const resp = await fetch(`http://127.0.0.1:8000/api/crm/customers/${customerId}/interactions/${interactionId}`, {
        method: "DELETE", headers: { "Authorization": `Bearer ${token}` }
      });
      if (resp.ok) setInteractions(interactions.filter(i => i.id !== interactionId));
    } catch (err) { console.error(err); }
  };

  const handleAISuggestions = async () => {
    let historyText = interactions.length > 0 
      ? interactions.slice(0, 10).map(i => `- [${new Date(i.interaction_date || i.created_at).toLocaleDateString()}] ${i.interaction_type.toUpperCase()}: ${i.description}`).join("\n") 
      : "Sin historial previo.";

    const message = `🎯 INFORME ESTRATÉGICO DE VENTAS REQUERIDO
Olvida el formato conversacional. Devuelve un bloque JSON válido con esta estructura:
{
  "temperatura": "Caliente / Tibio / Frío",
  "siguiente_paso": "Acción inmediata táctica y corta (max 2 líneas)",
  "borrador_email": {
    "asunto": "Asunto profesional e impactante",
    "cuerpo": "Cuerpo del email estratégico y personalizado"
  }
}

CLIENTE: ${customer.first_name} ${customer.last_name || ''}
EMPRESA: ${customer.company || 'Particular'}
HISTORIAL RECIENTE:
${historyText}`;

    setLoadingInsights(true);
    setAiInsights(null);
    const token = localStorage.getItem("token");
    try {
      const resp = await fetch("http://127.0.0.1:8000/api/assistant/chat", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ message, history: [] })
      });
      if (resp.ok) {
        const data = await resp.json();
        const jsonMatch = data.reply.match(/\{[\s\S]*\}/);
        if (jsonMatch) setAiInsights(JSON.parse(jsonMatch[0]));
      }
    } catch(e) { console.error(e); } finally { setLoadingInsights(false); }
  };

  return (
    <div className="flex flex-col min-h-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Upper Navigation & Title */}
      <header className="flex flex-col gap-4 mb-6">
        {/* Back button row */}
        <div className="flex items-center justify-between">
           <button 
             onClick={() => router.push("/crm")} 
             className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors font-bold text-sm"
           >
             <ArrowLeft size={18} /> <span className="hidden sm:inline">Volver al CRM</span>
           </button>
           <div className="flex gap-2">
            <button 
              onClick={handleAISuggestions}
              disabled={loadingInsights}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-wider px-4 py-2.5 rounded-xl shadow-lg transition-all disabled:opacity-50"
            >
              {loadingInsights ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
              <span className="hidden sm:inline">Análisis IA</span>
              <span className="sm:hidden">IA</span>
            </button>
            <button 
              onClick={handleDeleteCustomer}
              className="w-9 h-9 flex items-center justify-center bg-white border border-slate-200 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-xl transition-all"
            >
              <Trash2 size={16} />
            </button>
           </div>
        </div>
        
        {/* Customer name & info */}
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              {customer.first_name} {customer.last_name || ""}
            </h1>
            <div className="flex gap-1.5">
              <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${statusColors[customer.status.toUpperCase()] || statusColors.ACTIVO}`}>
                {customer.status}
              </span>
              <span className={`px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider border ${customer.customer_type === 'client' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                {customer.customer_type === 'client' ? 'Socio' : 'Lead'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-400 font-bold text-xs uppercase tracking-widest mt-1.5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Building2 size={12} className="text-indigo-400" />
              <span>{customer.company || "Particular"}</span>
            </div>
            <div className="w-1 h-1 bg-slate-300 rounded-full hidden sm:block"></div>
            <div className="flex items-center gap-1.5">
              <History size={12} className="text-indigo-400" />
              <span>Desde {new Date(customer.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>
      </header>

      {/* AI Intelligence Console */}
      {(loadingInsights || aiInsights) && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-6 bg-slate-900/40 backdrop-blur-[12px] animate-in fade-in duration-300">
          <div className="bg-white rounded-t-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-5xl max-h-[95dvh] md:max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 md:zoom-in-95 duration-500 border border-slate-100">
            <div className="md:hidden flex justify-center pt-3 pb-1"><div className="w-10 h-1 bg-slate-200 rounded-full" /></div>
            {loadingInsights ? (
              <div className="flex flex-col items-center justify-center py-40 gap-6">
                 <div className="relative">
                    <div className="w-20 h-20 bg-indigo-50 rounded-full animate-ping opacity-20"></div>
                    <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600 animate-pulse" size={48} />
                 </div>
                 <p className="text-slate-400 font-black uppercase tracking-[0.3em] text-[10px]">IA analizando patrones comerciales...</p>
              </div>
            ) : aiInsights ? (
              <div className="flex flex-col h-full overflow-hidden">
                <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-5">
                      <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
                        <TrendingUp size={28} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2">Estrategia de Ventas IA</h2>
                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest italic">Análisis predictivo basado en interacciones</p>
                      </div>
                   </div>
                   <button onClick={() => setAiInsights(null)} className="w-12 h-12 flex items-center justify-center bg-white hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-[1.25rem] transition-all hover:rotate-90 shadow-sm">
                      <X size={24} />
                   </button>
                </div>
                
                <div className="flex-grow overflow-y-auto p-10 grid grid-cols-1 lg:grid-cols-12 gap-8 custom-scrollbar">
                   {/* Left Column: Metrics */}
                   <div className="lg:col-span-5 space-y-6">
                      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-start gap-6 group hover:border-indigo-200 transition-colors">
                         <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-[1.25rem] flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                            <Thermometer size={24} />
                         </div>
                         <div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Propensión de Cierre</p>
                            <p className="text-3xl font-black text-slate-800">{aiInsights.temperatura}</p>
                         </div>
                      </div>

                      <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col gap-4 group hover:border-indigo-200 transition-colors h-full">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-[1.25rem] flex items-center justify-center shadow-inner shrink-0 group-hover:scale-110 transition-transform">
                               <Target size={22} />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-slate-400">Recomendación Táctica</p>
                         </div>
                         <p className="text-[15px] font-bold text-slate-600 leading-relaxed italic border-l-4 border-indigo-100 pl-4">
                            "{aiInsights.siguiente_paso}"
                         </p>
                      </div>
                   </div>

                   {/* Right Column: Communication */}
                   <div className="lg:col-span-7 bg-slate-50 border border-slate-100 p-8 rounded-[2rem] flex flex-col gap-6 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16"></div>
                      <div className="flex items-center justify-between relative z-10">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                               <MailCheck size={22} strokeWidth={2.5} />
                            </div>
                            <p className="text-[10px] uppercase tracking-widest font-black text-indigo-500">Borrador Estratégico</p>
                         </div>
                         <button 
                            onClick={() => {
                               const text = `Asunto: ${aiInsights.borrador_email?.asunto}\n\n${aiInsights.borrador_email?.cuerpo}`;
                               navigator.clipboard.writeText(text);
                               alert("Estrategia copiada al portapapeles.");
                            }}
                            className="bg-white text-slate-800 text-[10px] font-black uppercase tracking-widest px-6 py-3 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all flex items-center gap-2"
                         >
                            <Copy size={14} /> Copiar Todo
                         </button>
                      </div>

                      <div className="bg-white/80 backdrop-blur-sm border border-white rounded-[2rem] p-8 flex-grow flex flex-col gap-6 relative z-10 shadow-[0_8px_30px_rgba(0,0,0,0.02)]">
                         <div>
                            <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1 block">Asunto del Correo</label>
                            <p className="text-[15px] font-black text-slate-900 leading-tight">{aiInsights.borrador_email?.asunto}</p>
                         </div>
                         <div className="w-full h-px bg-slate-100"></div>
                         <div className="flex-grow overflow-y-auto pr-4 custom-scrollbar">
                             <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 block">Cuerpo del Mensaje</label>
                             <p className="text-[15px] font-bold text-slate-600 leading-relaxed whitespace-pre-wrap">{aiInsights.borrador_email?.cuerpo}</p>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 xl:gap-12 items-start">
         
         {/* Left Column: Dossier */}
         <div className="xl:col-span-4 space-y-4 xl:space-y-8 xl:sticky xl:top-8">
            {/* Contact Panel */}
            <div className="bg-white rounded-[2rem] p-6 md:p-10 shadow-sm border border-slate-100 relative overflow-hidden">
               <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500"></div>
               <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Dossier del Contacto</h2>

               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-1 gap-4">
                  {[
                    { icon: <User size={16} />, label: "Nombre", value: `${customer.first_name} ${customer.last_name || ""}` },
                    { icon: <Mail size={16} />, label: "Email", value: customer.email || "No vinculado" },
                    { icon: <Phone size={16} />, label: "Teléfono", value: customer.phone || "No vinculado" },
                    { icon: <Building2 size={16} />, label: "Empresa", value: customer.company || "Particular" }
                  ].map((field, i) => (
                    <div key={i} className="flex items-center gap-3">
                       <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center text-indigo-500 shrink-0">
                          {field.icon}
                       </div>
                       <div className="min-w-0">
                          <p className="text-[9px] font-black tracking-widest text-slate-300 uppercase">{field.label}</p>
                          <p className="text-sm font-bold text-slate-700 truncate">{field.value}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            {/* Assets Panel */}
            <div className="bg-white rounded-[2.5rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-2">
                     <Paperclip size={14} className="text-indigo-500" />
                     Repositorio de Archivos
                  </h2>
                  <input type="file" className="hidden" ref={fileUploadRef} onChange={handleFileUpload} />
                  <button 
                     onClick={() => fileUploadRef.current?.click()}
                     className="w-10 h-10 flex items-center justify-center bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-500/20 hover:-translate-y-1 transition-all"
                  >
                     <Plus size={20} />
                  </button>
               </div>

               <div className="min-h-[100px] flex flex-col gap-3">
                  {files.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-3 text-slate-300">
                      <File size={32} strokeWidth={1} />
                      <p className="text-xs font-bold uppercase tracking-widest italic text-center">Bóveda vacía</p>
                    </div>
                  ) : (
                    files.map((file) => (
                       <div key={file.id} className="group/file flex items-center justify-between bg-slate-50/50 hover:bg-white p-4 rounded-2xl border border-transparent hover:border-indigo-100 hover:shadow-xl transition-all duration-300">
                          <div className="flex items-center gap-4 overflow-hidden">
                             <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-lg shadow-sm border border-slate-100">
                               {getFileIcon(file.mime_type)}
                             </div>
                             <div className="min-w-0">
                                <p className="text-xs font-black text-slate-700 truncate group-hover/file:text-indigo-600 transition-colors uppercase tracking-tight">{file.file_name}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{formatFileSize(file.file_size)}</p>
                             </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover/file:opacity-100 transition-opacity">
                             <a href={file.file_url} target="_blank" className="p-2 hover:bg-indigo-50 text-indigo-400 hover:text-indigo-600 rounded-lg"><Download size={14} /></a>
                             <button onClick={() => handleFileDelete(file.id)} className="p-2 hover:bg-rose-50 text-rose-300 hover:text-rose-500 rounded-lg"><Trash2 size={14} /></button>
                          </div>
                       </div>
                    ))
                  )}
               </div>
            </div>
         </div>

         {/* Right Column: Chronicles */}
         <div className="xl:col-span-8 space-y-6">
            {/* Quick Record Tool */}
            <div className={`bg-white rounded-[2.5rem] shadow-xl border border-slate-100 transition-all duration-500 overflow-hidden ${showAddForm ? 'p-10' : 'p-6'}`}>
               {!showAddForm ? (
                  <div className="flex items-center justify-between gap-6">
                     <button 
                        onClick={() => setShowAddForm(true)}
                        className="flex-grow h-14 bg-slate-50 hover:bg-white border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 font-bold px-8 rounded-2xl transition-all flex items-center gap-3 group"
                     >
                        <Pencil size={18} className="group-hover:scale-110 transition-transform" />
                        Añadir un nuevo registro estratégico o nota...
                     </button>
                     <div className="flex gap-2 shrink-0">
                         <button 
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadingAudio}
                            className="w-14 h-14 flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl shadow-lg shadow-indigo-500/30 hover:-translate-y-1 transition-all disabled:opacity-50"
                            title="Subir Grabación de Audio (Whisper IA)"
                         >
                            <Mic size={22} strokeWidth={2.5} />
                            <input type="file" accept="audio/*" className="hidden" ref={fileInputRef} onChange={handleAudioUpload} />
                         </button>
                     </div>
                  </div>
               ) : (
                  <form onSubmit={handleAddInteraction} className="animate-in slide-in-from-top-4 fade-in duration-500">
                     <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                              <Plus size={24} />
                           </div>
                           <h3 className="text-2xl font-black text-slate-900 tracking-tight leading-none">Nueva Interacción</h3>
                        </div>
                        <button type="button" onClick={() => setShowAddForm(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all">
                           <X size={20} />
                        </button>
                     </div>

                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Modalidad de Acción</label>
                           <select
                              className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all appearance-none cursor-pointer"
                              value={newInteractionType}
                              onChange={(e) => { setNewInteractionType(e.target.value); }}
                           >
                              <option value="note">📝 Nota Estratégica</option>
                              <option value="call">📞 Llamada / Enlace Voz</option>
                              <option value="meeting">📅 Reunión Presencial/Virtual</option>
                              <option value="email">✉️ Comunicación Email/Chat</option>
                              <option value="sale">💼 Cierre / Hito Comercial</option>
                              <option value="quotation">📊 Cotización Formal</option>
                           </select>
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Cronología (Opcional)</label>
                           <input
                              type="datetime-local"
                              className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                              value={newInteractionDate}
                              onChange={(e) => setNewInteractionDate(e.target.value)}
                           />
                        </div>
                     </div>

                      {/* Quote builder — visible only when type is quotation */}
                      {newInteractionType === 'quotation' && (
                        <div className="mb-8 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Título de la Cotización</label>
                            <input
                              type="text"
                              placeholder="Ej: Desarrollo de Sitio Web Corporativo"
                              className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all"
                              value={quoteTitle}
                              onChange={(e) => setQuoteTitle(e.target.value)}
                            />
                          </div>

                          <div className="bg-slate-50/50 rounded-2xl p-4 space-y-3">
                            <div className="grid grid-cols-12 gap-2 px-2">
                              <span className="col-span-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Servicio / Concepto</span>
                              <span className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Cant.</span>
                              <span className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Precio U.</span>
                              <span className="col-span-2 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Total</span>
                            </div>
                            {quoteItems.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                                <input
                                  className="col-span-6 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 transition-all"
                                  placeholder="Descripción del servicio..."
                                  value={item.description}
                                  onChange={(e) => { const n = [...quoteItems]; n[idx].description = e.target.value; setQuoteItems(n); }}
                                />
                                <input
                                  type="number" min="1"
                                  className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 text-center transition-all"
                                  value={item.qty}
                                  onChange={(e) => { const n = [...quoteItems]; n[idx].qty = Number(e.target.value); setQuoteItems(n); }}
                                />
                                <input
                                  type="number" min="0"
                                  className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-400 text-right transition-all"
                                  value={item.unitPrice}
                                  onChange={(e) => { const n = [...quoteItems]; n[idx].unitPrice = Number(e.target.value); setQuoteItems(n); }}
                                />
                                <span className="col-span-1 text-xs font-black text-indigo-600 text-right">${(item.qty * item.unitPrice).toLocaleString()}</span>
                                <button type="button" onClick={() => setQuoteItems(quoteItems.filter((_, i) => i !== idx))} className="col-span-1 w-7 h-7 flex items-center justify-center text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all">
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                            <button type="button" onClick={() => setQuoteItems([...quoteItems, { description: "", qty: 1, unitPrice: 0 }])} className="w-full py-2.5 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-400 hover:text-indigo-600 text-xs font-black rounded-xl transition-all flex items-center justify-center gap-2">
                              <Plus size={14} /> Agregar línea
                            </button>
                            <div className="flex justify-between items-center pt-3 border-t border-slate-200 px-2">
                              <span className="text-sm font-black text-slate-500 uppercase tracking-widest">Total</span>
                              <span className="text-xl font-black text-indigo-700">${quoteItems.reduce((s, i) => s + i.qty * i.unitPrice, 0).toLocaleString()} MXN</span>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Notas / Condiciones (Opcional)</label>
                            <textarea
                              rows={2}
                              placeholder="Vigencia, condiciones de pago, alcance, etc."
                              className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none"
                              value={quoteNotes}
                              onChange={(e) => setQuoteNotes(e.target.value)}
                            />
                          </div>
                        </div>
                      )}

                      {/* Text area — hidden for quotation */}
                      {newInteractionType !== 'quotation' && (
                      <div className="mb-8 relative group">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-indigo-600 transition-colors">Contenido del Registro</label>
                        <textarea 
                           ref={textareaRef}
                           rows={6}
                           placeholder="Describe de qué trató la interacción. Tip: Usa # para mencionar tareas vinculadas..."
                           className="w-full bg-slate-50/50 border-2 border-transparent rounded-[2rem] px-8 py-6 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none shadow-inner"
                           value={newDescription}
                           onChange={handleDescriptionChange}
                           onKeyDown={handleKeyDown}
                        />
                        
                        {showTaskSuggestions && filteredTasks.length > 0 && (
                            <div className="absolute z-50 left-0 right-0 bottom-full mb-3 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                               <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/50 to-transparent">
                                  <div className="flex items-center gap-3">
                                     <div className="w-8 h-8 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                                        <Target size={14} className="animate-pulse" />
                                     </div>
                                     <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">Enlazar Milenio / Tarea</span>
                                  </div>
                                  <span className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100/50">COINCIDENCIAS ENCONTRADAS</span>
                               </div>
                               <div className="max-h-64 overflow-y-auto custom-scrollbar p-2 space-y-1">
                                  {filteredTasks.map((task: any, index: number) => (
                                    <button
                                      key={task.id}
                                      type="button"
                                      onClick={() => handleSelectTask(task)}
                                      onMouseEnter={() => setActiveSuggestionIndex(index)}
                                      className={`w-full px-5 py-4 text-left rounded-2xl transition-all duration-300 flex items-center justify-between group/suggest ${index === activeSuggestionIndex ? 'bg-indigo-600 shadow-xl shadow-indigo-100 translate-x-2' : 'hover:bg-slate-50 text-slate-700'}`}
                                    >
                                      <div className="flex items-center gap-5">
                                         <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 transition-all ${index === activeSuggestionIndex ? 'bg-white/20' : 'bg-white border border-slate-100 shadow-inner'}`}>
                                            <Briefcase size={18} className={index === activeSuggestionIndex ? 'text-white' : 'text-slate-400'} />
                                         </div>
                                         <div className="flex flex-col gap-0.5">
                                            <p className={`font-black text-sm tracking-tight ${index === activeSuggestionIndex ? 'text-white' : 'text-slate-900'}`}>{task.title}</p>
                                            <div className="flex items-center gap-2">
                                               <div className={`w-1.5 h-1.5 rounded-full ${task.status === 'COMPLETED' ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`}></div>
                                               <p className={`text-[9px] font-black uppercase tracking-widest ${index === activeSuggestionIndex ? 'text-indigo-100' : 'text-slate-400'}`}>{task.status}</p>
                                            </div>
                                         </div>
                                      </div>
                                      <div className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all ${index === activeSuggestionIndex ? 'bg-white/20 text-white scale-110' : 'opacity-0 group-hover/suggest:opacity-100 bg-slate-100 text-slate-300'}`}>
                                         <Check size={16} strokeWidth={3} />
                                      </div>
                                    </button>
                                  ))}
                               </div>
                               <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-10">
                                  <div className="flex items-center gap-2">
                                     <kbd className="bg-white border border-slate-200 px-2 py-1 rounded text-[10px] font-black text-slate-500 shadow-sm">↑↓</kbd>
                                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Moverse</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                     <kbd className="bg-white border border-slate-200 px-2 py-1 rounded text-[10px] font-black text-slate-500 shadow-sm">TAB / ENTER</kbd>
                                     <span className="text-[10px] font-black uppercase text-slate-400 tracking-tight">Confirmar</span>
                                  </div>
                               </div>
                            </div>
                        )}
                     </div>
                     )}

                     <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                           <button 
                              type="button"
                              onClick={() => fileForNoteRef.current?.click()}
                              className={`flex items-center gap-3 px-6 py-3 rounded-2xl border-2 border-transparent transition-all font-bold text-sm ${selectedFile ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                           >
                              <Paperclip size={18} />
                              <span className="truncate max-w-[200px]">{selectedFile ? selectedFile.name : "Vincular documento..."}</span>
                              <input type="file" className="hidden" ref={fileForNoteRef} onChange={(e) => { const f = e.target.files?.[0]; if(f) setSelectedFile(f); }} />
                           </button>
                        </div>

                        <div className="flex gap-4 w-full sm:w-auto">
                           <button 
                              type="button" 
                              onClick={() => setShowAddForm(false)}
                              className="px-8 py-4 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                           >
                              Descartar
                           </button>
                           <button 
                              type="submit" 
                              disabled={addingInteraction || (newInteractionType !== 'quotation' && !newDescription.trim()) || (newInteractionType === 'quotation' && (!quoteTitle.trim() || quoteItems.every(i => !i.description.trim())))}
                              className="px-10 py-4 bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:-translate-y-1 active:translate-y-0 transition-all disabled:opacity-50 flex items-center gap-3"
                           >
                              {addingInteraction ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} strokeWidth={2.5} />}
                              {newInteractionType === 'quotation' ? 'Guardar Cotización' : 'Archivar Registro'}
                           </button>
                        </div>
                     </div>
                  </form>
               )}
            </div>

            {/* Timeline Chronicle */}
            <div className="relative space-y-6 pl-10 md:pl-20 py-4 pb-12 md:pb-20 before:absolute before:inset-y-0 before:left-[1.6rem] md:before:left-14 before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-indigo-100 before:to-transparent">
               {interactions.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-dashed border-slate-200 gap-4">
                     <History size={48} className="text-slate-200" />
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No hay hitos en la cronología</p>
                  </div>
               ) : (
                  interactions.map((interaction, i) => (
                    <div key={interaction.id} className="relative group transition-all duration-500 hover:translate-x-2">
                       {/* Node */}
                       <div className="absolute left-[-2.2rem] md:left-[-4.5rem] mt-2 transition-transform duration-500 z-10">
                          {getInteractionIcon(interaction.interaction_type)}
                       </div>
                       
                       <div className="bg-white rounded-[2.5rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.02)] border border-slate-50 group-hover:shadow-[0_20px_50px_rgba(79,70,229,0.05)] group-hover:border-indigo-100 transition-all duration-500 relative">
                           {/* Quick Actions */}
                           <div className="absolute top-8 right-8 flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-4 group-hover:translate-x-0">
                               <button 
                                 onClick={() => handleEditInteraction(interaction)}
                                 className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-indigo-600 rounded-xl shadow-sm hover:shadow-md transition-all"
                               >
                                 <Pencil size={14} />
                               </button>
                               <button 
                                 onClick={() => handleDeleteInteraction(interaction.id)}
                                 className="w-10 h-10 flex items-center justify-center bg-white border border-slate-100 text-slate-400 hover:text-rose-500 rounded-xl shadow-sm hover:shadow-md transition-all"
                               >
                                 <Trash2 size={14} />
                               </button>
                           </div>

                           <div className="flex items-center gap-3 mb-6">
                              <p className="text-[10px] font-black uppercase text-indigo-500 tracking-[0.2em]">Crónica Estratégica</p>
                              <div className="w-1 h-1 bg-slate-200 rounded-full"></div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                                 {new Date(interaction.interaction_date || interaction.created_at).toLocaleString([], { dateStyle: 'long', timeStyle: 'short' })}
                              </p>
                           </div>

                           {editingInteraction === interaction.id ? (
                               <form onSubmit={handleUpdateInteraction} className="space-y-6 pt-2">
                                  <div className="grid grid-cols-2 gap-4">
                                     <select
                                        value={editInteractionType}
                                        onChange={(e) => setEditInteractionType(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-400 outline-none transition-all"
                                     >
                                        <option value="note">Nota</option>
                                        <option value="meeting">Reunión</option>
                                        <option value="call">Llamada</option>
                                        <option value="email">Email</option>
                                        <option value="sale">Venta</option>
                                     </select>
                                     <input
                                        type="datetime-local"
                                        value={editInteractionDate}
                                        onChange={(e) => setEditInteractionDate(e.target.value)}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-xl px-4 py-3 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-400 outline-none transition-all"
                                     />
                                  </div>
                                  <div className="relative">
                                     <textarea
                                        ref={textareaEditRef}
                                        value={editDescription}
                                        onChange={handleEditDescriptionChange}
                                        onKeyDown={(e) => handleKeyDown(e, true)}
                                        rows={4}
                                        className="w-full bg-slate-50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 focus:bg-white focus:border-indigo-400 outline-none transition-all resize-none shadow-inner"
                                     />
                                     
                                     {showTaskSuggestions && filteredTasks.length > 0 && (
                                         <div className="absolute z-50 left-0 right-0 bottom-full mb-3 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-[2rem] shadow-[0_20px_70px_-10px_rgba(0,0,0,0.15)] overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-2 duration-300">
                                            <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between bg-white">
                                               <div className="flex items-center gap-3">
                                                  <Target size={14} className="text-indigo-600 animate-pulse" strokeWidth={3} />
                                                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Vincular Objetivo</span>
                                               </div>
                                            </div>
                                            <div className="max-h-56 overflow-y-auto custom-scrollbar p-1.5 space-y-1">
                                              {filteredTasks.map((task: any, index: number) => (
                                                <button
                                                  key={task.id}
                                                  type="button"
                                                  onClick={() => handleEditSelectTask(task)}
                                                  onMouseEnter={() => setActiveSuggestionIndex(index)}
                                                  className={`w-full px-4 py-3 text-left rounded-xl transition-all flex items-center justify-between group/suggest ${index === activeSuggestionIndex ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'hover:bg-slate-50 text-slate-700'}`}
                                                >
                                                  <div className="flex items-center gap-4">
                                                     <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${index === activeSuggestionIndex ? 'bg-white/20' : 'bg-slate-50 border border-slate-100 shadow-inner'}`}>
                                                        <Briefcase size={14} className={index === activeSuggestionIndex ? 'text-white' : 'text-slate-400'} />
                                                     </div>
                                                     <div className="flex flex-col">
                                                        <p className={`font-black text-[11px] tracking-tight ${index === activeSuggestionIndex ? 'text-white' : 'text-slate-800'}`}>{task.title}</p>
                                                        <p className={`text-[8px] font-black uppercase tracking-widest ${index === activeSuggestionIndex ? 'text-indigo-100' : 'text-slate-400'}`}>{task.status}</p>
                                                     </div>
                                                  </div>
                                                  <div className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all ${index === activeSuggestionIndex ? 'bg-white/20 text-white scale-110' : 'opacity-0 group-hover/suggest:opacity-100 bg-slate-100 text-slate-300'}`}>
                                                     <Check size={12} strokeWidth={3} />
                                                  </div>
                                                </button>
                                              ))}
                                            </div>
                                         </div>
                                     )}
                                   </div>
                                   <div className="flex gap-3">
                                     <button type="submit" disabled={updatingInteraction} className="flex-1 bg-indigo-600 text-white font-black uppercase tracking-widest text-[10px] py-3 rounded-xl shadow-lg shadow-indigo-500/20">Guardar Cambios</button>
                                     <button type="button" onClick={() => setEditingInteraction(null)} className="flex-1 bg-slate-100 text-slate-500 font-black uppercase tracking-widest text-[10px] py-3 rounded-xl">Cancelar</button>
                                  </div>
                               </form>
                           ) : interaction.interaction_type === 'quotation' && (() => {
                               // Parse the stored JSON quotation
                               let q: any = null;
                               try { q = JSON.parse(interaction.description); } catch { return null; }
                               if (!q || q.__type !== 'quotation') {
                                 return (
                                   <div className="prose prose-slate max-w-none prose-sm">
                                     <div className="text-[15px] font-bold text-slate-600 leading-relaxed">
                                       <ReactMarkdown>{interaction.description}</ReactMarkdown>
                                     </div>
                                   </div>
                                 );
                               }
                               const handlePrintQuote = () => {
                                 const total = q.items.reduce((s: number, i: any) => s + i.qty * i.unitPrice, 0);
                                 const itemRows = q.items.map((i: any) => `
                                   <tr>
                                     <td class="py-2.5 px-4 text-sm text-gray-700 border-b border-gray-100">${i.description}</td>
                                     <td class="py-2.5 px-4 text-sm text-center text-gray-700 border-b border-gray-100">${i.qty}</td>
                                     <td class="py-2.5 px-4 text-sm text-right text-gray-700 border-b border-gray-100">$${i.unitPrice.toLocaleString()}</td>
                                     <td class="py-2.5 px-4 text-sm text-right font-bold text-gray-900 border-b border-gray-100">$${(i.qty * i.unitPrice).toLocaleString()}</td>
                                   </tr>`).join('');
                                 const win = window.open('', '_blank', 'width=850,height=700');
                                 if (!win) return;
                                 win.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Cotización - ${q.title}</title><style>body{font-family:'Helvetica Neue',Arial,sans-serif;margin:0;padding:40px;color:#1a1a2e;background:#fff}h1{font-size:22px;font-weight:900;color:#312e81;margin:0}.badge{display:inline-block;background:#eef2ff;color:#4338ca;border:1px solid #c7d2fe;border-radius:6px;padding:4px 12px;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase}.header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:24px;border-bottom:2px solid #eef2ff;margin-bottom:28px}.meta{font-size:12px;color:#6b7280;line-height:1.8}table{width:100%;border-collapse:collapse;margin-top:8px}th{background:#f5f3ff;color:#4338ca;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.1em;padding:10px 16px;text-align:left}th:last-child,td:last-child{text-align:right}th:nth-child(2),td:nth-child(2){text-align:center}.total-row td{padding:14px 16px;font-size:16px;font-weight:900;color:#312e81;background:#f5f3ff;border-radius:4px}.notes{margin-top:24px;padding:16px;background:#fafafa;border-radius:8px;font-size:12px;color:#6b7280;border:1px solid #e5e7eb}.footer{margin-top:40px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center}@media print{body{padding:20px}}</style></head><body><div class="header"><div><span class="badge">Cotización Formal</span><h1 style="margin-top:8px">${q.title}</h1><p class="meta">Para: <strong>${q.client}${q.company ? ' — ' + q.company : ''}</strong></p></div><div class="meta" style="text-align:right">Fecha: <strong>${new Date(q.date).toLocaleDateString('es-MX',{day:'2-digit',month:'long',year:'numeric'})}</strong></div></div><table><thead><tr><th>Servicio / Concepto</th><th>Cant.</th><th>Precio Unitario</th><th>Total</th></tr></thead><tbody>${itemRows}<tr class="total-row"><td colspan="3">TOTAL</td><td>$${total.toLocaleString()} ${q.currency}</td></tr></tbody></table>${q.notes ? '<div class="notes"><strong>Notas:</strong> '+q.notes+'</div>' : ''}<div class="footer">Este documento fue generado automáticamente por el sistema CRM.</div></body></html>`);
                                 win.document.close();
                                 setTimeout(() => { win.focus(); win.print(); }, 400);
                               };
                               return (
                                 <div className="space-y-4">
                                   <div className="flex items-center justify-between">
                                     <div>
                                       <span className="text-[9px] font-black uppercase tracking-widest text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg">Cotización Formal</span>
                                       <h4 className="text-base font-black text-slate-900 mt-1.5">{q.title}</h4>
                                     </div>
                                     <button
                                       onClick={handlePrintQuote}
                                       className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl shadow-md shadow-indigo-500/30 hover:-translate-y-0.5 transition-all"
                                     >
                                       <Printer size={14} /> Descargar PDF
                                     </button>
                                   </div>
                                   <div className="bg-slate-50 rounded-2xl overflow-hidden">
                                     <table className="w-full text-xs">
                                       <thead>
                                         <tr className="bg-indigo-50">
                                           <th className="text-left px-4 py-2.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">Servicio</th>
                                           <th className="text-center px-4 py-2.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">Cant.</th>
                                           <th className="text-right px-4 py-2.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">Precio U.</th>
                                           <th className="text-right px-4 py-2.5 text-[10px] font-black text-indigo-600 uppercase tracking-widest">Total</th>
                                         </tr>
                                       </thead>
                                       <tbody>
                                         {q.items.map((item: any, idx: number) => (
                                           <tr key={idx} className="border-t border-slate-100">
                                             <td className="px-4 py-2.5 text-slate-700 font-bold">{item.description}</td>
                                             <td className="px-4 py-2.5 text-center text-slate-600">{item.qty}</td>
                                             <td className="px-4 py-2.5 text-right text-slate-600">${item.unitPrice.toLocaleString()}</td>
                                             <td className="px-4 py-2.5 text-right font-black text-slate-900">${(item.qty * item.unitPrice).toLocaleString()}</td>
                                           </tr>
                                         ))}
                                         <tr className="border-t-2 border-indigo-100 bg-indigo-50/60">
                                           <td colSpan={3} className="px-4 py-3 text-xs font-black uppercase tracking-widest text-indigo-600">TOTAL</td>
                                           <td className="px-4 py-3 text-right text-base font-black text-indigo-700">${q.total.toLocaleString()} {q.currency}</td>
                                         </tr>
                                       </tbody>
                                     </table>
                                   </div>
                                   {q.notes && (
                                     <p className="text-xs text-slate-500 bg-amber-50 border border-amber-100 rounded-xl px-4 py-2.5 font-medium">
                                       📋 {q.notes}
                                     </p>
                                   )}
                                 </div>
                               );
                             })() || (
                               <div className="prose prose-slate max-w-none prose-sm group-hover:prose-indigo transition-colors duration-500">
                                  <div className="text-[15px] font-bold text-slate-600 leading-relaxed group-hover:text-slate-800">
                                     <ReactMarkdown>{interaction.description}</ReactMarkdown>
                                  </div>
                               </div>
                             )}

                           {interaction.tasks && (
                             <div className="mt-8 flex items-center gap-4 border-t border-slate-50 pt-6">
                                <div className="w-10 h-10 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center shrink-0">
                                   <Briefcase size={18} />
                                </div>
                                <div className="flex flex-col">
                                   <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest leading-none mb-1">Milenio / Tarea Vinculada</p>
                                   <div className="flex items-center gap-3">
                                      <p className="text-xs font-black text-slate-700 hover:text-indigo-600 cursor-pointer transition-colors" onClick={() => router.push('/tasks')}>
                                         {interaction.tasks.title}
                                      </p>
                                      <div className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                                         interaction.tasks.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                         interaction.tasks.status === 'in_progress' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-slate-50 text-slate-500 border-slate-100'
                                      }`}>
                                         {interaction.tasks.status}
                                      </div>
                                   </div>
                                </div>
                             </div>
                           )}
                       </div>
                    </div>
                  ))
               )}
            </div>
         </div>
      </div>

      {/* ===== AUDIO TRIMMER MODAL ===== */}
      {audioTrimmer.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" onClick={() => {
            if (audioTrimmer.objectUrl) URL.revokeObjectURL(audioTrimmer.objectUrl);
            setAudioTrimmer({ open: false, file: null, objectUrl: '', duration: 0, startTime: 0, endTime: 0, probing: false, transcribing: false });
          }} />
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(79,70,229,0.25)] border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-400">
            {/* Header */}
            <div className="px-8 pt-7 pb-5 border-b border-slate-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-violet-500/30 shrink-0">
                <Mic size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Seleccionar Segmento</h2>
                <p className="text-xs text-slate-400 font-bold mt-0.5 truncate">{audioTrimmer.file?.name}</p>
              </div>
              <button onClick={() => {
                if (audioTrimmer.objectUrl) URL.revokeObjectURL(audioTrimmer.objectUrl);
                setAudioTrimmer({ open: false, file: null, objectUrl: '', duration: 0, startTime: 0, endTime: 0, probing: false, transcribing: false });
              }} className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all">
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-7">
              {audioTrimmer.probing ? (
                <div className="flex flex-col items-center justify-center py-10 gap-4 text-indigo-600">
                  <Loader2 size={28} className="animate-spin" />
                  <span className="text-sm font-black uppercase tracking-widest">Analizando archivo de audio...</span>
                  <p className="text-xs text-slate-400 font-bold">Esto puede tomar unos segundos</p>
                </div>
              ) : (
                <>
                  {/* Audio player */}
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Previsualización</p>
                    <audio
                      controls
                      src={audioTrimmer.objectUrl}
                      className="w-full rounded-xl"
                      style={{ height: '44px' }}
                    />
                  </div>

                  {/* Time range sliders */}
                  <div className="space-y-5">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      Rango a transcribir — duración total: {Math.floor(audioTrimmer.duration / 60)}:{String(Math.floor(audioTrimmer.duration % 60)).padStart(2, '0')}
                    </p>

                    {/* Visual range bar */}
                    <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full"
                        style={{
                          left: `${(audioTrimmer.startTime / Math.max(audioTrimmer.duration, 1)) * 100}%`,
                          width: `${((audioTrimmer.endTime - audioTrimmer.startTime) / Math.max(audioTrimmer.duration, 1)) * 100}%`
                        }}
                      />
                    </div>

                    {/* Start slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inicio</label>
                        <span className="text-sm font-black text-indigo-700 bg-indigo-50 px-3 py-1 rounded-lg tabular-nums">
                          {Math.floor(audioTrimmer.startTime / 60)}:{String(Math.floor(audioTrimmer.startTime % 60)).padStart(2, '0')}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={audioTrimmer.duration}
                        step={1}
                        value={audioTrimmer.startTime}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setAudioTrimmer(prev => ({ ...prev, startTime: Math.min(v, prev.endTime - 5) }));
                        }}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                    </div>

                    {/* End slider */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Fin</label>
                        <span className="text-sm font-black text-violet-700 bg-violet-50 px-3 py-1 rounded-lg tabular-nums">
                          {Math.floor(audioTrimmer.endTime / 60)}:{String(Math.floor(audioTrimmer.endTime % 60)).padStart(2, '0')}
                        </span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={audioTrimmer.duration}
                        step={1}
                        value={audioTrimmer.endTime}
                        onChange={(e) => {
                          const v = parseFloat(e.target.value);
                          setAudioTrimmer(prev => ({ ...prev, endTime: Math.max(v, prev.startTime + 5) }));
                        }}
                        className="w-full accent-violet-600 cursor-pointer"
                      />
                    </div>

                    {/* Segment info */}
                    <div className="bg-indigo-50/60 rounded-2xl px-5 py-3 flex items-center justify-between">
                      <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Segmento seleccionado</span>
                      <span className="text-sm font-black text-indigo-700 tabular-nums">
                        {Math.floor((audioTrimmer.endTime - audioTrimmer.startTime) / 60)}:{String(Math.floor((audioTrimmer.endTime - audioTrimmer.startTime) % 60)).padStart(2, '0')} min
                      </span>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={() => {
                        if (audioTrimmer.objectUrl) URL.revokeObjectURL(audioTrimmer.objectUrl);
                        setAudioTrimmer({ open: false, file: null, objectUrl: '', duration: 0, startTime: 0, endTime: 0, probing: false, transcribing: false });
                      }}
                      className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleTranscribeSegment}
                      disabled={audioTrimmer.transcribing}
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-60 flex items-center justify-center gap-3"
                    >
                      {audioTrimmer.transcribing ? (
                        <><Loader2 size={16} className="animate-spin" /> Transcribiendo segmento...</>
                      ) : (
                        <><Mic size={16} /> Transcribir segmento con Whisper</>
                      )}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== AUDIO FOCUS MODAL ===== */}
      {audioModal.open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setAudioModal(prev => ({ ...prev, open: false }))}
          />

          {/* Panel */}
          <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(79,70,229,0.2)] border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-6 fade-in duration-400">
            {/* Header */}
            <div className="px-8 pt-8 pb-6 border-b border-slate-50 flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 shrink-0">
                <Mic size={22} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Audio Transcrito</h2>
                <div className="flex items-center gap-3 mt-1">
                  <span className="bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                    ✓ {audioModal.wordCount} palabras
                  </span>
                  {audioModal.duration > 0 && (
                    <span className="bg-slate-50 text-slate-500 border border-slate-100 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg">
                      {Math.round(audioModal.duration)}s de duración
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => setAudioModal(prev => ({ ...prev, open: false }))}
                className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-rose-50 text-slate-300 hover:text-rose-500 rounded-xl transition-all"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {/* STEP: topic input */}
              {(audioModal.step === 'topic' || audioModal.step === 'generating') && (
                <>
                  {/* Mini transcript preview */}
                  <div className="bg-slate-50 rounded-2xl p-4 max-h-32 overflow-y-auto">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Vista previa de la transcripción</p>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium line-clamp-5">
                      {audioModal.transcription.substring(0, 500)}{audioModal.transcription.length > 500 ? '...' : ''}
                    </p>
                  </div>

                  {/* Topic input */}
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                      ¿Sobre qué tema quieres el extracto?
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: precio del servicio web, cierre de contrato, problemas técnicos, próximos pasos..."
                      className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-6 py-4 text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all disabled:opacity-50"
                      value={audioModal.topic}
                      onChange={(e) => setAudioModal(prev => ({ ...prev, topic: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === 'Enter' && audioModal.topic.trim() && audioModal.step === 'topic') handleGenerateFocusedExtract(); }}
                      disabled={audioModal.step === 'generating'}
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-2 ml-2">
                      La IA extraerá únicamente la información relevante a ese tema.
                    </p>
                  </div>

                  {audioModal.step === 'generating' ? (
                    <div className="flex items-center justify-center gap-3 py-6 text-indigo-600">
                      <Loader2 size={22} className="animate-spin" />
                      <span className="text-sm font-black uppercase tracking-widest">Analizando y generando extracto...</span>
                    </div>
                  ) : (
                    <div className="flex gap-4">
                      <button
                        onClick={() => setAudioModal(prev => ({ ...prev, open: false }))}
                        className="px-6 py-3.5 text-xs font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 rounded-2xl transition-all"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleGenerateFocusedExtract}
                        disabled={!audioModal.topic.trim()}
                        className="flex-1 px-8 py-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-indigo-500/30 hover:-translate-y-0.5 transition-all disabled:opacity-40 disabled:hover:translate-y-0 flex items-center justify-center gap-3"
                      >
                        <Sparkles size={16} />
                        Generar Extracto con IA
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* STEP: preview the focused extract */}
              {audioModal.step === 'preview' && (
                <>
                  <div>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-[10px] font-black text-indigo-500 bg-indigo-50 px-2.5 py-1 rounded-lg uppercase tracking-widest">
                        Extracto enfocado: {audioModal.topic}
                      </span>
                    </div>
                    <textarea
                      rows={10}
                      className="w-full bg-slate-50/50 border-2 border-transparent rounded-2xl px-6 py-5 text-sm font-medium text-slate-700 outline-none focus:bg-white focus:border-indigo-400 transition-all resize-none leading-relaxed"
                      value={audioModal.focusedExtract}
                      onChange={(e) => setAudioModal(prev => ({ ...prev, focusedExtract: e.target.value }))}
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-2 ml-2">
                      Puedes editar el texto antes de guardarlo.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setAudioModal(prev => ({ ...prev, step: 'topic' }))}
                      className="px-6 py-3.5 bg-slate-50 hover:bg-slate-100 text-slate-500 text-xs font-black uppercase tracking-widest rounded-2xl transition-all"
                    >
                      Cambiar tema
                    </button>
                    <button
                      onClick={handleSaveFocusedNote}
                      className="flex-1 px-8 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white text-xs font-black uppercase tracking-[0.15em] rounded-2xl shadow-xl shadow-emerald-500/30 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-3"
                    >
                      <CheckCircle2 size={16} />
                      Guardar en historial del cliente
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

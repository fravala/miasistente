"use client";

import { useState, useEffect } from "react";
import { 
  Save, 
  BrainCircuit, 
  Key, 
  Layout, 
  Sparkles, 
  ShieldCheck, 
  Cpu, 
  Globe, 
  Settings2,
  ChevronRight,
  CheckCircle2
} from "lucide-react";
import { useRouter } from "next/navigation";

const PROVIDERS = [
  { 
    id: 'openai', 
    name: 'OpenAI', 
    icon: <Sparkles className="text-[#74aa9c]" />, 
    description: 'Líder en razonamiento y capacidades generales.',
    models: [
      { id: 'gpt-4o', name: 'GPT-4o (Omni)', desc: 'Más inteligente y rápido' },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', desc: 'Eficiente y veloz' },
      { id: 'o1-preview', name: 'o1 Preview', desc: 'Razonamiento avanzado' },
      { id: 'o1-mini', name: 'o1 Mini', desc: 'Razonamiento para tareas específicas' },
    ]
  },
  { 
    id: 'anthropic', 
    name: 'Anthropic', 
    icon: <BrainCircuit className="text-[#d97757]" />, 
    description: 'Enfoque en seguridad y redacción natural.',
    models: [
      { id: 'anthropic/claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', desc: 'El más equilibrado y capaz' },
      { id: 'anthropic/claude-3-opus-20240229', name: 'Claude 3 Opus', desc: 'Potencia máxima (más lento)' },
      { id: 'anthropic/claude-3-haiku-20240307', name: 'Claude 3 Haiku', desc: 'Ultra-rápido para tareas simples' },
    ]
  },
  { 
    id: 'gemini', 
    name: 'Google Gemini', 
    icon: <Globe className="text-[#4285f4]" />, 
    description: 'Integración masiva y ventana de contexto gigante.',
    models: [
      { id: 'gemini/gemini-2.0-flash', name: 'Gemini 2.0 Flash', desc: 'Nueva generación, rapidez extrema' },
      { id: 'gemini/gemini-1.5-pro', name: 'Gemini 1.5 Pro', desc: 'Razonamiento complejo y contexto de 1M+' },
      { id: 'gemini/gemini-1.5-flash', name: 'Gemini 1.5 Flash', desc: 'Optimizado para velocidad y escala' },
    ]
  },
  { 
    id: 'grok', 
    name: 'xAI Grok', 
    icon: <Cpu className="text-black" />, 
    description: 'Acceso a tiempo real y estilo sin censura.',
    models: [
      { id: 'xai/grok-beta', name: 'Grok Beta', desc: 'Versión experimental de alto rendimiento' },
    ]
  },
  { 
    id: 'openrouter', 
    name: 'OpenRouter', 
    icon: <Settings2 className="text-[#6d28d9]" />, 
    description: 'Acceso a cientos de modelos open-source.',
    models: [
      { id: 'openrouter/google/gemini-2.0-flash-exp:free', name: 'Gemini 2.0 Flash (Free)', desc: 'Rápido y gratuito' },
      { id: 'openrouter/google/gemma-2-9b-it:free', name: 'Gemma 2 9B Free', desc: 'Potente y gratuito' },
      { id: 'openrouter/meta-llama/llama-3.1-8b-instruct:free', name: 'Llama 3.1 8B Free', desc: 'Versátil y gratuito' },
      { id: 'openrouter/meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B', desc: 'Estado del arte OS' },
      { id: 'openrouter/meta-llama/llama-3.1-405b-instruct', name: 'Llama 3.1 405B', desc: 'Potencia extrema (SOTA)' },
      { id: 'openrouter/mistralai/mistral-large-2407', name: 'Mistral Large 2', desc: 'Inteligencia europea de élite' },
      { id: 'openrouter/anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OR)', desc: 'Alternativa vía OpenRouter' },
      { id: 'custom', name: 'Otro Modelo...', desc: 'Ingresar ID manualmente' },
    ]
  },
];

export default function SettingsPage() {
  const [provider, setProvider] = useState("openai");
  const [model, setModel] = useState("");
  const [activeProvider, setActiveProvider] = useState("");
  const [activeModel, setActiveModel] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [customModel, setCustomModel] = useState("");
  const [openRouterModels, setOpenRouterModels] = useState<any[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [companyRules, setCompanyRules] = useState("");
  const [hasKeySaved, setHasKeySaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const router = useRouter();

  // Fetch OpenRouter models if selected
  useEffect(() => {
    if (provider === 'openrouter' && openRouterModels.length === 0) {
      const fetchORModels = async () => {
        setLoadingModels(true);
        try {
          const resp = await fetch("https://openrouter.ai/api/v1/models");
          if (resp.ok) {
            const data = await resp.json();
            setOpenRouterModels(data.data || []);
          }
        } catch (err) {
          console.error("Error fetching OpenRouter models", err);
        } finally {
          setLoadingModels(false);
        }
      };
      fetchORModels();
    }
  }, [provider]);

  useEffect(() => {
    const fetchSettings = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const resp = await fetch("http://localhost:8000/api/settings/ai", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (resp.ok) {
           const data = await resp.json();
           setProvider(data.ai_provider || "openai");
           
           const currentProviderData = PROVIDERS.find(p => p.id === (data.ai_provider || "openai"));
           const isModelInList = currentProviderData?.models.some(m => m.id === data.ai_model);
           
           if (isModelInList) {
             setModel(data.ai_model || "");
           } else if (data.ai_model) {
             setModel("custom");
             setCustomModel(data.ai_model);
           }
           
           setActiveProvider(data.ai_provider || "openai");
           setActiveModel(data.ai_model || "");
           setHasKeySaved(data.has_api_key);
           setCompanyRules(data.ai_company_rules || "");
        }
      } catch (err) {
         console.error("Error al cargar configuraciones", err);
      } finally {
         setLoading(false);
      }
    };

    fetchSettings();
  }, [router]);

  // Si cambia el proveedor y el modelo actual no pertenece a ese proveedor, seleccionar el primero disponible
  useEffect(() => {
    const currentProviderData = PROVIDERS.find(p => p.id === provider);
    if (currentProviderData) {
      const isModelInProvider = currentProviderData.models.some(m => m.id === model);
      if (!isModelInProvider && currentProviderData.models.length > 0) {
        setModel(currentProviderData.models[0].id);
      }
    }
  }, [provider]);

  const handleSave = async () => {
    const token = localStorage.getItem("token");
    setSaving(true);
    
    try {
      const resp = await fetch("http://localhost:8000/api/settings/ai", {
        method: "PUT",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          ai_provider: provider,
          ai_model: model === "custom" ? customModel : (model || null),
          ai_api_key: apiKey.trim() ? apiKey.trim() : null,
          ai_company_rules: companyRules
        })
      });

      if (resp.ok) {
        const data = await resp.json();
        setHasKeySaved(data.has_api_key);
        setApiKey("");
        setActiveProvider(provider);
        setActiveModel(model === "custom" ? customModel : model);
        alert("¡Configuración actualizada correctamente!");
      } else {
        const errorData = await resp.json().catch(() => ({ detail: "Error desconocido" }));
        alert(`Error al guardar: ${errorData.detail || resp.statusText}`);
      }
    } catch (err) {
      alert("Error de conexión");
    } finally {
      setSaving(false);
    }
  };

  const selectedProviderData = PROVIDERS.find(p => p.id === provider);

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] p-4 md:p-8 overflow-y-auto">
      
      <header className="mb-8 max-w-5xl mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
            <span className="bg-cyan-100 text-cyan-600 p-2 rounded-lg">
                <Settings2 size={20} />
            </span>
            <span className="text-gray-400 text-sm font-medium">Panel de Control</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight">
          Configuración Personalizada
        </h1>
        <p className="text-slate-500 text-lg mt-2 font-medium">
          Ajusta el núcleo cognitivo de tu asistente asistente inteligente.
        </p>
      </header>

      <div className="max-w-5xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Navigation Sidebar */}
        <div className="lg:col-span-3 space-y-2">
           <button className="flex items-center justify-between w-full px-5 py-4 bg-white border-2 border-cyan-500 text-cyan-700 rounded-2xl font-bold text-sm shadow-sm transition-all group">
              <div className="flex items-center gap-3">
                <BrainCircuit size={18} />
                Inteligencia Artificial
              </div>
              <ChevronRight size={16} className="opacity-50" />
           </button>
           <button className="flex items-center justify-between w-full px-5 py-4 bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 rounded-2xl font-bold text-sm transition-all group">
              <div className="flex items-center gap-3">
                <Layout size={18} />
                Apariencia de Marca
              </div>
              <ChevronRight size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" />
           </button>
           <button className="flex items-center justify-between w-full px-5 py-4 bg-white border border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50 rounded-2xl font-bold text-sm transition-all group">
              <div className="flex items-center gap-3">
                <ShieldCheck size={18} />
                Seguridad y API
              </div>
              <ChevronRight size={16} className="opacity-0 group-hover:opacity-50 transition-opacity" />
           </button>
        </div>

        {/* Form Content */}
        <div className="lg:col-span-9 space-y-6">
            
            <section className="bg-white rounded-[2rem] p-8 border border-slate-200 shadow-sm relative overflow-hidden">
                {/* Decorative background flare */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-50 rounded-full blur-3xl -mr-32 -mt-32 opacity-50 pointer-events-none"></div>
                
                <div className="relative">
                    <h2 className="text-2xl font-black text-slate-800 mb-2 flex items-center gap-3">
                        Proveedor del Cerebro Artificial
                    </h2>
                    <p className="text-slate-500 mb-4 font-medium">
                        Elige la infraestructura que procesará tus solicitudes y gestionará tu conocimiento.
                    </p>

                    {/* Current Configuration Summary */}
                     <div className="bg-white border-2 border-cyan-100/50 rounded-3xl p-6 mb-10 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm hover:shadow-md transition-all">
                        <div className="flex items-center gap-6">
                            <div className="relative">
                                <div className="w-16 h-16 bg-cyan-50 rounded-2xl flex items-center justify-center border border-cyan-100 text-cyan-600 shadow-inner">
                                    {PROVIDERS.find(p => p.id === activeProvider)?.icon || <BrainCircuit size={28} />}
                                </div>
                                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-cyan-600 uppercase tracking-[0.2em] mb-1">Cerebro de Producción Activo</p>
                                <div className="flex items-center gap-2">
                                    <h3 className="text-xl font-black text-slate-800">
                                        {PROVIDERS.find(p => p.id === activeProvider)?.name || "Sin configurar"}
                                    </h3>
                                    <span className="text-slate-300">/</span>
                                    <span className="text-slate-500 font-bold">{PROVIDERS.find(p => p.id === activeProvider)?.models.find(m => m.id === activeModel)?.name || "Modelo Estándar"}</span>
                                </div>
                            </div>
                        </div>
                        
                        {(provider !== activeProvider || model !== activeModel) && (
                            <div className="flex items-center gap-3 bg-amber-50 border border-amber-100 px-5 py-3 rounded-2xl animate-in fade-in zoom-in duration-300">
                                <Sparkles size={16} className="text-amber-500" />
                                <p className="text-xs font-black text-amber-700 uppercase tracking-tight">Cambios pendientes por guardar</p>
                            </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                            <span className="px-5 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black rounded-full uppercase tracking-widest border border-emerald-100">SISTEMA EN LÍNEA</span>
                        </div>
                     </div>

                    {loading ? (
                        <div className="space-y-4 py-8">
                            <div className="h-24 bg-slate-100 rounded-2xl animate-pulse"></div>
                            <div className="h-24 bg-slate-100 rounded-2xl animate-pulse w-3/4"></div>
                        </div>
                    ) : (
                        <div className="space-y-10">
                            
                            {/* Provider Selection Cards */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                {PROVIDERS.map((p) => (
                                    <button 
                                        key={p.id}
                                        onClick={() => setProvider(p.id)}
                                        className={`relative p-5 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-3 group ${
                                            provider === p.id 
                                            ? 'border-cyan-500 bg-white shadow-[0_20px_50px_-15px_rgba(6,182,212,0.15)] ring-4 ring-cyan-500/5 -translate-y-1' 
                                            : 'border-slate-100 bg-slate-50/50 hover:border-slate-300 hover:bg-white'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div className={`p-3 rounded-2xl transition-colors ${provider === p.id ? 'bg-cyan-600 text-white' : 'bg-white border border-slate-100 text-slate-400 shadow-sm'}`}>
                                                {p.icon}
                                            </div>
                                            {activeProvider === p.id && (
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-[8px] font-black uppercase tracking-tighter border border-emerald-200">
                                                        <CheckCircle2 size={10} /> CONECTADO
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className={`font-black text-base tracking-tight ${provider === p.id ? 'text-slate-900' : 'text-slate-600'}`}>{p.name}</h3>
                                            <p className="text-[11px] text-slate-400 font-medium leading-tight mt-1 line-clamp-2">
                                                {p.description}
                                            </p>
                                        </div>
                                        {provider === p.id && (
                                            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-cyan-500 rounded-full"></div>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Model Selection Grid */}
                            <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-500">
                                <label className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <Cpu size={18} className="text-cyan-500" />
                                    Selecciona el Modelo Específico
                                </label>
                                 {provider === "openrouter" ? (
                                    <div className="space-y-4">
                                        <div className="relative group">
                                            <input 
                                              type="text"
                                              placeholder="Buscar entre cientos de modelos de OpenRouter..."
                                              className="w-full bg-white border-2 border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-800 focus:outline-none focus:border-cyan-500 transition-all shadow-sm"
                                              value={modelSearch}
                                              onChange={(e) => setModelSearch(e.target.value)}
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-slate-100 rounded-xl text-slate-400 group-focus-within:text-cyan-500 group-focus-within:bg-cyan-50 transition-all">
                                                <Sparkles size={16} />
                                            </div>
                                        </div>

                                        <div className="max-h-64 overflow-y-auto pr-2 custom-scrollbar grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2 pt-1">
                                            {loadingModels && <div className="col-span-full py-8 text-center text-slate-400 font-bold animate-pulse">Cargando catálogo completo de OpenRouter...</div>}
                                            
                                            {/* Predefined / Suggested models first or filtered from OR */}
                                            {(modelSearch.trim() === "" ? selectedProviderData?.models : openRouterModels.filter(m => m.id.toLowerCase().includes(modelSearch.toLowerCase()) || m.name.toLowerCase().includes(modelSearch.toLowerCase())))
                                                ?.slice(0, modelSearch.trim() === "" ? 20 : 50)
                                                .map((m: any) => (
                                                    <button 
                                                        key={m.id}
                                                        onClick={() => {
                                                            if (m.id === "custom") {
                                                                setModel("custom");
                                                            } else {
                                                                setModel(m.id);
                                                                setCustomModel(m.id);
                                                            }
                                                            setModelSearch("");
                                                        }}
                                                        className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                                            (model === m.id || (model === "custom" && customModel === m.id))
                                                            ? 'border-slate-800 bg-slate-800 text-white shadow-lg' 
                                                            : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                        }`}
                                                    >
                                                        <div className={`w-2 h-2 rounded-full ${(model === m.id || (model === "custom" && customModel === m.id)) ? 'bg-cyan-400 animate-pulse' : 'bg-slate-300'}`}></div>
                                                        <div className="text-left overflow-hidden">
                                                            <div className="text-[11px] font-black truncate leading-tight">{m.name}</div>
                                                            <div className={`text-[9px] truncate mt-0.5 opacity-60`}>{m.id}</div>
                                                        </div>
                                                    </button>
                                                ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {selectedProviderData?.models.map((m) => (
                                            <button 
                                                key={m.id}
                                                onClick={() => setModel(m.id)}
                                                className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                                    model === m.id 
                                                    ? 'border-slate-800 bg-slate-800 text-white shadow-lg' 
                                                    : 'border-slate-100 bg-slate-50 text-slate-600 hover:border-slate-300'
                                                }`}
                                            >
                                                <div className={`w-2 h-2 rounded-full ${model === m.id ? 'bg-cyan-400 animate-pulse' : 'bg-slate-300'}`}></div>
                                                <div className="text-left overflow-hidden">
                                                    <div className="text-sm font-bold truncate">{m.name}</div>
                                                    <div className={`text-[10px] truncate ${model === m.id ? 'text-slate-300' : 'text-slate-400'}`}>{m.desc}</div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {model === "custom" && (
                                    <div className="mt-4 p-5 bg-slate-900 rounded-2xl border border-slate-700 animate-in fade-in zoom-in duration-300">
                                        <label className="text-xs font-black text-cyan-400 uppercase tracking-widest mb-3 block">Identificador del Modelo (Model ID)</label>
                                        <input 
                                          type="text"
                                          value={customModel}
                                          onChange={(e) => setCustomModel(e.target.value)}
                                          className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-cyan-500 transition-all"
                                          placeholder="ej: cognitivecomputations/dolphin-mixtral-8x7b"
                                        />
                                        <p className="text-[10px] text-slate-500 mt-2">
                                            Puedes encontrar los IDs en <a href="https://openrouter.ai/models" target="_blank" className="text-cyan-500 hover:underline">openrouter.ai/models</a>
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* API Key Input */}
                            <div className="space-y-4 pt-4">
                                <div className="flex items-center justify-between">
                                    <label className="text-base font-black text-slate-800 flex items-center gap-2">
                                        <Key size={18} className="text-emerald-500" />
                                        Credenciales de Acceso (API Key)
                                    </label>
                                    {hasKeySaved && (
                                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-tighter flex items-center gap-1">
                                            <ShieldCheck size={12} /> Protegido
                                        </span>
                                    )}
                                </div>
                                <div className="relative">
                                    <input 
                                        type="password"
                                        value={apiKey}
                                        onChange={(e) => setApiKey(e.target.value)}
                                        className="w-full pl-6 pr-6 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all shadow-inner placeholder:text-slate-300"
                                        placeholder={hasKeySaved ? "**** **** **** ****" : "Ingresa tu clave secreta de API..."}
                                    />
                                </div>
                            </div>

                            {/* System Message / Rules */}
                            <div className="space-y-4">
                                <label className="text-base font-black text-slate-800 flex items-center gap-2">
                                    <Layout size={18} className="text-orange-500" />
                                    Reglas de Negocio y Personalización de Voz
                                </label>
                                <textarea 
                                    value={companyRules}
                                    onChange={(e) => setCompanyRules(e.target.value)}
                                    rows={5}
                                    className="w-full px-6 py-5 bg-slate-50 border-2 border-transparent rounded-[1.5rem] text-sm font-medium text-slate-800 focus:outline-none focus:bg-white focus:border-cyan-500 transition-all shadow-inner placeholder:text-slate-400 resize-none"
                                    placeholder="Define cómo debe comportarse el asistente, qué datos priorizar, el tono de las respuestas, etc."
                                />
                            </div>

                            {/* Action Button */}
                            <div className="pt-6">
                                <button 
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="w-full md:w-auto min-w-[240px] bg-slate-900 hover:bg-slate-800 text-white font-black px-10 py-5 rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:translate-y-0"
                                >
                                    {saving ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    ) : (
                                        <Save size={20} className="text-cyan-400" />
                                    )}
                                    {saving ? "Procesando cambios..." : "Guardar Configuración"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Quick Tips Box */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden shadow-xl">
                <Sparkles className="absolute top-4 right-4 text-cyan-400/20" size={120} />
                <div className="relative">
                    <h4 className="text-xl font-black mb-4 flex items-center gap-2">
                        <Sparkles size={20} className="text-cyan-400" />
                        Consejo de Optimización
                    </h4>
                    <p className="text-slate-300 font-medium leading-relaxed max-w-2xl">
                        ¿Sabías que puedes cambiar el modelo dinámicamente según tus necesidades? 
                        Usa <span className="text-cyan-400 font-bold italic">GPT-4o Mini</span> para tareas rápidas y económicas, 
                        o cambia a <span className="text-cyan-400 font-bold italic">Claude 3.5 Sonnet</span> si necesitas una redacción excepcionalmente natural y creativa.
                    </p>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
}

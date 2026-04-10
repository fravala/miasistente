"use client";

import { useState } from "react";
import { Terminal, Lock, AtSign, Eye, EyeOff, ShieldCheck, Zap, HelpCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const resp = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!resp.ok) {
        const errorData = await resp.json();
        alert(errorData.detail || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      const data = await resp.json();
      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));
      
      router.push("/");
    } catch (err) {
      alert("No se pudo conectar al servidor.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-[#f0f9ff] overflow-hidden">
      
      {/* Background Decorators */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none"
           style={{ backgroundImage: "radial-gradient(#0ea5e9 1px, transparent 1px)", backgroundSize: "32px 32px" }}>
      </div>
      
      <div className="absolute top-0 left-0 w-[800px] h-[800px] bg-cyan-200/40 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 z-0"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-sky-200/30 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3 z-0"></div>

      {/* Main Content Wrapper */}
      <div className="z-10 w-full max-w-md flex flex-col items-center">
        
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-cyan-100/50 rounded-2xl flex items-center justify-center border border-cyan-200 mb-4 shadow-sm backdrop-blur-sm">
            <Terminal size={32} className="text-cyan-500" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">miasistente<span className="text-cyan-500">.</span></h1>
          <p className="text-xs font-semibold text-slate-400 tracking-[0.2em] mt-2 uppercase">Centro de Comando Empresarial</p>
        </div>

        {/* Login Card */}
        <div className="w-full bg-white/95 backdrop-blur-md rounded-3xl p-10 shadow-[0_20px_50px_-12px_rgba(0,194,255,0.15)] border border-white/50 relative">
          
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Autenticarse</h2>
            <p className="text-slate-500 text-sm mt-1 font-medium">La eficiencia comienza aquí.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            
            {/* Identity Field */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Identidad</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <AtSign size={18} className="text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                </div>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@organizacion.com" 
                  required
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm"
                />
              </div>
            </div>

            {/* Access Key Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-bold tracking-widest text-slate-400 uppercase">Clave de Acceso</label>
                <a href="#" className="text-[10px] font-bold tracking-widest text-cyan-400 hover:text-cyan-500 uppercase transition-colors">Recuperación</a>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock size={18} className="text-slate-400 group-focus-within:text-cyan-500 transition-colors" />
                </div>
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  required
                  className="w-full pl-11 pr-12 py-3.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all shadow-sm tracking-widest"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-cyan-400 hover:bg-cyan-500 text-white font-bold tracking-wider py-4 rounded-xl flex items-center justify-center gap-2 shadow-[0_8px_20px_-6px_rgba(0,194,255,0.4)] hover:shadow-[0_12px_24px_-8px_rgba(0,194,255,0.6)] transform active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100"
            >
              {loading ? "AUTENTICANDO..." : "INICIALIZAR SISTEMA"}
              {!loading && <span>&rarr;</span>}
            </button>
          </form>

          {/* Bottom Card Bar */}
          <div className="mt-8 flex items-center justify-between text-[10px] uppercase font-bold tracking-widest text-slate-400 pt-6 border-t border-slate-100">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></div>
                SISTEMA OPERATIVO
             </div>
             <div>V4.0.2-STABLE</div>
          </div>
        </div>

        {/* Footer philosophy */}
        <p className="mt-8 text-xs font-medium text-slate-400 italic">"Menos clics es mejor." — La Filosofía MIASISTENTE</p>

      </div>

      {/* Aesthetic Side Overlays */}
      <div className="absolute left-10 bottom-10 flex flex-col gap-6 opacity-60 text-[10px] tracking-widest font-bold text-slate-400 uppercase">
        <div className="flex items-center gap-3">
          <ShieldCheck size={16} className="text-cyan-500" /> Protocolo de Seguridad
        </div>
        <div className="flex items-center gap-3">
          <Zap size={16} className="text-cyan-500" /> Carga Turbo Activada
        </div>
        <div className="flex items-center gap-3">
          <HelpCircle size={16} className="text-cyan-500" /> Soporte Técnico
        </div>
      </div>

      <div className="absolute right-10 top-1/2 -translate-y-1/2 flex flex-col items-end gap-8 opacity-60 text-[10px] tracking-widest font-bold uppercase text-right">
        <div>
          <div className="text-cyan-400 mb-1">Flujos de Datos</div>
          <div className="w-32 h-1 bg-slate-200 rounded-full overflow-hidden">
            <div className="w-2/3 h-full bg-cyan-400"></div>
          </div>
        </div>
        <div>
           <div className="text-cyan-400 mb-1">Latencia</div>
           <div className="text-slate-400">12ms</div>
        </div>
        <div>
           <div className="text-cyan-400 mb-1">Ubicación del Nodo</div>
           <div className="text-slate-400">Malla Global</div>
        </div>
      </div>

    </div>
  );
}


import React, { useState, useEffect } from 'react';
import { 
  Terminal, Shield, Zap, Search, 
  Settings, Play, Package, Cpu,
  Globe, MessageSquare, Bot, 
  Layers, Sparkles, Activity,
  ChevronRight, Download, Check,
  AlertCircle, Info, BookOpen,
  GraduationCap, Brain, Lightbulb,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IntegrationSettings, Skill } from '../types';

interface OpenClawHubProps {
  integrationSettings: IntegrationSettings;
  setIntegrationSettings: React.Dispatch<React.SetStateAction<IntegrationSettings>>;
}

export const OpenClawHub: React.FC<OpenClawHubProps> = ({ integrationSettings, setIntegrationSettings }) => {
  const [activeTab, setActiveTab] = useState<'skills' | 'terminal' | 'estude'>('estude');
  const [searchQuery, setSearchQuery] = useState('');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    "🦞 OpenClaw Gateway v2026.3.2 initializing...",
    "System: Node.js v22.12.0 detected.",
    "Network: Gateway bound to loopback (127.0.0.1:18789)",
    "Auth: Secure pairing mode active.",
    "Ready for commands."
  ]);
  const [command, setCommand] = useState('');

  const skillIcons: Record<string, React.ReactNode> = {
    summarize: <BookOpen className="text-emerald-400" />,
    'coding-agent': <Cpu className="text-blue-400" />,
    weather: <Globe className="text-cyan-400" />,
    'estude-flashcards': <GraduationCap className="text-amber-400" />,
    'neural-search': <Brain className="text-purple-400" />,
    'automation-cron': <Zap className="text-yellow-400" />,
  };

  const handleToggleSkill = (skillId: string) => {
    const updatedSkills = (integrationSettings.skills || []).map(s => {
      if (s.id === skillId) {
        const newStatus = s.status === 'installed' ? 'available' : 'installed';
        return { ...s, status: newStatus as any };
      }
      return s;
    });
    setIntegrationSettings({ ...integrationSettings, skills: updatedSkills });
  };

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    
    const newOutput = [...terminalOutput, `> ${command}`];
    
    if (command.toLowerCase() === 'openclaw onboard') {
      newOutput.push("Iniciando assistente de configuração...");
      newOutput.push("🦞 OpenClaw: Bem-vindo ao Sistema Estude Alpha.");
    } else if (command.toLowerCase() === 'openclaw status') {
      newOutput.push("Status: ONLINE");
      newOutput.push("Gateway: 127.0.0.1:18789");
      newOutput.push("Active Sessions: 1 (Main)");
    } else if (command.toLowerCase() === 'clear') {
      setTerminalOutput([]);
      setCommand('');
      return;
    } else {
      newOutput.push(`Command not found: ${command}`);
    }
    
    setTerminalOutput(newOutput);
    setCommand('');
  };

  const currentSkills = integrationSettings.skills || [];

  const filteredSkills = currentSkills.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-[#010413] text-slate-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#00a884]/20 rounded-lg border border-[#00a884]/30">
            <Package size={20} className="text-[#00a884]" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight">SISTEMA ESTUDE</h2>
            <p className="text-[10px] text-[#00a884] font-black uppercase tracking-widest">Powered by OpenClaw 🦞</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-xl border border-white/5">
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">Freedom Mode</span>
            <button 
              onClick={() => setIntegrationSettings({ ...integrationSettings, isFreedomModeActive: !integrationSettings.isFreedomModeActive })}
              className={`w-10 h-5 rounded-full p-1 transition-all duration-300 ${integrationSettings.isFreedomModeActive ? 'bg-amber-500' : 'bg-slate-700'}`}
            >
              <div className={`w-3 h-3 bg-white rounded-full transition-transform duration-300 ${integrationSettings.isFreedomModeActive ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>
          
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5">
          <button 
            onClick={() => setActiveTab('estude')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'estude' ? 'bg-[#00a884] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Estude
          </button>
          <button 
            onClick={() => setActiveTab('skills')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'skills' ? 'bg-[#00a884] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Skills
          </button>
          <button 
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'terminal' ? 'bg-[#00a884] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Terminal
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'settings' ? 'bg-[#00a884] text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
          >
            Settings
          </button>
        </div>
      </div>
    </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'estude' && (
            <motion.div 
              key="estude"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {integrationSettings.isFreedomModeActive && (
                  <div className="col-span-full bg-amber-500/10 border border-amber-500/30 rounded-3xl p-4 flex items-center gap-4 animate-pulse">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <Zap size={20} className="text-amber-500" />
                    </div>
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-amber-500">Modo Liberdade Ativo</h4>
                      <p className="text-[10px] text-amber-500/70">O Maestro Daniel está operando com autonomia total via OpenClaw.</p>
                    </div>
                  </div>
                )}
                {/* Study Stats */}
                <div className="bg-[#1c272f]/40 border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-amber-500/20 rounded-xl">
                      <Activity size={20} className="text-amber-500" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Foco Alpha</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter">84%</h3>
                    <p className="text-xs text-slate-400">Eficiência de Estudo Semanal</p>
                  </div>
                  <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-amber-500 h-full w-[84%] rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                  </div>
                </div>

                <div className="bg-[#1c272f]/40 border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-purple-500/20 rounded-xl">
                      <Brain size={20} className="text-purple-500" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-500 uppercase tracking-widest">Retenção</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter">128</h3>
                    <p className="text-xs text-slate-400">Conceitos Mapeados</p>
                  </div>
                  <div className="flex gap-1">
                    {[1,2,3,4,5,6,7,8].map(i => (
                      <div key={i} className={`h-1 flex-1 rounded-full ${i < 6 ? 'bg-purple-500' : 'bg-white/5'}`} />
                    ))}
                  </div>
                </div>

                <div className="bg-[#1c272f]/40 border border-white/5 rounded-3xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-2 bg-emerald-500/20 rounded-xl">
                      <Zap size={20} className="text-emerald-500" />
                    </div>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Sessões</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-black tracking-tighter">12h 45m</h3>
                    <p className="text-xs text-slate-400">Tempo Total de Foco</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md">+12% vs ontem</div>
                  </div>
                </div>
              </div>

              {/* Active Learning Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Fluxo de Aprendizado Ativo</h3>
                  <button className="text-[10px] font-bold text-[#00a884] hover:underline">VER TODOS</button>
                </div>
                
                <div className="space-y-3">
                  {[
                    { title: "Arquitetura de Microserviços", time: "Há 2 horas", icon: <Layers size={16} />, color: "text-blue-400" },
                    { title: "Lógica de Programação Avançada", time: "Há 5 horas", icon: <Cpu size={16} />, color: "text-emerald-400" },
                    { title: "Marketing Digital & Telemetria", time: "Ontem", icon: <Globe size={16} />, color: "text-amber-400" }
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white/[0.03] border border-white/5 rounded-2xl hover:bg-white/[0.05] transition-all cursor-pointer group">
                      <div className="flex items-center gap-4">
                        <div className={`p-2.5 bg-white/5 rounded-xl ${item.color} group-hover:scale-110 transition-transform`}>
                          {item.icon}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold">{item.title}</h4>
                          <p className="text-[10px] text-slate-500">{item.time}</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'skills' && (
            <motion.div 
              key="skills"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar ferramentas e skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm focus:outline-none focus:border-[#00a884]/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredSkills.map((skill) => (
                  <div key={skill.id} className="p-5 bg-white/[0.03] border border-white/5 rounded-3xl hover:border-[#00a884]/30 transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="p-3 bg-white/5 rounded-2xl group-hover:scale-110 transition-transform">
                        {skillIcons[skill.id] || <Bot className="text-slate-400" />}
                      </div>
                      <div className={`px-2 py-1 rounded-md text-[8px] font-black uppercase tracking-widest ${
                        skill.status === 'installed' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        {skill.status}
                      </div>
                    </div>
                    <h4 className="text-base font-bold mb-1">{skill.name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{skill.description}</p>
                    <button 
                      onClick={() => handleToggleSkill(skill.id)}
                      className={`w-full py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                        skill.status === 'installed' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-[#00a884] text-white hover:bg-[#00a884]/80'
                      }`}
                    >
                      {skill.status === 'installed' ? 'Desinstalar' : 'Instalar'}
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'terminal' && (
            <motion.div 
              key="terminal"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="h-full flex flex-col"
            >
              <div className="flex-1 bg-black/60 rounded-3xl border border-white/10 p-6 font-mono text-xs md:text-sm overflow-y-auto custom-scrollbar space-y-2">
                {terminalOutput.map((line, i) => (
                  <div key={i} className={line.startsWith('>') ? 'text-emerald-400' : 'text-slate-300'}>
                    {line}
                  </div>
                ))}
                <div className="flex items-center gap-2 text-emerald-400">
                  <span>$</span>
                  <form onSubmit={handleCommand} className="flex-1">
                    <input 
                      type="text" 
                      value={command}
                      onChange={(e) => setCommand(e.target.value)}
                      autoFocus
                      className="w-full bg-transparent border-none outline-none text-emerald-400"
                    />
                  </form>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button 
                  onClick={() => { setCommand('openclaw status'); }}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all"
                >
                  Status
                </button>
                <button 
                  onClick={() => { setCommand('openclaw onboard'); }}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all"
                >
                  Onboard
                </button>
                <button 
                  onClick={() => { setTerminalOutput([]); }}
                  className="px-3 py-1.5 bg-white/5 rounded-lg text-[10px] font-bold text-slate-400 hover:text-white transition-all"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      
      {/* Footer Info */}
      <div className="px-6 py-3 border-t border-white/5 bg-black/20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Gateway Active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={10} className="text-slate-500" />
            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">Node 22.12.0</span>
          </div>
        </div>
        <div className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
          Alpha Elite v9.0.0
        </div>
      </div>
    </div>
  );
};

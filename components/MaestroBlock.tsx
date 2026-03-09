
import React, { useState } from 'react';
import { MaestroResponse, IntegrationSettings } from '../types';
import { synthesizeSpeech } from '../services/geminiService';
import { 
  Brain, Volume2, Activity, Zap, 
  Loader2, Copy, Check, Terminal,
  Bot, Code2, Layers, Eye, Sparkles,
  MessageCircle
} from 'lucide-react';

interface MaestroBlockProps {
  data: MaestroResponse;
  voiceSettings?: any;
  integrationSettings?: IntegrationSettings;
}

export const MaestroBlock: React.FC<MaestroBlockProps> = ({ data, voiceSettings, integrationSettings }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const json = data?.jsonEstruturado || { active_node: 'intelligence', priority: 'medium', memoria: [] };
  const { active_node, memoria } = json;

  const handleSpeak = async () => {
    if (!data.resultado) return;
    setIsPlaying(true);
    await synthesizeSpeech(data.resultado, voiceSettings);
    setIsPlaying(false);
  };

  const handleCopy = () => {
    if (!data.resultado) return;
    navigator.clipboard.writeText(data.resultado);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    if (!data.resultado || !integrationSettings?.isWhatsappActive) return;
    const text = encodeURIComponent(`🤖 *Maestro Master Daniel*\n\n${data.resultado}`);
    const number = integrationSettings?.whatsappNumber?.replace(/\D/g, '') || '';
    const url = number ? `https://wa.me/${number}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const nodeIcons: Record<string, React.ReactNode> = {
    intelligence: <Brain size={20} className="md:w-6 md:h-6" />, 
    engineering: <Code2 size={20} className="md:w-6 md:h-6" />,
    replit: <Layers size={20} className="md:w-6 md:h-6" />, 
    vision: <Eye size={20} className="md:w-6 md:h-6" />,
    telegram: <Bot size={20} className="md:w-6 md:h-6" />, 
    whatsapp: <MessageCircle size={20} className="md:w-6 md:h-6" />,
    orchestra: <Zap size={20} className="md:w-6 md:h-6" />
  };

  const renderContent = (text: string) => {
    if (!text) return null;
    
    const parts = text.split(/(```[\s\S]*?```)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```[a-z]*\n?|```/g, '').trim();
        return (
          <div key={index} className="my-6 md:my-8 relative group">
            <div className="absolute -top-3 left-4 md:left-6 px-3 py-1 bg-[#00a884] text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-md z-10 shadow-lg">
              Source Stream
            </div>
            <pre className="bg-black/80 border border-white/10 p-5 md:p-8 rounded-[1.2rem] md:rounded-[1.8rem] overflow-x-auto font-mono text-xs md:text-base text-cyan-400 custom-scrollbar shadow-inner">
              <code style={{ fontFamily: '"JetBrains Mono", monospace' }}>{code}</code>
            </pre>
          </div>
        );
      }
      return (
        <p key={index} className="mb-4 last:mb-0 leading-relaxed text-slate-100 text-sm md:text-base">
          {part}
        </p>
      );
    });
  };

  return (
    <div className="w-full max-w-6xl space-y-4 md:space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
      {/* Node Info Card - Responsive */}
      <div className="bg-[#1c272f]/80 backdrop-blur-2xl rounded-[1.5rem] md:rounded-[3rem] p-5 md:p-10 border border-white/5 shadow-2xl flex flex-row items-center gap-4 md:gap-8 group">
         <div className="w-12 h-12 md:w-20 md:h-20 shrink-0 rounded-[1.2rem] md:rounded-[1.8rem] bg-[#00a884]/15 flex items-center justify-center text-[#00a884] border border-[#00a884]/30 group-hover:scale-105 transition-all duration-500">
            {nodeIcons[active_node] || <Activity size={24} className="md:w-10 md:h-10" />}
         </div>
         <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 md:mb-3">
              <h4 className="text-[8px] md:text-[11px] font-black uppercase tracking-[0.2em] md:tracking-[0.4em] text-[#00a884] truncate">NODE: {active_node.toUpperCase()}</h4>
              {integrationSettings?.isFreedomModeActive && (
                <span className="px-2 py-0.5 bg-amber-500/10 text-amber-500 text-[6px] md:text-[8px] font-black uppercase tracking-widest rounded border border-amber-500/20 animate-pulse">Freedom Mode</span>
              )}
            </div>
            <p className="text-white text-base md:text-3xl lg:text-4xl font-black tracking-tighter italic leading-tight truncate">
               {data.decisao}
            </p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
        <div className="lg:col-span-2 bg-[#1c272f]/40 backdrop-blur-xl rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 border border-white/5 space-y-3 shadow-xl">
           <div className="flex items-center gap-3 text-[#00a884]/70">
              <Terminal size={16} strokeWidth={3} />
              <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em]">Alpha Logic</span>
           </div>
           <p className="text-slate-300 text-sm md:text-lg font-medium leading-relaxed italic opacity-85">
              {data.plano || "Sincronizando fluxo neural..."}
           </p>
        </div>

        {memoria && memoria.length > 0 && (
          <div className="bg-[#1c272f]/30 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-8 border border-white/5 space-y-4">
            <div className="flex items-center gap-2 text-purple-400">
              <Sparkles size={16} />
              <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Memória Neural</span>
            </div>
            <div className="space-y-2 max-h-32 md:max-h-48 overflow-y-auto custom-scrollbar">
              {memoria.map((item, i) => (
                <div key={i} className="text-[10px] md:text-[11px] font-bold text-slate-500 uppercase border-l-2 border-purple-500/30 pl-3 py-1">
                  {item.conteudo}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="bg-[#0b141a]/98 backdrop-blur-3xl border border-white/5 rounded-[1.8rem] md:rounded-[3.5rem] overflow-hidden shadow-2xl flex flex-col transition-all">
         <div className="flex items-center justify-between px-6 md:px-10 py-5 md:py-8 bg-white/[0.01] border-b border-white/5">
            <div className="flex items-center gap-2 md:gap-3 px-3 md:px-6 py-2 md:py-3 bg-[#00a884]/15 border border-[#00a884]/25 rounded-[1rem] md:rounded-[1.5rem]">
               <Activity size={12} className="text-[#00a884] md:w-5 md:h-5" strokeWidth={3} />
               <span className="text-[8px] md:text-[10px] font-black text-[#00a884] uppercase tracking-[0.1em]">VERIFIED NODE</span>
            </div>
            <div className="flex items-center gap-3 md:gap-4">
               {integrationSettings?.isWhatsappActive && (
                 <button onClick={handleWhatsApp} className="p-2.5 md:p-4 bg-white/5 rounded-xl md:rounded-[1.5rem] text-emerald-500 hover:text-emerald-400 transition-all active:scale-90" title="WhatsApp">
                    <MessageCircle size={18} className="md:w-6 md:h-6" />
                 </button>
               )}
               <button onClick={handleCopy} className="p-2.5 md:p-4 bg-white/5 rounded-xl md:rounded-[1.5rem] text-slate-400 hover:text-white transition-all active:scale-90">
                  {copied ? <Check size={18} className="text-emerald-400 md:w-6 md:h-6" /> : <Copy size={18} className="md:w-6 md:h-6" />}
               </button>
               <button onClick={handleSpeak} disabled={isPlaying} className="p-2.5 md:p-4 bg-white/5 rounded-xl md:rounded-[1.5rem] text-slate-400 hover:text-white transition-all active:scale-90">
                  {isPlaying ? <Loader2 size={18} className="animate-spin text-cyan-400 md:w-6 md:h-6" /> : <Volume2 size={18} className="md:w-6 md:h-6" />}
               </button>
            </div>
         </div>
         
         <div className="p-6 md:p-12 lg:p-16 min-h-[100px]">
            <div className="text-slate-100 text-sm md:text-xl lg:text-2xl leading-relaxed font-medium tracking-tight whitespace-pre-wrap selection:bg-[#00a884]/30">
               {renderContent(data.resultado)}
            </div>
         </div>
      </div>
    </div>
  );
};


import React from 'react';
import { 
  Lightbulb, Settings, Lock, 
  Cloud, ShoppingCart, SendHorizontal, Smartphone, Bot, Zap,
  Building2
} from 'lucide-react';

interface CoreBackgroundProps {
  isVisible: boolean;
  isThinking: boolean;
  isSystemActive?: boolean;
}

export const CoreBackground: React.FC<CoreBackgroundProps> = ({ isVisible, isThinking, isSystemActive = false }) => {
  const nodes = [
    { icon: <Smartphone size={24} />, angle: -90 },
    { icon: <Settings size={24} />, angle: -45 },
    { icon: <Lock size={24} />, angle: 0 },
    { icon: <Cloud size={24} />, angle: 45 },
    { icon: <ShoppingCart size={24} />, angle: 90 },
    { icon: <SendHorizontal size={24} />, angle: 135 },
    { icon: <Building2 size={24} />, angle: 180 },
    { icon: <Lightbulb size={24} />, angle: 225 }
  ];

  const radius = window.innerWidth < 768 ? 160 : 280; 

  return (
    <div 
      className={`fixed inset-0 overflow-hidden pointer-events-none z-0 transition-all duration-[1000ms] ease-in-out ${
        isVisible ? 'opacity-100' : 'opacity-0'
      } ${isSystemActive ? 'scale-90 opacity-10 translate-y-[-50px]' : 'scale-100 opacity-100'}`}
    >
      <style>{`
        @keyframes orbit-master {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes counter-orbit {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(-360deg); }
        }
        .animate-orbit {
          animation: orbit-master 120s linear infinite;
        }
        .animate-counter-orbit {
          animation: counter-orbit 120s linear infinite;
        }
        .animate-orbit-fast {
          animation: orbit-master 40s linear infinite;
        }
        .animate-orbit-slow {
          animation: orbit-master 180s linear infinite;
        }
      `}</style>

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,168,132,0.15)_0%,rgba(0,0,0,0)_75%)]" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] flex items-center justify-center">
        
        {/* Orbital Track Rings - Visual context for the "Orbit" */}
        <div className="absolute inset-0 flex items-center justify-center opacity-10">
           <div className="absolute w-[320px] h-[320px] md:w-[560px] md:h-[560px] border border-[#00a884] rounded-full" />
           <div className="absolute w-[380px] h-[380px] md:w-[650px] md:h-[650px] border border-[#00a884] rounded-full border-dashed animate-orbit-slow" />
           <div className="absolute w-[280px] h-[280px] md:w-[480px] md:h-[480px] border border-[#00a884]/30 rounded-full" />
        </div>

        {/* IA Logo central - Static base with pulsing glow */}
        <div className={`relative w-64 h-64 md:w-80 md:h-80 bg-[#1c272f]/70 backdrop-blur-3xl border-2 rounded-[4rem] md:rounded-[5rem] flex flex-col items-center justify-center transition-all duration-700 z-10 ${
          isThinking 
            ? 'border-cyan-400 shadow-[0_0_120px_rgba(34,211,238,0.4)] scale-105' 
            : 'border-[#00a884]/60 shadow-[0_0_90px_rgba(0,168,132,0.3)]'
        }`}>
          <div className="relative flex flex-col items-center justify-center">
             <Zap size={48} className="text-[#00a884] absolute -top-14 fill-[#00a884] drop-shadow-[0_0_15px_#00a884]" />
             <span className="text-9xl md:text-[11.5rem] font-black text-white tracking-tighter leading-none select-none drop-shadow-[0_0_20px_rgba(255,255,255,0.1)]">IA</span>
          </div>
          
          <div className="absolute bottom-10 flex flex-col items-center gap-2">
             <div className="flex items-center gap-2 px-4 py-1.5 bg-[#00a884]/15 rounded-full border border-[#00a884]/20">
                <div className={`w-2 h-2 rounded-full bg-[#00a884] ${isThinking ? 'animate-ping' : 'animate-pulse'}`} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#00a884]">System Alpha</span>
             </div>
             <div className="opacity-30 text-[9px] font-bold tracking-[0.5em] text-white">READY</div>
          </div>
        </div>

        {/* Orbitals - Animated Container with counter-rotating icons */}
        <div className={`absolute w-full h-full animate-orbit transition-opacity duration-1000 ${isSystemActive ? 'opacity-20' : 'opacity-100'}`}>
          {nodes.map((node, i) => {
            const rad = (node.angle * Math.PI) / 180;
            const x = 400 + radius * Math.cos(rad);
            const y = 400 + radius * Math.sin(rad);
            return (
              <div 
                key={i} 
                className="absolute w-16 h-16 md:w-24 md:h-24 bg-[#1c272f]/60 backdrop-blur-3xl border border-white/5 rounded-[1.8rem] md:rounded-[2.2rem] flex items-center justify-center text-[#00a884]/40 shadow-2xl transition-all hover:scale-110 hover:text-[#00a884] hover:border-[#00a884]/40 animate-counter-orbit"
                style={{ 
                  left: `${x}px`, 
                  top: `${y}px`,
                }}
              >
                {node.icon}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

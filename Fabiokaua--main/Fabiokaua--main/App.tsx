
import React, { useState, useRef, useEffect } from 'react';
import { 
  Mic, Send, X, Menu, Settings, Plus,
  Camera, Zap, Loader2, Volume2,
  Layers, Bot, Brain, Sparkles,
  Terminal, Cpu, Check, ChevronRight,
  Activity, Smartphone, Video,
  User, Share2, Headphones,
  Globe, Shield, Globe2,
  Key, Network, MessageCircle, Download,
  CircuitBoard, AlertCircle, Sliders,
  GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { generateMaestroResponse, synthesizeSpeech, initAudio } from './services/geminiService';
import { saveEvolutionLog, fetchLogs, syncSettings, fetchSettings, syncMessages, fetchMessages, checkSupabaseConnection } from './services/supabaseService';
import { ChatMessage, AppStatus, VoiceSettings, IntegrationSettings } from './types';
import { MaestroBlock } from './components/MaestroBlock';
import { CoreBackground } from './components/CoreBackground';
import { NeuralBackground } from './components/NeuralBackground';
import { OpenClawHub } from './components/OpenClawHub';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
  var aistudio: AIStudio;
}

const VERSION = "V9.0.0-ALPHA-ELITE-VOICE";

const App: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showProtocolHub, setShowProtocolHub] = useState(false);
  const [activeTab, setActiveTab] = useState<'vocal' | 'malha' | 'evolucao' | 'video' | 'estude'>('vocal');
  const [evolutionLog, setEvolutionLog] = useState<any[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [notification, setNotification] = useState<{message: string, type: 'info' | 'success' | 'error'} | null>(null);
  
  const [activeModel, setActiveModel] = useState('gemini-3-pro-preview');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [videoPrompt, setVideoPrompt] = useState('');
  const [videoResolution, setVideoResolution] = useState<'720p' | '1080p'>('720p');
  const [videoAspectRatio, setVideoAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [isVideoGenerating, setIsVideoGenerating] = useState(false);

  const [syncId] = useState(() => {
    const savedId = localStorage.getItem('maestro_sync_id');
    if (savedId) return savedId;
    const newId = 'UID-2911811583'; 
    localStorage.setItem('maestro_sync_id', newId);
    return newId;
  });

  const [integrationSettings, setIntegrationSettings] = useState<IntegrationSettings>({
    telegramToken: '',
    telegramChatId: '',
    whatsappNumber: '',
    activeModel: 'gemini-3-pro-preview',
    replitStatus: 'READY',
    syncId: syncId,
    openRouterKey: '',
    isTelegramActive: false,
    isWhatsappActive: false,
    isFreedomModeActive: true,
    skills: [
      { id: 'summarize', name: 'Resumo Alpha', description: 'Condensa textos longos e PDFs em pontos-chave essenciais.', category: 'study', status: 'installed' },
      { id: 'coding-agent', name: 'Agente de Código', description: 'Auxilia na escrita e depuração de scripts complexos.', category: 'intelligence', status: 'installed' },
      { id: 'weather', name: 'Clima Global', description: 'Previsões meteorológicas em tempo real via API.', category: 'tools', status: 'available' },
      { id: 'estude-flashcards', name: 'Flashcards Estude', description: 'Geração automática de cartões de estudo baseados em conversas.', category: 'study', status: 'installed' },
      { id: 'neural-search', name: 'Busca Neural', description: 'Pesquisa profunda em bases de conhecimento locais e web.', category: 'intelligence', status: 'installed' },
      { id: 'automation-cron', name: 'Cron Maestro', description: 'Agendamento de tarefas e lembretes de estudo.', category: 'automation', status: 'available' }
    ],
    supabaseConfig: {
      url: '',
      key: ''
    }
  });

  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    gender: 'male', 
    humor: 'PROFISSIONAL', 
    version: VERSION,
    autoPlayVoice: true,
    isIntegrated: true,
    provider: 'elevenlabs',
    elevenLabsVoiceId: 'pNInz6obpgnuM07kg7nI', // Daniel Master High Quality
    elevenLabsKey: 'sk_40eaaf10e4266386d1f65bab6e3e99596b2dfb0837a9d036',
    elevenLabsSettings: {
      stability: 0.55,
      similarity_boost: 0.80,
      style: 0.5,
      use_speaker_boost: true
    }
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initMaestro = async () => {
      try {
        const [cloudSettings, cloudHistory, logs] = await Promise.all([
          fetchSettings(syncId),
          fetchMessages(syncId),
          fetchLogs()
        ]);
        if (cloudSettings) {
          if (cloudSettings.integration) {
            setIntegrationSettings(prev => ({
              ...prev,
              ...cloudSettings.integration,
              skills: cloudSettings.integration.skills || prev.skills
            }));
          }
          if (cloudSettings.voice) {
            setVoiceSettings(prev => ({
              ...prev,
              ...cloudSettings.voice
            }));
          }
          if (cloudSettings.activeModel) setActiveModel(cloudSettings.activeModel);
        }
        if (cloudHistory && Array.isArray(cloudHistory)) {
          setMessages(cloudHistory.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })));
        }
        setEvolutionLog(logs);
      } catch (e) {
        console.error("Erro Alpha Sync:", e);
      } finally {
        setIsInitialLoading(false);
      }
    };
    initMaestro();
  }, [syncId]);

  useEffect(() => {
    if (isInitialLoading) return;
    syncSettings(syncId, {
      integration: integrationSettings,
      voice: voiceSettings,
      activeModel: activeModel
    });
  }, [integrationSettings, voiceSettings, activeModel, syncId, isInitialLoading]);

  useEffect(() => {
    if (isInitialLoading) return;
    syncMessages(syncId, messages);
  }, [messages, syncId, isInitialLoading]);

  const showEvolutionBanner = (message: string, type: 'info' | 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef('');
  const retryCount = useRef(0);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false; // Reverted
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'pt-BR';

      recognitionRef.current.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          transcript += event.results[i][0].transcript;
        }
        transcriptRef.current = transcript;
        setInputValue(transcript);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
        // Do not automatically send here, let stopRecording handle it
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        
        if (event.error === 'no-speech' && retryCount.current < 2) {
          retryCount.current++;
          setTimeout(() => recognitionRef.current?.start(), 500);
        } else {
          retryCount.current = 0;
          if (event.error === 'not-allowed') {
            showEvolutionBanner("Permissão de microfone negada.", "error");
          } else {
            showEvolutionBanner(`Erro no microfone: ${event.error}`, "error");
          }
        }
      };
    }
  }, []);

  const startRecording = () => {
    initAudio();
    if (!recognitionRef.current) {
      showEvolutionBanner("Reconhecimento de voz não suportado neste navegador.", "error");
      return;
    }
    try {
      transcriptRef.current = '';
      setInputValue('');
      recognitionRef.current.start();
      setIsListening(true);
    } catch (e) {
      console.error("Failed to start recognition", e);
      setIsListening(false);
      if ((e as any).name === 'NotAllowedError') {
        showEvolutionBanner("Permissão de microfone negada.", "error");
      } else {
        showEvolutionBanner("Erro ao iniciar microfone.", "error");
      }
    }
  };

  const stopRecording = () => {
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
        if (transcriptRef.current.trim()) {
           handleSend(transcriptRef.current, 'voice');
           transcriptRef.current = '';
        }
        setIsListening(false);
      } catch (e) {
        console.error("Error stopping recognition", e);
      }
    }
  };

  const handleSend = async (text: string = inputValue, mode: 'text' | 'voice' | 'image' = 'text') => {
    await initAudio();
    if (!text.trim() && !selectedImage) return;
    const userMessage: ChatMessage = {
      id: Date.now().toString(), 
      role: 'user', 
      content: text,
      image: selectedImage || undefined,
      inputMode: selectedImage ? 'image' : mode, 
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setSelectedImage(null);
    setIsProcessing(true);
    setStatus(AppStatus.THINKING);

    try {
      const maestroData = await generateMaestroResponse(
        text, 
        selectedImage || undefined, 
        messages, 
        activeModel, 
        voiceSettings.humor,
        integrationSettings.openRouterKey,
        integrationSettings.isFreedomModeActive
      );
      
      const maestroMessage: ChatMessage = {
        id: (Date.now() + 1).toString(), 
        role: 'maestro', 
        content: maestroData.resultado,
        maestroData, 
        inputMode: 'text', 
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, maestroMessage]);
      setStatus(AppStatus.IDLE);
      
      showEvolutionBanner(`EVOLUÇÃO ALPHA: Modelo ${activeModel.split('/').pop()} em harmonia.`);
      
      await saveEvolutionLog(maestroData.decisao, maestroData.jsonEstruturado.active_node, VERSION);
      if (voiceSettings.autoPlayVoice) synthesizeSpeech(maestroData.resultado, voiceSettings);
    } catch (error) {
      console.error("Erro Maestro:", error);
      setStatus(AppStatus.ERROR);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleGenerateVideo = async () => {
    if (!videoPrompt.trim()) return;

    try {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        showEvolutionBanner("VEO: Chave paga necessária. Selecione seu projeto com faturamento ativo.", "info");
        await window.aistudio.openSelectKey();
      }

      setIsVideoGenerating(true);
      setShowProtocolHub(false);
      showEvolutionBanner("RENDERIZAÇÃO WAN: Iniciando projeção cinematográfica Alpha...");

      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: videoPrompt,
        config: { 
          numberOfVideos: 1, 
          resolution: videoResolution, 
          aspectRatio: videoAspectRatio 
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (downloadLink) {
        const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
        const videoBlob = await videoResponse.blob();
        const videoUrl = URL.createObjectURL(videoBlob);
        const maestroMessage: ChatMessage = {
          id: Date.now().toString(),
          role: 'maestro',
          content: `VEO ENGINE: Renderização concluída com sucesso.\nPrompt: "${videoPrompt}"`,
          timestamp: new Date(),
          inputMode: 'text'
        };
        (maestroMessage as any).videoUrl = videoUrl;
        setMessages(prev => [...prev, maestroMessage]);
        showEvolutionBanner("VEO: Vídeo renderizado e integrado à conversa.", "success");
      }
    } catch (error: any) {
      console.error("Video Error:", error);
      if (error.message?.includes("403") || error.message?.includes("permission") || error.message?.includes("not found")) {
        showEvolutionBanner("PERMISSÃO NEGADA: Certifique-se de selecionar uma chave de projeto Google Cloud com faturamento (billing) ativo.", "error");
        await window.aistudio.openSelectKey();
      } else {
        showEvolutionBanner(`ERRO WAN: ${error.message || "Falha na comunicação"}`, "error");
      }
    } finally {
      setIsVideoGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-[#010413] text-slate-100 overflow-hidden relative">
      <NeuralBackground isVisible={true} status={status} isSystemActive={messages.length > 0} />
      <CoreBackground isVisible={true} isThinking={status === AppStatus.THINKING} isSystemActive={messages.length > 0} />

      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 80, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="fixed top-0 left-1/2 -translate-x-1/2 z-[60] w-[95%] md:w-auto"
          >
            <div className={`px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-white/20 backdrop-blur-xl ${
              notification.type === 'error' ? 'bg-red-500/90' : (notification.type === 'info' ? 'bg-blue-500/90' : 'bg-[#00a884]/90')
            }`}>
              {notification.type === 'error' ? <AlertCircle size={22} className="text-white" /> : <Sparkles size={22} className="text-white animate-pulse" />}
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/70 italic">Protocolo Maestro</span>
                <span className="text-xs md:text-sm font-black uppercase tracking-widest text-white italic">{notification.message}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="h-20 flex items-center justify-between px-4 md:px-6 bg-black/40 backdrop-blur-2xl z-50 fixed top-0 w-full border-b border-white/5">
         <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white/5 rounded-xl text-white hover:text-[#00a884] transition-all border border-white/5 active:scale-90">
            <Menu size={24} />
         </button>
         <div className="flex flex-col items-center">
            <h1 className="text-[11px] md:text-[14px] font-black tracking-[0.2em] md:tracking-[0.4em] text-[#00a884] text-glow uppercase italic leading-none">MAESTRO MASTER DANIEL</h1>
            <span className="text-[7px] md:text-[8px] font-bold text-slate-500 uppercase tracking-[0.5em] mt-1">{VERSION}</span>
         </div>
         <button onClick={() => setShowProtocolHub(true)} className="p-3 bg-white/5 border border-white/10 rounded-xl text-slate-400 hover:text-[#00a884] transition-all active:scale-90">
            <Settings size={24} />
         </button>
      </header>

      <main className="flex-1 flex flex-col pt-20">
        <div className="flex-1 overflow-y-auto min-h-0 max-h-[calc(100vh-180px)] custom-scrollbar px-4 md:px-20 lg:px-64 py-6 md:py-10 space-y-8 md:space-y-12">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center">
              <div className="w-full max-w-lg space-y-4 px-4">
                {[
                  { label: "Sincronizar Voz Maestro", icon: <Headphones size={20} />, action: "Sincronizar Voz Maestro" },
                  { label: "Verificar Conexão Supabase", icon: <Network size={20} />, action: async () => { const res = await checkSupabaseConnection(); showEvolutionBanner(res.message, res.success ? 'success' : 'error'); } },
                  { label: "Sistema Estude Alpha", icon: <GraduationCap size={20} />, action: () => { setActiveTab('estude'); setShowProtocolHub(true); } },
                  { label: "Protocol Hub Alpha", icon: <Activity size={20} />, action: () => { setActiveTab('vocal'); setShowProtocolHub(true); } },
                  { label: "Gerar Visão Wan", icon: <Video size={20} />, action: () => { setActiveTab('video'); setShowProtocolHub(true); } }
                ].map((btn, i) => (
                  <button key={i} onClick={typeof btn.action === 'function' ? (btn.action as any) : () => handleSend(btn.action as string)} className="w-full bg-[#1c272f]/60 backdrop-blur-xl py-5 md:py-6 px-6 md:px-8 rounded-[1.5rem] md:rounded-[1.8rem] border border-white/5 flex items-center justify-center gap-4 text-[10px] md:text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-[#00a884] hover:border-[#00a884]/40 transition-all shadow-xl">
                    {btn.icon} {btn.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <AnimatePresence>
            {messages.map((m: any) => (
              <motion.div key={m.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                {m.role === 'user' ? (
                  <div className="bg-[#1c272f]/90 backdrop-blur-2xl p-5 md:p-8 rounded-[1.5rem] md:rounded-[1.8rem] rounded-tr-none max-w-[90%] md:max-w-[85%] border border-white/10 shadow-2xl">
                    {m.image && <img src={m.image} className="max-w-full rounded-2xl mb-4 border border-white/10" />}
                    <p className="text-sm md:text-lg font-medium text-slate-100 italic">"{m.content}"</p>
                  </div>
                ) : ( 
                  <div className="w-full space-y-8">
                    {m.videoUrl && (
                      <div className="rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl bg-black max-w-2xl">
                        <video src={m.videoUrl} controls className="w-full" />
                      </div>
                    )}
                    {m.maestroData ? (
                      <MaestroBlock data={m.maestroData} voiceSettings={voiceSettings} integrationSettings={integrationSettings} /> 
                    ) : (
                      <div className="bg-[#1c272f]/80 backdrop-blur-2xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10 max-w-2xl">
                        <p className="text-base md:text-lg text-slate-100 whitespace-pre-wrap">{m.content}</p>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
          {isProcessing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
              <div className="bg-[#1c272f]/80 backdrop-blur-2xl p-6 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border border-white/10">
                <p className="text-base md:text-lg text-slate-400 italic">Maestro está escrevendo...</p>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} className="h-24 md:h-32" />
        </div>

        <div className="px-4 md:px-6 pb-6 md:pb-12 shrink-0 z-50">
           <div className="max-w-4xl mx-auto flex items-end gap-3 md:gap-4">
              <div className="flex-1 bg-[#1e293b]/90 backdrop-blur-3xl rounded-[1.8rem] md:rounded-[2.5rem] flex flex-col p-2 border border-white/10 shadow-2xl focus-within:ring-2 focus-within:ring-[#00a884]/40 relative min-h-[60px] md:min-h-[80px]">
                 {selectedImage && (
                    <div className="px-4 md:px-6 pt-3 md:pt-4 relative group w-fit">
                       <img src={selectedImage} className="h-16 w-16 md:h-20 md:w-20 object-cover rounded-xl md:rounded-2xl border border-white/10" />
                       <button onClick={() => setSelectedImage(null)} className="absolute -top-1.5 -right-1.5 bg-red-500 rounded-full p-1 shadow-lg text-white"><X size={12} /></button>
                    </div>
                 )}
                 <div className="flex items-center px-4 md:px-6">
                    <textarea rows={1} value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder="Comando Maestro Alpha..." className="flex-1 bg-transparent border-none focus:ring-0 text-white py-4 md:py-6 text-sm md:text-lg placeholder-slate-700 resize-none leading-relaxed italic" />
                    <input type="file" ref={fileInputRef} onChange={(e) => {
                       const file = e.target.files?.[0];
                       if(file) {
                          const reader = new FileReader();
                          reader.onloadend = () => setSelectedImage(reader.result as string);
                          reader.readAsDataURL(file);
                       }
                    }} accept="image/*" className="hidden" />
                    <button onClick={() => fileInputRef.current?.click()} className="p-3 md:p-4 text-slate-500 hover:text-[#00a884] transition-all"><Camera size={24} /></button>
                 </div>
              </div>
              <button 
                onClick={inputValue.trim() || selectedImage ? () => handleSend() : undefined}
                onMouseDown={!inputValue.trim() && !selectedImage ? startRecording : undefined}
                onMouseUp={!inputValue.trim() && !selectedImage ? stopRecording : undefined}
                onMouseLeave={!inputValue.trim() && !selectedImage ? stopRecording : undefined}
                onTouchStart={!inputValue.trim() && !selectedImage ? startRecording : undefined}
                onTouchEnd={!inputValue.trim() && !selectedImage ? stopRecording : undefined}
                className={`w-[60px] h-[60px] md:w-[80px] md:h-[80px] rounded-full flex items-center justify-center text-white transition-all active:scale-75 shadow-2xl shrink-0 ${inputValue.trim() || selectedImage || isListening ? 'bg-[#00a884] box-glow-strong' : 'bg-[#1e293b] border border-white/10 text-slate-500 hover:text-[#00a884]'}`}>
                 {inputValue.trim() || selectedImage ? <Send size={24} /> : (isListening ? <Loader2 className="animate-spin" size={24} /> : <Mic size={24} />)}
              </button>
           </div>
        </div>
      </main>

      <AnimatePresence>
        {showProtocolHub && (
          <div className="fixed inset-0 z-[300] flex items-end md:items-center justify-center p-0 md:p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowProtocolHub(false)} className="absolute inset-0 bg-black/95 backdrop-blur-3xl" />
            <motion.div initial={{ y: '100%', opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: '100%', opacity: 0 }} transition={{ type: 'spring', damping: 25, stiffness: 200 }} className="relative w-full max-w-5xl bg-[#0b141a] rounded-t-[2.5rem] md:rounded-[3.5rem] border border-white/10 flex flex-col p-6 md:p-12 shadow-2xl max-h-[92vh] md:max-h-[85vh] overflow-hidden">
               
               <div className="flex justify-between items-center mb-6 md:mb-10 shrink-0">
                  <div className="flex items-center gap-4 text-[#00a884]">
                    <Settings size={28} className="md:w-8 md:h-8" />
                    <h2 className="text-lg md:text-2xl font-black italic uppercase tracking-[0.2em] text-white">PROTOCOL HUB ALPHA</h2>
                  </div>
                  <button onClick={() => setShowProtocolHub(false)} className="p-3 bg-white/5 rounded-2xl text-slate-500 hover:text-white transition-all active:scale-90"><X size={28} /></button>
               </div>

               <div className="bg-black/60 p-1.5 md:p-2.5 rounded-[2rem] md:rounded-[2.5rem] flex gap-1.5 md:gap-2.5 mb-8 md:mb-10 border border-white/5 shrink-0 overflow-x-auto no-scrollbar">
                  {[
                    {id:'vocal', icon:<Volume2 size={20}/>, label: 'VOZ'}, 
                    {id:'estude', icon:<GraduationCap size={20}/>, label: 'ESTUDE'},
                    {id:'malha', icon:<Share2 size={20}/>, label: 'MALHA'}, 
                    {id:'evolucao', icon:<Layers size={20}/>, label: 'EVOLUÇÃO'}, 
                    {id:'video', icon:<Video size={20}/>, label: 'WAN'}
                  ].map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex-1 min-w-[70px] md:min-w-[100px] py-4 md:py-5 rounded-[1.5rem] md:rounded-[2.2rem] flex flex-col items-center justify-center gap-1 transition-all duration-300 ${activeTab === tab.id ? 'bg-[#00a884] text-white shadow-[0_0_20px_rgba(0,168,132,0.3)]' : 'text-slate-600 hover:text-slate-300'}`}>
                      {tab.icon}
                      <span className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.1em]">{tab.label}</span>
                    </button>
                  ))}
               </div>

               <div className="flex-1 overflow-y-auto custom-scrollbar px-2 space-y-8 md:space-y-12 pb-10">
                  {activeTab === 'estude' && (
                    <div className="h-full min-h-[500px] animate-in fade-in duration-500">
                      <OpenClawHub 
                        integrationSettings={integrationSettings} 
                        setIntegrationSettings={setIntegrationSettings} 
                      />
                    </div>
                  )}
                  {activeTab === 'vocal' && (
                     <div className="space-y-10 animate-in fade-in duration-500 px-2 md:px-4 pb-20">
                        {/* Voice Profile Selection Cards */}
                        <div className="flex justify-between items-center mb-4 px-2">
                           <h3 className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Perfil de Voz Alpha</h3>
                           <button 
                             onClick={() => {
                               setVoiceSettings({
                                 ...voiceSettings,
                                 gender: 'male',
                                 isIntegrated: true,
                                 provider: 'elevenlabs',
                                 elevenLabsVoiceId: 'pNInz6obpgnuM07kg7nI'
                               });
                               showEvolutionBanner("VOZ: Perfil Daniel Master Restaurado.", "success");
                             }}
                             className="text-[9px] font-black text-[#00a884] uppercase tracking-widest hover:underline"
                           >
                             Resetar para Padrão Daniel
                           </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4 md:gap-8">
                           <button 
                             onClick={() => setVoiceSettings({...voiceSettings, gender: 'male', elevenLabsVoiceId: 'pNInz6obpgnuM07kg7nI'})} 
                             className={`relative aspect-square md:aspect-auto md:py-24 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center justify-center gap-6 md:gap-10 border transition-all duration-500 overflow-hidden ${voiceSettings.gender === 'male' ? 'bg-[#00a884] border-[#00a884] text-white shadow-[0_0_40px_rgba(0,168,132,0.4)]' : 'bg-[#1c272f]/40 border-white/5 text-slate-500'}`}
                           >
                              {voiceSettings.gender === 'male' && <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />}
                              <div className={`p-6 md:p-8 rounded-full ${voiceSettings.gender === 'male' ? 'bg-white/20' : 'bg-white/5'}`}>
                                <User size={48} className="md:w-16 md:h-16" strokeWidth={1.5} />
                              </div>
                              <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[0.3em] italic">DANIEL (MASC)</span>
                           </button>

                           <button 
                             onClick={() => setVoiceSettings({...voiceSettings, gender: 'female', elevenLabsVoiceId: '21m00Tcm4TlvDq8ikWAM'})} 
                             className={`relative aspect-square md:aspect-auto md:py-24 rounded-[2.5rem] md:rounded-[3.5rem] flex flex-col items-center justify-center gap-6 md:gap-10 border transition-all duration-500 overflow-hidden ${voiceSettings.gender === 'female' ? 'bg-[#00a884] border-[#00a884] text-white shadow-[0_0_40px_rgba(0,168,132,0.4)]' : 'bg-[#1c272f]/40 border-white/5 text-slate-500'}`}
                           >
                              {voiceSettings.gender === 'female' && <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />}
                              <div className={`p-6 md:p-8 rounded-full ${voiceSettings.gender === 'female' ? 'bg-white/20' : 'bg-white/5'}`}>
                                <User size={48} className="md:w-16 md:h-16" strokeWidth={1.5} />
                              </div>
                              <span className="text-[10px] md:text-[14px] font-black uppercase tracking-[0.3em] italic">VITORIA (FEM)</span>
                           </button>
                        </div>

                        {/* Synthesis Toggle Card */}
                        <div className="bg-[#1c272f]/40 border border-white/5 rounded-[2.5rem] md:rounded-[3.5rem] p-8 md:p-12 flex flex-col gap-8 shadow-xl">
                           <div className="flex items-center justify-between">
                              <div className="flex flex-col gap-2">
                                 <h4 className="text-sm md:text-xl font-black text-white italic tracking-wide">Síntese Daniel Integrada</h4>
                                 <div className="flex items-center gap-2">
                                    <span className="text-[8px] md:text-[10px] font-black text-[#00a884] uppercase tracking-widest">KEY MASTER ALPHA ATIVA</span>
                                 </div>
                              </div>
                              <button 
                                onClick={() => setVoiceSettings({...voiceSettings, isIntegrated: !voiceSettings.isIntegrated})}
                                className={`relative w-16 md:w-20 h-8 md:h-10 rounded-full p-1 transition-all duration-500 ${voiceSettings.isIntegrated ? 'bg-[#00a884]' : 'bg-slate-800'}`}
                              >
                                 <div className={`w-6 md:w-8 h-6 md:h-8 bg-white rounded-full shadow-lg transition-transform duration-500 ${voiceSettings.isIntegrated ? 'translate-x-8 md:translate-x-10' : 'translate-x-0'}`} />
                              </button>
                           </div>

                           <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => setVoiceSettings({...voiceSettings, provider: 'elevenlabs'})}
                                className={`p-4 rounded-2xl border transition-all ${voiceSettings.provider === 'elevenlabs' ? 'bg-[#00a884]/10 border-[#00a884] text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                              >
                                 <span className="text-[10px] font-black uppercase tracking-widest">ElevenLabs</span>
                              </button>
                              <button 
                                onClick={() => setVoiceSettings({...voiceSettings, provider: 'gemini'})}
                                className={`p-4 rounded-2xl border transition-all ${voiceSettings.provider === 'gemini' ? 'bg-[#00a884]/10 border-[#00a884] text-white' : 'bg-white/5 border-white/5 text-slate-500'}`}
                              >
                                 <span className="text-[10px] font-black uppercase tracking-widest">Gemini TTS</span>
                              </button>
                           </div>
                        </div>

                        {/* Tone Advanced Configuration */}
                        {voiceSettings.provider === 'elevenlabs' && (
                           <div className="bg-[#1c272f]/20 border border-white/5 rounded-[2.5rem] p-8 space-y-8">
                              <div className="flex items-center gap-3 text-slate-400">
                                 <Sliders size={18} />
                                 <h4 className="text-[10px] font-black uppercase tracking-widest">Configuração de Tom Master</h4>
                              </div>

                              <div className="space-y-6">
                                 <div className="space-y-3">
                                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">ElevenLabs API Key (Opcional)</label>
                                    <input 
                                      type="password"
                                      placeholder="SISTEMA ALPHA ATIVO"
                                      value={voiceSettings.elevenLabsKey || ''}
                                      onChange={(e) => setVoiceSettings({...voiceSettings, elevenLabsKey: e.target.value})}
                                      className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white focus:border-[#00a884]/50 outline-none transition-all"
                                    />
                                    <p className="text-[8px] text-slate-600 font-bold uppercase">Deixe vazio para usar a chave mestre do sistema.</p>
                                 </div>

                                 {!voiceSettings.isIntegrated && (
                                   <div className="space-y-3">
                                      <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Voice ID Customizado</label>
                                      <input 
                                        type="text"
                                        placeholder="ID da Voz ElevenLabs"
                                        value={voiceSettings.elevenLabsVoiceId}
                                        onChange={(e) => setVoiceSettings({...voiceSettings, elevenLabsVoiceId: e.target.value})}
                                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-xs text-white focus:border-[#00a884]/50 outline-none transition-all"
                                      />
                                   </div>
                                 )}
                              </div>
                              
                              <div className="space-y-4">
                                 <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                    <span>Estabilidade</span>
                                    <span className="text-[#00a884]">{Math.round(voiceSettings.elevenLabsSettings.stability * 100)}%</span>
                                 </div>
                                 <input 
                                   type="range" min="0" max="1" step="0.01" 
                                   value={voiceSettings.elevenLabsSettings.stability}
                                   onChange={(e) => setVoiceSettings({
                                     ...voiceSettings, 
                                     elevenLabsSettings: { ...voiceSettings.elevenLabsSettings, stability: parseFloat(e.target.value) }
                                   })}
                                   className="w-full accent-[#00a884]"
                                 />
                              </div>

                              <div className="space-y-4">
                                 <div className="flex justify-between text-[10px] font-black uppercase text-slate-500">
                                    <span>Clareza (Boost)</span>
                                    <span className="text-[#00a884]">{Math.round(voiceSettings.elevenLabsSettings.similarity_boost * 100)}%</span>
                                 </div>
                                 <input 
                                   type="range" min="0" max="1" step="0.01" 
                                   value={voiceSettings.elevenLabsSettings.similarity_boost}
                                   onChange={(e) => setVoiceSettings({
                                     ...voiceSettings, 
                                     elevenLabsSettings: { ...voiceSettings.elevenLabsSettings, similarity_boost: parseFloat(e.target.value) }
                                   })}
                                   className="w-full accent-[#00a884]"
                                 />
                              </div>
                           </div>
                        )}

                        {/* Engine Selection Buttons */}
                        <div className="grid grid-cols-2 gap-4">
                           <button 
                             onClick={() => setVoiceSettings({...voiceSettings, provider: 'gemini'})}
                             className={`py-8 rounded-[1.8rem] md:rounded-[2.5rem] font-black uppercase tracking-widest text-[9px] md:text-[11px] border transition-all ${voiceSettings.provider === 'gemini' ? 'bg-[#00a884]/20 border-[#00a884] text-[#00a884]' : 'bg-white/5 border-white/5 text-slate-700'}`}
                           >
                              GEMINI MALHA 2.5
                           </button>
                           <button 
                             onClick={() => setVoiceSettings({...voiceSettings, provider: 'elevenlabs'})}
                             className={`py-8 rounded-[1.8rem] md:rounded-[2.5rem] font-black uppercase tracking-widest text-[9px] md:text-[11px] border transition-all ${voiceSettings.provider === 'elevenlabs' ? 'bg-[#00a884]/20 border-[#00a884] text-[#00a884]' : 'bg-white/5 border-white/5 text-slate-700'}`}
                           >
                              ELEVEN LABS AI
                           </button>
                        </div>
                     </div>
                  )}

                  {activeTab === 'malha' && (
                     <div className="space-y-8 animate-in fade-in duration-500">
                        <p className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] text-center italic">REDE NEURAL MASTER 2026</p>
                        
                        <div className="bg-[#1c272f]/40 border border-[#00a884]/20 rounded-[2.5rem] p-8 md:p-12 space-y-6 md:space-y-8 shadow-inner mx-2 md:mx-4 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-4">
                             <div className="flex items-center gap-2 px-4 py-2 bg-[#00a884]/20 rounded-full border border-[#00a884]/30 shadow-lg">
                                 <div className="w-1.5 h-1.5 rounded-full bg-[#00a884] animate-pulse" />
                                 <span className="text-[10px] font-black text-[#00a884] uppercase tracking-widest">MALHA SINC</span>
                             </div>
                           </div>
                           <div className="flex items-center gap-6 text-[#00a884] mb-4">
                               <Shield size={28} className="text-[#00a884] opacity-50" />
                               <div className="flex flex-col">
                                 <h4 className="text-[12px] md:text-[14px] font-black text-white uppercase tracking-[0.2em]">Sincronização Cloud Alpha</h4>
                                 <p className="text-[9px] font-bold text-slate-500 uppercase mt-1">Conecte seu próprio Supabase para backup em nuvem</p>
                               </div>
                           </div>
                            <div className="space-y-4">
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Supabase URL</label>
                                  <input 
                                    type="text" 
                                    placeholder="https://your-project.supabase.co" 
                                    value={integrationSettings.supabaseConfig?.url || ''}
                                    onChange={(e) => setIntegrationSettings({
                                      ...integrationSettings, 
                                      supabaseConfig: { ...integrationSettings.supabaseConfig!, url: e.target.value }
                                    })}
                                    className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 px-6 text-white text-xs outline-none focus:border-[#00a884]/50 transition-all"
                                  />
                               </div>
                               <div className="space-y-2">
                                  <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest px-2">Supabase Anon Key</label>
                                  <input 
                                    type="password" 
                                    placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." 
                                    value={integrationSettings.supabaseConfig?.key || ''}
                                    onChange={(e) => setIntegrationSettings({
                                      ...integrationSettings, 
                                      supabaseConfig: { ...integrationSettings.supabaseConfig!, key: e.target.value }
                                    })}
                                    className="w-full bg-black/60 border border-white/5 rounded-2xl py-4 px-6 text-white text-xs outline-none focus:border-[#00a884]/50 transition-all"
                                  />
                               </div>
                               <p className="text-[8px] text-slate-600 font-bold uppercase text-center">O sistema usa LocalStorage por padrão se os campos estiverem vazios.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-4 px-2 md:px-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-3">
                           {[
                              {id:'gemini-3-pro-preview', name:'GEMINI 3 PRO', desc:'LÓGICA ELITE', icon: <Cpu className="text-indigo-400" />},
                              {id:'openai/gpt-4o', name:'GPT-4O OMNIS', desc:'CRIATIVIDADE FLUIDA', icon: <Sparkles className="text-emerald-400" />},
                              {id:'x-ai/grok-2-1212', name:'GROK 2 ELITE', desc:'LÓGICA X-ALPHA', icon: <Zap className="text-yellow-400" />},
                              {id:'anthropic/claude-3-opus-20240229', name:'CLAUDE 3 OPUS', desc:'CONSCIÊNCIA ALPHA', icon: <Brain className="text-orange-600" />},
                              {id:'anthropic/claude-3-sonnet-20240229', name:'CLAUDE 3 SONNET', desc:'LÓGICA ESTRUTURAL', icon: <Terminal className="text-orange-400" />},
                              {id:'deepseek/deepseek-chat', name:'DEEPSEEK V3', desc:'ALTA PERFORMANCE', icon: <Zap className="text-blue-400" />},
                              {id:'meta-llama/llama-3.1-405b-instruct', name:'LLAMA 3.1 405B', desc:'GIGANTE OPEN', icon: <CircuitBoard className="text-pink-500" />},
                              {id:'google/gemini-2.0-flash-001', name:'GEMINI 2.0 FLASH', desc:'VELOCIDADE ALPHA', icon: <Zap className="text-cyan-400" />}
                           ].map(m => (
                              <button key={m.id} onClick={() => { setActiveModel(m.id); showEvolutionBanner(`SINC: Modelo ${m.name} ativado.`); }} className={`w-full p-6 md:p-8 rounded-[1.5rem] md:rounded-[2.5rem] border text-left flex items-center justify-between transition-all duration-300 ${activeModel === m.id ? 'bg-[#1c272f] border-[#00a884] shadow-[0_0_30px_rgba(0,168,132,0.1)]' : 'bg-white/5 border-white/5 opacity-40 hover:opacity-100 hover:bg-white/10'}`}>
                                 <div className="flex items-center gap-4 md:gap-6">
                                    <div className="p-3 md:p-4 bg-black/40 rounded-xl md:rounded-2xl">{m.icon}</div>
                                    <div className="min-w-0">
                                       <h4 className="font-black text-sm md:text-base text-white uppercase truncate">{m.name}</h4>
                                       <p className="text-[10px] md:text-[11px] font-black text-[#00a884] uppercase tracking-widest mt-1 truncate">{m.desc}</p>
                                    </div>
                                 </div>
                                 {activeModel === m.id && <Check className="text-[#00a884]" size={28} />}
                              </button>
                           ))}
                        </div>
                     </div>
                  )}

                  {activeTab === 'evolucao' && (
                     <div className="space-y-10 animate-in fade-in duration-500 px-2 md:px-4">
                        <p className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] text-center italic">INTEGRAÇÃO ALPHA</p>
                        <div className="space-y-6 md:space-y-8">
                           <div className="bg-black/60 border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-6 md:space-y-8 shadow-inner">
                              <div className="flex items-center justify-between mb-2">
                                 <label className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest px-4">TELEGRAM ALPHA</label>
                                 <button onClick={() => setIntegrationSettings({...integrationSettings, isTelegramActive: !integrationSettings.isTelegramActive})} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${integrationSettings.isTelegramActive ? 'bg-[#00a884]/20 border-[#00a884] text-[#00a884]' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                                    {integrationSettings.isTelegramActive ? 'ATIVO' : 'INATIVO'}
                                 </button>
                              </div>
                              <div className="space-y-3">
                                 <input 
                                    type="password" 
                                    placeholder="Bot Token (HTTP API)" 
                                    value={integrationSettings.telegramToken}
                                    onChange={(e) => setIntegrationSettings({...integrationSettings, telegramToken: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] py-4 md:py-6 px-6 md:px-10 text-white text-sm outline-none shadow-inner" 
                                  />
                              </div>
                              <div className="space-y-3">
                                 <input 
                                    type="text" 
                                    placeholder="Chat ID / Group Alpha ID" 
                                    value={integrationSettings.telegramChatId}
                                    onChange={(e) => setIntegrationSettings({...integrationSettings, telegramChatId: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] py-4 md:py-6 px-6 md:px-10 text-white text-sm outline-none shadow-inner" 
                                  />
                              </div>
                           </div>
                           
                           <div className="bg-black/60 border border-white/5 rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 space-y-6 md:space-y-8 shadow-inner">
                              <div className="flex items-center justify-between mb-2">
                                 <label className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-widest px-4">WHATSAPP BRIDGE</label>
                                 <button onClick={() => setIntegrationSettings({...integrationSettings, isWhatsappActive: !integrationSettings.isWhatsappActive})} className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-all ${integrationSettings.isWhatsappActive ? 'bg-[#00a884]/20 border-[#00a884] text-[#00a884]' : 'bg-white/5 border-white/10 text-slate-600'}`}>
                                    {integrationSettings.isWhatsappActive ? 'ATIVO' : 'INATIVO'}
                                 </button>
                              </div>
                              <div className="space-y-3">
                                 <input 
                                    type="text" 
                                    placeholder="Número Internacional (ex: 5511...)" 
                                    value={integrationSettings.whatsappNumber}
                                    onChange={(e) => setIntegrationSettings({...integrationSettings, whatsappNumber: e.target.value})}
                                    className="w-full bg-white/5 border border-white/10 rounded-[1.2rem] md:rounded-[1.5rem] py-4 md:py-6 px-6 md:px-10 text-white text-sm outline-none shadow-inner" 
                                  />
                              </div>
                           </div>
                        </div>
                        <button 
                          onClick={() => {
                            syncSettings(syncId, { integration: integrationSettings, voice: voiceSettings, activeModel });
                            showEvolutionBanner("MALHA: Configurações de Integração Sincronizadas.", "success");
                          }}
                          className="w-full py-7 md:py-10 bg-[#00a884] text-white rounded-[2rem] md:rounded-[3rem] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-4 text-sm md:text-lg hover:scale-[1.01] active:scale-[0.99] transition-all"
                        >
                           <Download size={24} /> SALVAR SCRIPT MASTER
                        </button>
                     </div>
                  )}

                  {activeTab === 'video' && (
                     <div className="space-y-10 animate-in fade-in duration-500 px-2 md:px-4">
                        <p className="text-[10px] md:text-[11px] font-black text-slate-600 uppercase tracking-[0.5em] text-center italic">NODE WAN MASTER</p>
                        <div className="bg-[#0f172a]/80 border border-white/5 rounded-[3.5rem] p-12 min-h-[220px] md:min-h-[280px] flex items-center shadow-2xl transition-all">
                           <textarea rows={5} value={videoPrompt} onChange={(e) => setVideoPrompt(e.target.value)} placeholder="Projete a visão cinematográfica..." className="w-full bg-transparent border-none focus:ring-0 text-white text-lg md:text-2xl placeholder-slate-900 resize-none italic leading-relaxed text-center font-medium" />
                        </div>
                        <div className="grid grid-cols-2 gap-10">
                           <div className="space-y-4">
                              <label className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 font-black">RESOLUTION</label>
                              <div className="flex bg-[#020617] p-2.5 rounded-[2rem] border border-white/5 shadow-inner">
                                 {['720P', '1080P'].map(res => (
                                    <button key={res} onClick={() => setVideoResolution(res.toLowerCase() as any)} className={`flex-1 py-5 rounded-[1.6rem] flex items-center justify-center transition-all font-black text-[10px] md:text-[12px] ${videoResolution === res.toLowerCase() ? 'bg-[#00a884] text-white' : 'text-slate-700'}`}>
                                       {res}
                                    </button>
                                 ))}
                              </div>
                           </div>
                           <div className="space-y-4">
                              <label className="text-[9px] md:text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 font-black">RATIO</label>
                              <div className="flex bg-[#020617] p-2.5 rounded-[2rem] border border-white/5 shadow-inner">
                                 {['16:9', '9:16'].map(ratio => (
                                    <button key={ratio} onClick={() => setVideoAspectRatio(ratio as any)} className={`flex-1 py-5 rounded-[1.6rem] flex items-center justify-center transition-all font-black text-[10px] md:text-[12px] ${videoAspectRatio === ratio ? 'bg-[#00a884] text-white' : 'text-slate-700'}`}>
                                       {ratio}
                                    </button>
                                 ))}
                              </div>
                           </div>
                        </div>
                        
                        <div className="text-center">
                           <p className="text-[9px] text-slate-600 font-bold mb-4 uppercase tracking-[0.2em]">
                             Requer chave Gemini Paga com Billing Ativo. <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-[#00a884] underline">Verificar Billing</a>
                           </p>
                           <button onClick={handleGenerateVideo} disabled={isVideoGenerating} className="w-full py-10 bg-[#00a884] text-white rounded-[2.5rem] md:rounded-[3.5rem] font-black uppercase tracking-[0.4em] shadow-2xl flex items-center justify-center gap-6 text-sm md:text-lg italic disabled:opacity-50">
                              {isVideoGenerating ? <Loader2 className="animate-spin" size={32}/> : <Video size={32} />}
                              <span>{isVideoGenerating ? "PROJETANDO..." : "RENDERIZAR VÍDEO"}</span>
                           </button>
                        </div>
                     </div>
                  )}
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;


export interface MaestroResponse {
  decisao: string;
  plano: string;
  resultado: string;
  jsonEstruturado: {
    active_node: 'intelligence' | 'marketing' | 'dashboards' | 'security' | 'leads' | 'trends' | 'orchestra' | 'growth' | 'telegram' | 'whatsapp' | 'engineering' | 'replit' | 'vision' | 'social' | 'content';
    priority: 'low' | 'medium' | 'high' | 'critical';
    memoria: Array<{
      tipo: 'preferencia' | 'fato' | 'erro' | 'evolucao';
      conteudo: string;
    }>;
  };
}

export interface EvolutionInsight {
  titulo: string;
  descricao: string;
  impacto: 'alto' | 'medio' | 'baixo';
  novoProtocolo: string;
}

export interface VoiceSettings {
  gender: 'male' | 'female';
  humor: 'PROFISSIONAL' | 'ALEGRE' | 'NEUTRO' | 'URGENTE';
  version: string;
  autoPlayVoice: boolean;
  isIntegrated: boolean; // Síntese Daniel Integrada
  provider: 'gemini' | 'elevenlabs';
  elevenLabsVoiceId: string;
  elevenLabsKey?: string;
  elevenLabsSettings: {
    stability: number;
    similarity_boost: number;
    style?: number;
    use_speaker_boost?: boolean;
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  category: 'study' | 'automation' | 'intelligence' | 'tools';
  status: 'installed' | 'available' | 'updating';
}

export interface IntegrationSettings {
  telegramToken: string;
  telegramChatId: string;
  whatsappNumber: string;
  activeModel: string;
  replitStatus: 'READY' | 'OFFLINE';
  syncId: string;
  openRouterKey?: string;
  isTelegramActive: boolean;
  isWhatsappActive: boolean;
  isFreedomModeActive?: boolean;
  skills?: Skill[];
  supabaseConfig?: {
    url: string;
    key: string;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'maestro';
  content: string;
  maestroData?: MaestroResponse;
  evolutionInsights?: EvolutionInsight[];
  image?: string;
  inputMode: 'text' | 'voice' | 'image';
  timestamp: Date;
}

export enum AppStatus {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  THINKING = 'THINKING',
  ERROR = 'ERROR',
  EVOLVING = 'EVOLVING'
}

export interface SystemNotification {
  id: string;
  type: 'update' | 'evolution' | 'node_active';
  message: string;
  timestamp: Date;
}

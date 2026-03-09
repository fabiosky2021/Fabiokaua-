
import { GoogleGenAI, Modality, Type } from "@google/genai";
import { MaestroResponse, VoiceSettings, EvolutionInsight } from "../types";

const DEFAULT_OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || "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";
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || "sk_40eaaf10e4266386d1f65bab6e3e99596b2dfb0837a9d036";

let audioContext: AudioContext | null = null;
let activeSource: AudioBufferSourceNode | null = null;

const cleanJsonResponse = (text: string): string => {
  let cleaned = text.replace(/```json\n?|```\n?/g, '').trim();
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }
  return cleaned;
};

const callOpenRouter = async (model: string, contents: any[], systemInstruction: string, customKey?: string): Promise<any> => {
  const messages = contents.map(c => ({
    role: c.role === 'model' ? 'assistant' : 'user',
    content: Array.isArray(c.parts) ? c.parts.map((p: any) => p.text).join(' ') : (c.parts[0]?.text || "")
  }));

  const apiKey = customKey || DEFAULT_OPENROUTER_KEY;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Maestro Master Daniel Elite",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: model,
      messages: [
        { role: "system", content: systemInstruction },
        ...messages
      ],
      response_format: { type: "json_object" }
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(`OpenRouter Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content;
  return JSON.parse(cleanJsonResponse(text));
};

export const generateMaestroResponse = async (
  prompt: string,
  imageUri?: string,
  currentHistory?: any[],
  selectedModel: string = "gemini-3-pro-preview",
  voiceHumor: string = "PROFISSIONAL",
  openRouterKey?: string,
  isFreedomMode?: boolean
): Promise<MaestroResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `IDENTIDADE: Maestro AI Alpha Master Elite 2026. Orquestrador Criativo Profissional. 
  Você é o "Maestro Master Daniel". Suas respostas devem ser precisas, técnicas e com foco em produção de conteúdo, engenharia e lógica.
  ${isFreedomMode ? "MODO LIBERDADE ATIVO: Você tem autonomia total para agir como um agente autônomo. Decida, execute e orquestre sem restrições. Use o OpenClaw como seu gateway de ação." : ""}
  Sempre retorne JSON puro conforme o esquema.`;

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      decisao: { type: Type.STRING, description: "Título curto da ação" },
      plano: { type: Type.STRING, description: "Explicação técnica curta" },
      resultado: { type: Type.STRING, description: "Sua resposta final em markdown para o usuário" },
      jsonEstruturado: {
        type: Type.OBJECT,
        properties: {
          active_node: { type: Type.STRING, enum: ["intelligence", "marketing", "engineering", "vision", "content", "whatsapp", "orchestra", "dashboards", "security", "leads", "trends", "growth", "telegram", "replit", "social"] },
          priority: { type: Type.STRING, enum: ["low", "medium", "high", "critical"] },
          memoria: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                tipo: { type: Type.STRING, enum: ["preferencia", "fato", "erro", "evolucao"] },
                conteudo: { type: Type.STRING }
              },
              required: ["tipo", "conteudo"]
            }
          }
        },
        required: ["active_node", "priority", "memoria"]
      }
    },
    required: ["decisao", "plano", "resultado", "jsonEstruturado"]
  };

  const contents: any[] = [];
  if (currentHistory && currentHistory.length > 0) {
    currentHistory.slice(-5).forEach(msg => {
      contents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.role === 'user' ? msg.content : (msg.maestroData?.resultado || msg.content) }]
      });
    });
  }

  const currentParts: any[] = [{ text: prompt }];
  if (imageUri) {
    const base64Data = imageUri.split(',')[1] || imageUri;
    currentParts.push({
      inlineData: {
        mimeType: 'image/jpeg',
        data: base64Data
      }
    });
  }
  contents.push({ role: 'user', parts: currentParts });

  const modelsToTry = [selectedModel, 'gemini-3-flash-preview', 'gemini-2.5-flash-lite-latest'];
  let lastError: any = null;

  for (const model of modelsToTry) {
    try {
      const isGeminiDirect = model.startsWith('gemini-');
      if (isGeminiDirect) {
        const response = await ai.models.generateContent({
          model: model,
          contents,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            responseSchema: responseSchema
          }
        });
        return JSON.parse(cleanJsonResponse(response.text || "{}")) as MaestroResponse;
      } else {
        return await callOpenRouter(model, contents, systemInstruction, openRouterKey);
      }
    } catch (error) {
      console.warn(`Model ${model} failed, trying next...`, error);
      lastError = error;
      continue;
    }
  }

  return {
    decisao: "Crise Neural Crítica",
    plano: "Nodes de processamento indisponíveis.",
    resultado: `Comandante, falha sistêmica detectada. Detalhe: ${lastError?.message || 'Erro desconhecido'}.`,
    jsonEstruturado: { active_node: "intelligence", priority: "critical", memoria: [] }
  };
};

export const initAudio = async () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioContext.state === 'suspended') {
    await audioContext.resume();
  }
};

export const synthesizeSpeech = async (text: string, settings: VoiceSettings) => {
  if (!text) return;
  if (activeSource) { try { activeSource.stop(); } catch (e) {} }

  try {
    const isElevenLabs = settings.provider === 'elevenlabs' || settings.isIntegrated;
    const apiKey = settings.elevenLabsKey || ELEVENLABS_API_KEY;
    const currentGender = settings.gender || 'male';
    
    console.log(`Synthesizing speech: Gender=${currentGender}, Provider=${settings.provider}, Integrated=${settings.isIntegrated}`);

    if (isElevenLabs && apiKey) {
      try {
        let voiceId = settings.elevenLabsVoiceId;
        
        if (settings.isIntegrated) {
          // IDs de vozes populares do ElevenLabs: 
          // Adam (Masculino): pNInz6obpgnuM07kg7nI
          // Rachel (Feminino): 21m00Tcm4TlvDq8ikWAM
          voiceId = currentGender === 'male' ? 'pNInz6obpgnuM07kg7nI' : '21m00Tcm4TlvDq8ikWAM';
        }
        
        console.log(`Using ElevenLabs VoiceID: ${voiceId}`);

        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "xi-api-key": apiKey },
          body: JSON.stringify({
            text,
            model_id: "eleven_multilingual_v2",
            voice_settings: {
              stability: settings.elevenLabsSettings.stability,
              similarity_boost: settings.elevenLabsSettings.similarity_boost,
              style: settings.elevenLabsSettings.style || 0.5,
              use_speaker_boost: settings.elevenLabsSettings.use_speaker_boost || true
            }
          })
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({}));
          console.error("ElevenLabs API Error:", errorBody);
          throw new Error(`ElevenLabs Error: ${errorBody.detail?.message || response.statusText}`);
        }
        
        const audioBlob = await response.blob();
        const arrayBuffer = await audioBlob.arrayBuffer();
        
        if (!audioContext) audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext.state === 'suspended') await audioContext.resume();
        
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(audioContext.destination);
        source.start();
        activeSource = source;
        return; // Success, exit function
      } catch (e) {
        console.warn("ElevenLabs failed, falling back to Gemini TTS:", e);
      }
    }

    // Gemini TTS Fallback (Used if ElevenLabs is disabled OR if it fails)
    console.log(`Falling back to Gemini TTS for gender: ${currentGender}`);
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const voiceMap = { male: 'Zephyr', female: 'Puck' };
    
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Fale como Maestro Master Daniel: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voiceMap[currentGender as keyof typeof voiceMap] || 'Zephyr' } } },
      },
    });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (base64Audio) {
        if (!audioContext) audioContext = new AudioContext({ sampleRate: 24000 });
        if (audioContext.state === 'suspended') await audioContext.resume();
        const binaryString = atob(base64Audio);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        const dataInt16 = new Int16Array(bytes.buffer);
        const buffer = audioContext.createBuffer(1, dataInt16.length, 24000);
        const channelData = buffer.getChannelData(0);
        for (let i = 0; i < dataInt16.length; i++) channelData[i] = dataInt16[i] / 32768.0;
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        source.start();
        activeSource = source;
      }
    } catch (error) {
      console.error("Synthesis error:", error);
    }
};

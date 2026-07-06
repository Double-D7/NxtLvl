// Ambient declarations for the renderer: the bridge exposed by preload.ts and
// the non-standard Web Speech recognition API (Chromium's webkitSpeechRecognition).

interface JarvisReply {
  text: string;
  toolsUsed: string[];
  error?: boolean;
}

interface JarvisBridge {
  ask(text: string): Promise<JarvisReply>;
  reset(): Promise<void>;
  getStatus(): Promise<{ hasApiKey: boolean; googleConfigured: boolean; userName: string }>;
  onSpeak(cb: (text: string) => void): void;
}

interface Window {
  jarvis: JarvisBridge;
  webkitSpeechRecognition: SpeechRecognitionCtor;
  SpeechRecognition?: SpeechRecognitionCtor;
}

type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

// Ambient declarations for the renderer: the bridge exposed by preload.ts.

interface JarvisReply {
  text: string;
  toolsUsed: string[];
  error?: boolean;
}

interface JarvisStatus {
  hasApiKey: boolean;
  googleConfigured: boolean;
  sttConfigured: boolean;
  userName: string;
}

interface TranscriptResult {
  text: string;
  error?: string;
}

interface JarvisBridge {
  ask(
    text: string,
    onDelta?: (delta: string) => void,
    onTool?: (label: string) => void,
  ): Promise<JarvisReply>;
  reset(): Promise<void>;
  getStatus(): Promise<JarvisStatus>;
  transcribe(bytes: ArrayBuffer, mimeType: string): Promise<TranscriptResult>;
  onSpeak(cb: (text: string) => void): void;
}

interface Window {
  jarvis: JarvisBridge;
}

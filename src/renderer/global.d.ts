// Ambient declarations for the renderer: the bridge exposed by preload.ts.

interface JarvisReply {
  text: string;
  toolsUsed: string[];
  error?: boolean;
}

interface JarvisStatus {
  hasApiKey: boolean;
  sttConfigured: boolean;
  outlookConfigured: boolean;
  outlookConnected: boolean;
  outlookAccount: string;
  msClientId: string;
  msTenantId: string;
  userName: string;
}

interface TranscriptResult {
  text: string;
  error?: string;
}

interface Telemetry {
  cpu: number;
  memUsed: number;
  memGb: number;
  memTotalGb: number;
  uptime: number;
  hostname: string;
  platform: string;
  time: string;
  reminders: { pending: number; next: string | null; nextAt: string | null };
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
  saveKeys(keys: { anthropic?: string; openai?: string }): Promise<{ hasApiKey: boolean; sttConfigured: boolean }>;
  saveMsConfig(cfg: { clientId?: string; tenantId?: string }): Promise<{ outlookConfigured: boolean }>;
  connectOutlook(): Promise<{ connected: boolean; account?: string; error?: string }>;
  disconnectOutlook(): Promise<{ outlookConnected: boolean }>;
  onSpeak(cb: (text: string) => void): void;
  onStats(cb: (stats: Telemetry) => void): void;
}

interface Window {
  jarvis: JarvisBridge;
}

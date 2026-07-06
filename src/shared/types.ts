// Types shared across the main and renderer processes.

/** A message exchanged over IPC between the renderer and Jarvis's brain. */
export interface ChatTurn {
  role: "user" | "assistant";
  text: string;
}

/** The result of asking Jarvis something. */
export interface JarvisReply {
  /** The spoken/printed answer. */
  text: string;
  /** Human-readable names of any tools Jarvis used, for the UI to show. */
  toolsUsed: string[];
  /** True if something went wrong; `text` then holds an error message. */
  error?: boolean;
}

/** A locally-stored reminder / task. */
export interface Reminder {
  id: string;
  text: string;
  /** ISO 8601 timestamp for when it's due, or null for an undated task. */
  dueAt: string | null;
  createdAt: string;
  done: boolean;
  /** True once we've fired the desktop notification for a due reminder. */
  notified: boolean;
}

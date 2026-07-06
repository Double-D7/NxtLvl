import type Anthropic from "@anthropic-ai/sdk";

/**
 * A tool Jarvis can call. `definition` is sent to the Claude API; `run`
 * executes locally in the Electron main process when Claude asks for it.
 */
export interface JarvisTool {
  definition: Anthropic.Tool;
  /** A friendly label shown in the UI when this tool runs. */
  label: string;
  /** Execute the tool. Return a plain-text result for Claude to read. */
  run(input: Record<string, unknown>): Promise<string>;
}

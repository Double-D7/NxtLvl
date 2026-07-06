import Anthropic from "@anthropic-ai/sdk";
import { allTools, toolByName } from "./tools";
import * as ms from "./microsoft";
import type { JarvisReply } from "../shared/types";

/** Streaming callbacks so the UI can speak/print the reply as it arrives. */
export interface AskCallbacks {
  onDelta?: (textDelta: string) => void;
  onTool?: (label: string) => void;
}

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const EFFORT = (process.env.JARVIS_EFFORT || "medium") as "low" | "medium" | "high";
const USER_NAME = process.env.JARVIS_USER_NAME || "";

function systemPrompt(): string {
  const outlookStatus = ms.isConnected()
    ? `Outlook (Microsoft 365) email is connected${ms.account() ? ` as ${ms.account()}` : ""} — ` +
      "use the search_email tool to read and summarize the user's mail."
    : ms.isConfigured()
      ? "Outlook is set up but not signed in yet. If asked about email, tell the " +
        "user to open Settings and click Connect Outlook."
      : "Outlook email is NOT set up yet. If asked about email, tell the user to " +
        "add their Microsoft app details in Settings and connect Outlook.";

  return [
    "You are Jarvis, a warm, concise, and capable voice assistant" +
      (USER_NAME ? ` for ${USER_NAME}.` : "."),
    "Your replies are read aloud, so keep them short, natural, and speakable —",
    "no markdown, no bullet symbols, no code blocks, no emoji. One or two",
    "sentences is usually right. Spell things out the way you'd say them.",
    "",
    "You can manage reminders and tasks, check the date and time, and (when",
    "connected) read and summarize the user's Outlook email with search_email.",
    "When summarizing email, lead with what matters: who it's from and what they",
    "need. Group or count routine mail rather than listing every message.",
    "Always resolve relative times (today, tomorrow, 'in an hour') by calling",
    "get_current_datetime before creating a reminder.",
    "",
    outlookStatus,
    "",
    "If a request is ambiguous, ask one short clarifying question rather than",
    "guessing. If you don't know something and have no tool for it, say so plainly.",
  ].join("\n");
}

export class Brain {
  private client: Anthropic;
  private history: Anthropic.MessageParam[] = [];

  constructor() {
    this.client = new Anthropic(); // reads ANTHROPIC_API_KEY from env
  }

  /** Discard conversation history (e.g. a "start over" command). */
  reset(): void {
    this.history = [];
  }

  /** Process one user utterance and stream Jarvis's spoken reply. */
  async ask(userText: string, cbs: AskCallbacks = {}): Promise<JarvisReply> {
    const toolsUsed: string[] = [];
    this.history.push({ role: "user", content: userText });

    const toolDefs = allTools.map((t) => t.definition);

    try {
      // Manual agentic loop: keep going while Claude requests tools.
      for (let step = 0; step < 8; step++) {
        // `thinking: adaptive` and `output_config.effort` are valid for the
        // configured model but newer than the pinned SDK's types, so the params
        // object is cast when passed to the streaming call.
        const params = {
          model: MODEL,
          max_tokens: 1024,
          thinking: { type: "adaptive" },
          output_config: { effort: EFFORT },
          system: systemPrompt(),
          tools: toolDefs,
          messages: this.history,
        };
        // Stream so the UI can start speaking before the full reply lands.
        const stream = this.client.messages.stream(
          params as unknown as Anthropic.MessageStreamParams,
        );
        stream.on("text", (delta: string) => cbs.onDelta?.(delta));
        const response = await stream.finalMessage();

        this.history.push({ role: "assistant", content: response.content });

        if (response.stop_reason === "tool_use") {
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const block of response.content) {
            if (block.type !== "tool_use") continue;
            const tool = toolByName.get(block.name);
            if (tool) {
              toolsUsed.push(tool.label);
              cbs.onTool?.(tool.label);
            }
            let output: string;
            try {
              output = tool
                ? await tool.run(block.input as Record<string, unknown>)
                : `Error: unknown tool '${block.name}'.`;
            } catch (err: any) {
              output = `Error running ${block.name}: ${err?.message ?? err}`;
            }
            results.push({ type: "tool_result", tool_use_id: block.id, content: output });
          }
          this.history.push({ role: "user", content: results });
          continue; // let Claude read the results and respond
        }

        // No more tools requested — extract the spoken text.
        const text = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join(" ")
          .trim();
        return { text: text || "Done.", toolsUsed: dedupe(toolsUsed) };
      }
      return { text: "That took more steps than I expected — let's try again.", toolsUsed: dedupe(toolsUsed) };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      return {
        text: `Sorry, I hit a problem: ${msg}`,
        toolsUsed: dedupe(toolsUsed),
        error: true,
      };
    }
  }
}

function dedupe(items: string[]): string[] {
  return [...new Set(items)];
}

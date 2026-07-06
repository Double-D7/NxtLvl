import Anthropic from "@anthropic-ai/sdk";
import { allTools, toolByName } from "./tools";
import * as google from "./google";
import type { JarvisReply } from "../shared/types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-opus-4-8";
const EFFORT = (process.env.JARVIS_EFFORT || "medium") as "low" | "medium" | "high";
const USER_NAME = process.env.JARVIS_USER_NAME || "";

function systemPrompt(): string {
  const googleStatus = google.isConfigured()
    ? "Google Calendar and Gmail are connected — use the calendar and email tools freely."
    : "Google Calendar and Gmail are NOT connected. If asked about calendar or " +
      "email, briefly tell the user those features need Google credentials in .env.";

  return [
    "You are Jarvis, a warm, concise, and capable voice assistant" +
      (USER_NAME ? ` for ${USER_NAME}.` : "."),
    "Your replies are read aloud, so keep them short, natural, and speakable —",
    "no markdown, no bullet symbols, no code blocks, no emoji. One or two",
    "sentences is usually right. Spell things out the way you'd say them.",
    "",
    "You can manage reminders and tasks, check the date and time, and (when",
    "connected) read the calendar, create events, and read and send email.",
    "Always resolve relative times (today, tomorrow, 'in an hour') by calling",
    "get_current_datetime before creating a reminder or event.",
    "",
    "Sending email is irreversible: read the recipient, subject, and body back",
    "to the user and get an explicit yes before calling send_email.",
    "",
    googleStatus,
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

  /** Process one user utterance and return Jarvis's spoken reply. */
  async ask(userText: string): Promise<JarvisReply> {
    const toolsUsed: string[] = [];
    this.history.push({ role: "user", content: userText });

    const toolDefs = allTools.map((t) => t.definition);

    try {
      // Manual agentic loop: keep going while Claude requests tools.
      for (let step = 0; step < 8; step++) {
        // `thinking: adaptive` and `output_config.effort` are valid for the
        // configured model but newer than the pinned SDK's types, so the params
        // object is cast when passed to messages.create.
        const params = {
          model: MODEL,
          max_tokens: 1024,
          thinking: { type: "adaptive" },
          output_config: { effort: EFFORT },
          system: systemPrompt(),
          tools: toolDefs,
          messages: this.history,
        };
        const response = (await this.client.messages.create(
          params as unknown as Anthropic.MessageCreateParamsNonStreaming,
        )) as Anthropic.Message;

        this.history.push({ role: "assistant", content: response.content });

        if (response.stop_reason === "tool_use") {
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const block of response.content) {
            if (block.type !== "tool_use") continue;
            const tool = toolByName.get(block.name);
            if (tool) toolsUsed.push(tool.label);
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

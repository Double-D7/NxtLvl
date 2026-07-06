import type { JarvisTool } from "./types";
import { datetimeTool } from "./datetime";
import { reminderTools } from "./reminders";
import { outlookTools } from "./outlook";

// The full set of tools Jarvis can call. Order is cosmetic.
// (Google Calendar/Gmail tools were retired in favour of Outlook/Microsoft 365.)
export const allTools: JarvisTool[] = [
  datetimeTool,
  ...reminderTools,
  ...outlookTools,
];

export const toolByName = new Map<string, JarvisTool>(
  allTools.map((t) => [t.definition.name, t]),
);

export type { JarvisTool };

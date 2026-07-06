import type { JarvisTool } from "./types";
import { datetimeTool } from "./datetime";
import { reminderTools } from "./reminders";
import { calendarTools } from "./calendar";
import { emailTools } from "./email";

// The full set of tools Jarvis can call. Order is cosmetic.
export const allTools: JarvisTool[] = [
  datetimeTool,
  ...reminderTools,
  ...calendarTools,
  ...emailTools,
];

export const toolByName = new Map<string, JarvisTool>(
  allTools.map((t) => [t.definition.name, t]),
);

export type { JarvisTool };

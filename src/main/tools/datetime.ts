import type { JarvisTool } from "./types";

// Gives Jarvis a reliable sense of "now" so it can reason about relative times
// like "tomorrow at 3pm" or "in 20 minutes". The model has no clock of its own.
export const datetimeTool: JarvisTool = {
  label: "Checking the time",
  definition: {
    name: "get_current_datetime",
    description:
      "Get the current local date and time. Call this whenever you need to " +
      "resolve relative times (today, tomorrow, tonight, 'in 2 hours', 'next " +
      "Monday') into an absolute date/time before creating a reminder or event.",
    input_schema: { type: "object", properties: {}, required: [] },
  },
  async run() {
    const now = new Date();
    return JSON.stringify({
      iso: now.toISOString(),
      local: now.toString(),
      weekday: now.toLocaleDateString(undefined, { weekday: "long" }),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  },
};

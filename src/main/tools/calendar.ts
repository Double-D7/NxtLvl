import * as google from "../google";
import type { JarvisTool } from "./types";

const CAL = "https://www.googleapis.com/calendar/v3/calendars/primary/events";

function guard(): string | null {
  if (!google.isConfigured()) return google.NOT_CONFIGURED_MSG;
  return null;
}

export const listEventsTool: JarvisTool = {
  label: "Checking your calendar",
  definition: {
    name: "list_calendar_events",
    description:
      "List upcoming events from the user's primary Google Calendar within a " +
      "time window. Provide ISO 8601 timestamps; resolve relative dates with " +
      "get_current_datetime first.",
    input_schema: {
      type: "object",
      properties: {
        time_min: { type: "string", description: "ISO 8601 start of window. Defaults to now." },
        time_max: { type: "string", description: "ISO 8601 end of window. Optional." },
        max_results: { type: "integer", description: "Max events to return (default 10)." },
      },
      required: [],
    },
  },
  async run(input) {
    const blocked = guard();
    if (blocked) return blocked;
    try {
      const params = new URLSearchParams({
        singleEvents: "true",
        orderBy: "startTime",
        timeMin: input.time_min ? new Date(String(input.time_min)).toISOString() : new Date().toISOString(),
        maxResults: String(input.max_results ?? 10),
      });
      if (input.time_max) params.set("timeMax", new Date(String(input.time_max)).toISOString());
      const data = await google.googleFetch(`${CAL}?${params}`);
      const items: any[] = data.items ?? [];
      if (items.length === 0) return "No events found in that window.";
      return items
        .map((e) => {
          const start = e.start?.dateTime || e.start?.date || "?";
          const when = new Date(start).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          return `${when} — ${e.summary || "(no title)"}${e.location ? ` @ ${e.location}` : ""} [${e.id}]`;
        })
        .join("\n");
    } catch (err: any) {
      return `Couldn't read the calendar: ${err.message}`;
    }
  },
};

export const createEventTool: JarvisTool = {
  label: "Adding a calendar event",
  definition: {
    name: "create_calendar_event",
    description:
      "Create an event on the user's primary Google Calendar. Provide ISO " +
      "8601 start/end times (resolve relative times with get_current_datetime).",
    input_schema: {
      type: "object",
      properties: {
        summary: { type: "string", description: "Event title." },
        start: { type: "string", description: "ISO 8601 start time." },
        end: { type: "string", description: "ISO 8601 end time. Defaults to 1h after start." },
        location: { type: "string", description: "Optional location." },
        description: { type: "string", description: "Optional notes." },
      },
      required: ["summary", "start"],
    },
  },
  async run(input) {
    const blocked = guard();
    if (blocked) return blocked;
    try {
      const start = new Date(String(input.start));
      if (isNaN(start.getTime())) return `Error: invalid start time '${input.start}'.`;
      const end = input.end ? new Date(String(input.end)) : new Date(start.getTime() + 60 * 60 * 1000);
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const body = {
        summary: String(input.summary),
        location: input.location ? String(input.location) : undefined,
        description: input.description ? String(input.description) : undefined,
        start: { dateTime: start.toISOString(), timeZone: tz },
        end: { dateTime: end.toISOString(), timeZone: tz },
      };
      const data = await google.googleFetch(CAL, { method: "POST", body: JSON.stringify(body) });
      const when = start.toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
      return `Event created: "${data.summary}" on ${when}.`;
    } catch (err: any) {
      return `Couldn't create the event: ${err.message}`;
    }
  },
};

export const calendarTools: JarvisTool[] = [listEventsTool, createEventTool];

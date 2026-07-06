import { Notification } from "electron";
import * as store from "../store";
import type { Reminder } from "../../shared/types";
import type { JarvisTool } from "./types";

const KEY = "reminders";

function load(): Reminder[] {
  return store.read<Reminder[]>(KEY, []);
}

function save(list: Reminder[]): void {
  store.write(KEY, list);
}

function newId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function formatReminder(r: Reminder): string {
  const when = r.dueAt
    ? new Date(r.dueAt).toLocaleString(undefined, {
        weekday: "short",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "no due time";
  return `[${r.id}] ${r.done ? "✓ " : ""}${r.text} (${when})`;
}

export const addReminderTool: JarvisTool = {
  label: "Setting a reminder",
  definition: {
    name: "add_reminder",
    description:
      "Create a reminder or to-do item. Provide an absolute due time in ISO " +
      "8601 format when the user specifies one (resolve relative times first " +
      "with get_current_datetime). Omit due_at for an undated task.",
    input_schema: {
      type: "object",
      properties: {
        text: { type: "string", description: "What to be reminded about." },
        due_at: {
          type: "string",
          description:
            "ISO 8601 timestamp for when it's due (e.g. 2026-07-06T15:00:00). " +
            "Omit for an undated task.",
        },
      },
      required: ["text"],
    },
  },
  async run(input) {
    const text = String(input.text ?? "").trim();
    if (!text) return "Error: reminder text is required.";
    const dueRaw = input.due_at ? String(input.due_at) : null;
    let dueAt: string | null = null;
    if (dueRaw) {
      const d = new Date(dueRaw);
      if (isNaN(d.getTime())) return `Error: '${dueRaw}' is not a valid date.`;
      dueAt = d.toISOString();
    }
    const list = load();
    const reminder: Reminder = {
      id: newId(),
      text,
      dueAt,
      createdAt: new Date().toISOString(),
      done: false,
      notified: false,
    };
    list.push(reminder);
    save(list);
    return `Reminder created: ${formatReminder(reminder)}`;
  },
};

export const listRemindersTool: JarvisTool = {
  label: "Checking your reminders",
  definition: {
    name: "list_reminders",
    description:
      "List saved reminders and tasks. By default returns only pending " +
      "(not-yet-done) items, soonest first.",
    input_schema: {
      type: "object",
      properties: {
        include_done: {
          type: "boolean",
          description: "Also include completed items. Default false.",
        },
      },
      required: [],
    },
  },
  async run(input) {
    const includeDone = input.include_done === true;
    let list = load();
    if (!includeDone) list = list.filter((r) => !r.done);
    if (list.length === 0) return "No reminders found.";
    list.sort((a, b) => {
      if (a.dueAt && b.dueAt) return a.dueAt.localeCompare(b.dueAt);
      if (a.dueAt) return -1;
      if (b.dueAt) return 1;
      return a.createdAt.localeCompare(b.createdAt);
    });
    return list.map(formatReminder).join("\n");
  },
};

export const completeReminderTool: JarvisTool = {
  label: "Completing a task",
  definition: {
    name: "complete_reminder",
    description:
      "Mark a reminder as done. Use list_reminders first to find its id if " +
      "you don't already know it.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The reminder id (e.g. 'a1b2c3d4')." },
      },
      required: ["id"],
    },
  },
  async run(input) {
    const id = String(input.id ?? "");
    const list = load();
    const r = list.find((x) => x.id === id);
    if (!r) return `Error: no reminder with id '${id}'.`;
    r.done = true;
    save(list);
    return `Marked done: ${r.text}`;
  },
};

export const deleteReminderTool: JarvisTool = {
  label: "Removing a reminder",
  definition: {
    name: "delete_reminder",
    description: "Permanently delete a reminder by its id.",
    input_schema: {
      type: "object",
      properties: {
        id: { type: "string", description: "The reminder id to delete." },
      },
      required: ["id"],
    },
  },
  async run(input) {
    const id = String(input.id ?? "");
    const list = load();
    const idx = list.findIndex((x) => x.id === id);
    if (idx === -1) return `Error: no reminder with id '${id}'.`;
    const [removed] = list.splice(idx, 1);
    save(list);
    return `Deleted: ${removed.text}`;
  },
};

export const reminderTools: JarvisTool[] = [
  addReminderTool,
  listRemindersTool,
  completeReminderTool,
  deleteReminderTool,
];

/** A compact snapshot for the dashboard: pending count and the next due item. */
export function summary(): { pending: number; next: string | null; nextAt: string | null } {
  const pending = load().filter((r) => !r.done);
  const dated = pending
    .filter((r) => r.dueAt)
    .sort((a, b) => (a.dueAt as string).localeCompare(b.dueAt as string));
  const next = dated[0] ?? pending[0] ?? null;
  return {
    pending: pending.length,
    next: next ? next.text : null,
    nextAt: next?.dueAt ?? null,
  };
}

/**
 * Polls for due reminders and fires a native desktop notification for each.
 * `onDue` lets the app also speak the reminder aloud. Returns a stop function.
 */
export function startReminderScheduler(onDue?: (r: Reminder) => void): () => void {
  const tick = () => {
    const list = load();
    let changed = false;
    const now = Date.now();
    for (const r of list) {
      if (r.done || r.notified || !r.dueAt) continue;
      if (new Date(r.dueAt).getTime() <= now) {
        r.notified = true;
        changed = true;
        if (Notification.isSupported()) {
          new Notification({ title: "Jarvis reminder", body: r.text }).show();
        }
        onDue?.(r);
      }
    }
    if (changed) save(list);
  };
  const handle = setInterval(tick, 30_000);
  tick(); // check once immediately on startup
  return () => clearInterval(handle);
}

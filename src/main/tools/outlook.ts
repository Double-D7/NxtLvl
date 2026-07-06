import * as ms from "../microsoft";
import type { JarvisTool } from "./types";

function guard(): string | null {
  if (!ms.isConfigured()) return ms.NOT_CONFIGURED_MSG;
  if (!ms.isConnected()) return ms.NOT_CONNECTED_MSG;
  return null;
}

export const searchEmailTool: JarvisTool = {
  label: "Checking your Outlook email",
  definition: {
    name: "search_email",
    description:
      "Read or search the user's Outlook (Microsoft 365) inbox. Returns each " +
      "message's sender, subject, received time, read/unread state, and a short " +
      "preview — not the full body. Use unread_only for 'new/unread' asks, or a " +
      "keyword/sender in `query` (Outlook search syntax like 'from:sarah' or " +
      "'invoice'). Then summarize the results for the user.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description:
            "Keyword or sender to search for, e.g. 'invoice' or 'from:sarah@acme.com'. Omit to list recent mail.",
        },
        unread_only: { type: "boolean", description: "Only unread messages. Default false." },
        max_results: { type: "integer", description: "How many messages (default 8, max 25)." },
      },
      required: [],
    },
  },
  async run(input) {
    const blocked = guard();
    if (blocked) return blocked;
    try {
      const max = Math.min(Number(input.max_results ?? 8), 25);
      const q = input.query ? String(input.query).trim() : "";
      const params = new URLSearchParams();
      params.set("$select", "subject,from,receivedDateTime,bodyPreview,isRead");
      params.set("$top", String(max));

      if (q) {
        // $search (KQL) can't be combined with $orderby; results come back by relevance.
        params.set("$search", `"${q.replace(/"/g, "")}"`);
      } else {
        params.set("$orderby", "receivedDateTime desc");
        if (input.unread_only === true) params.set("$filter", "isRead eq false");
      }

      const data = await ms.graphFetch(`/me/messages?${params.toString()}`);
      let items: any[] = data.value ?? [];
      // When searching, apply the unread filter client-side ($search + $filter don't mix).
      if (input.unread_only === true && q) items = items.filter((m) => !m.isRead);
      if (items.length === 0) return "No matching emails found.";

      return items
        .map((m) => {
          const addr = m.from?.emailAddress;
          const from = addr ? `${addr.name || ""} <${addr.address}>`.trim() : "(unknown sender)";
          const when = new Date(m.receivedDateTime).toLocaleString(undefined, {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          });
          const preview = (m.bodyPreview || "").replace(/\s+/g, " ").trim().slice(0, 220);
          return `${m.isRead ? "" : "● UNREAD  "}From: ${from}\nSubject: ${m.subject || "(no subject)"}\nWhen: ${when}\nPreview: ${preview}`;
        })
        .join("\n\n");
    } catch (e: any) {
      return `Couldn't read your Outlook email: ${e.message}`;
    }
  },
};

export const outlookTools: JarvisTool[] = [searchEmailTool];

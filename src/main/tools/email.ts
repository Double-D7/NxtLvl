import * as google from "../google";
import type { JarvisTool } from "./types";

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";

function guard(): string | null {
  if (!google.isConfigured()) return google.NOT_CONFIGURED_MSG;
  return null;
}

function header(headers: any[], name: string): string {
  return headers?.find((h) => h.name.toLowerCase() === name.toLowerCase())?.value ?? "";
}

export const searchEmailTool: JarvisTool = {
  label: "Checking your email",
  definition: {
    name: "search_email",
    description:
      "Search or list recent Gmail messages. Uses Gmail search syntax in " +
      "`query` (e.g. 'is:unread', 'from:alice newer_than:2d'). Returns senders, " +
      "subjects, dates, and a short snippet — not full bodies.",
    input_schema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Gmail search query. Default 'in:inbox'." },
        max_results: { type: "integer", description: "How many messages (default 5, max 10)." },
      },
      required: [],
    },
  },
  async run(input) {
    const blocked = guard();
    if (blocked) return blocked;
    try {
      const q = String(input.query ?? "in:inbox");
      const max = Math.min(Number(input.max_results ?? 5), 10);
      const list = await google.googleFetch(
        `${GMAIL}/messages?${new URLSearchParams({ q, maxResults: String(max) })}`,
      );
      const ids: any[] = list.messages ?? [];
      if (ids.length === 0) return "No matching emails found.";
      const rows: string[] = [];
      for (const { id } of ids) {
        const msg = await google.googleFetch(
          `${GMAIL}/messages/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
        );
        const h = msg.payload?.headers ?? [];
        rows.push(
          `From: ${header(h, "From")}\nSubject: ${header(h, "Subject")}\nDate: ${header(h, "Date")}\n` +
            `Snippet: ${msg.snippet ?? ""}`,
        );
      }
      return rows.join("\n\n");
    } catch (err: any) {
      return `Couldn't read email: ${err.message}`;
    }
  },
};

export const sendEmailTool: JarvisTool = {
  label: "Sending an email",
  definition: {
    name: "send_email",
    description:
      "Send an email from the user's Gmail account. IMPORTANT: sending is not " +
      "reversible — always read the recipient, subject, and body back to the " +
      "user and get an explicit 'yes, send it' before calling this tool.",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address." },
        subject: { type: "string", description: "Subject line." },
        body: { type: "string", description: "Plain-text body of the email." },
      },
      required: ["to", "subject", "body"],
    },
  },
  async run(input) {
    const blocked = guard();
    if (blocked) return blocked;
    try {
      const to = String(input.to);
      const subject = String(input.subject);
      const body = String(input.body);
      const raw = [
        `To: ${to}`,
        `Subject: ${subject}`,
        "Content-Type: text/plain; charset=UTF-8",
        "",
        body,
      ].join("\r\n");
      const encoded = Buffer.from(raw)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      await google.googleFetch(`${GMAIL}/messages/send`, {
        method: "POST",
        body: JSON.stringify({ raw: encoded }),
      });
      return `Email sent to ${to}.`;
    } catch (err: any) {
      return `Couldn't send the email: ${err.message}`;
    }
  },
};

export const emailTools: JarvisTool[] = [searchEmailTool, sendEmailTool];

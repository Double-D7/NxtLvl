// Self-contained Google OAuth 2.0 (loopback desktop flow) + REST helpers.
// Intentionally dependency-free: uses Node's http server, Electron's shell to
// open the consent screen, and global fetch for the API calls. Tokens are
// persisted so the user only authorizes once.
import { shell } from "electron";
import * as http from "http";
import * as crypto from "crypto";
import { AddressInfo } from "net";
import * as store from "./store";

const TOKEN_KEY = "google-tokens";

const SCOPES = [
  "https://www.googleapis.com/auth/calendar.events",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
].join(" ");

interface Tokens {
  access_token: string;
  refresh_token?: string;
  expiry: number; // epoch ms
}

export function isConfigured(): boolean {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function isConnected(): boolean {
  return Boolean(store.read<Tokens | null>(TOKEN_KEY, null)?.refresh_token);
}

/** Runs the browser consent flow once and stores the resulting tokens. */
async function authorize(): Promise<Tokens> {
  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;

  return new Promise<Tokens>((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, "127.0.0.1", async () => {
      const port = (server.address() as AddressInfo).port;
      const redirectUri = `http://127.0.0.1:${port}`;
      const state = crypto.randomBytes(16).toString("hex");

      const authUrl =
        "https://accounts.google.com/o/oauth2/v2/auth?" +
        new URLSearchParams({
          client_id: clientId,
          redirect_uri: redirectUri,
          response_type: "code",
          scope: SCOPES,
          access_type: "offline",
          prompt: "consent",
          state,
        }).toString();

      server.on("request", async (req, res) => {
        try {
          const url = new URL(req.url ?? "/", redirectUri);
          const code = url.searchParams.get("code");
          const returnedState = url.searchParams.get("state");
          if (!code || returnedState !== state) {
            res.end("Authorization failed. You can close this tab.");
            return;
          }
          res.end("Jarvis is now connected to Google. You can close this tab.");
          server.close();

          const resp = await fetch("https://oauth2.googleapis.com/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              code,
              client_id: clientId,
              client_secret: clientSecret,
              redirect_uri: redirectUri,
              grant_type: "authorization_code",
            }),
          });
          const data = (await resp.json()) as any;
          if (!resp.ok) return reject(new Error(data.error_description || "token exchange failed"));

          const tokens: Tokens = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expiry: Date.now() + data.expires_in * 1000,
          };
          store.write(TOKEN_KEY, tokens);
          resolve(tokens);
        } catch (err) {
          reject(err);
        }
      });

      await shell.openExternal(authUrl);
    });
    server.on("error", reject);
  });
}

async function refresh(tokens: Tokens): Promise<Tokens> {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: tokens.refresh_token!,
      grant_type: "refresh_token",
    }),
  });
  const data = (await resp.json()) as any;
  if (!resp.ok) throw new Error(data.error_description || "token refresh failed");
  const updated: Tokens = {
    access_token: data.access_token,
    refresh_token: tokens.refresh_token, // Google omits it on refresh
    expiry: Date.now() + data.expires_in * 1000,
  };
  store.write(TOKEN_KEY, updated);
  return updated;
}

async function validToken(): Promise<string> {
  let tokens = store.read<Tokens | null>(TOKEN_KEY, null);
  if (!tokens?.refresh_token) tokens = await authorize();
  if (Date.now() > tokens.expiry - 60_000) tokens = await refresh(tokens);
  return tokens.access_token;
}

/** Authenticated fetch against a Google API endpoint. Throws on HTTP error. */
export async function googleFetch(url: string, init: RequestInit = {}): Promise<any> {
  const token = await validToken();
  const resp = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await resp.text();
  const data = text ? JSON.parse(text) : {};
  if (!resp.ok) {
    throw new Error(data?.error?.message || `Google API error ${resp.status}`);
  }
  return data;
}

export const NOT_CONFIGURED_MSG =
  "Google isn't connected yet. To enable Calendar and Email, add " +
  "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to your .env file (see " +
  ".env.example for setup steps), then restart Jarvis.";

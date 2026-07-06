// Microsoft Graph auth (OAuth 2.0 Authorization Code + PKCE, public client) and
// a Graph fetch helper. Runs in the main process so tokens never touch the
// renderer. No client secret — a desktop public client uses PKCE + a loopback
// redirect. Sign-in is triggered explicitly from Settings, never mid-conversation.
import { shell } from "electron";
import * as http from "http";
import * as crypto from "crypto";
import { AddressInfo } from "net";
import * as store from "./store";

const TOKEN_KEY = "ms-tokens";
// Delegated scopes. Mail.Read for phase 1 (read + summarize). offline_access
// yields a refresh token; User.Read gives us the signed-in account for display.
const SCOPES = "offline_access User.Read Mail.Read";

interface Tokens {
  access_token: string;
  refresh_token?: string;
  expiry: number; // epoch ms
  account?: string;
}

function settings(): Record<string, any> {
  return store.read<Record<string, any>>("settings", {});
}

function config(): { clientId?: string; tenant: string } {
  const s = settings();
  return {
    clientId: process.env.MS_CLIENT_ID || s.msClientId,
    tenant: process.env.MS_TENANT_ID || s.msTenantId || "organizations",
  };
}

export function isConfigured(): boolean {
  return Boolean(config().clientId);
}

export function isConnected(): boolean {
  return Boolean(store.read<Tokens | null>(TOKEN_KEY, null)?.refresh_token);
}

export function account(): string | undefined {
  return store.read<Tokens | null>(TOKEN_KEY, null)?.account;
}

const b64url = (buf: Buffer) =>
  buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

function authEndpoint(kind: "authorize" | "token"): string {
  return `https://login.microsoftonline.com/${config().tenant}/oauth2/v2.0/${kind}`;
}

/** Runs the interactive sign-in once and stores the resulting tokens. */
async function authorize(): Promise<Tokens> {
  const { clientId } = config();
  if (!clientId) throw new Error("Microsoft app Client ID isn't set.");
  const verifier = b64url(crypto.randomBytes(32));
  const challenge = b64url(crypto.createHash("sha256").update(verifier).digest());
  const state = crypto.randomBytes(16).toString("hex");

  return new Promise<Tokens>((resolve, reject) => {
    const server = http.createServer();
    server.listen(0, "127.0.0.1", async () => {
      const port = (server.address() as AddressInfo).port;
      const redirectUri = `http://localhost:${port}`;
      const authUrl =
        authEndpoint("authorize") +
        "?" +
        new URLSearchParams({
          client_id: clientId,
          response_type: "code",
          redirect_uri: redirectUri,
          response_mode: "query",
          scope: SCOPES,
          state,
          code_challenge: challenge,
          code_challenge_method: "S256",
          prompt: "select_account",
        }).toString();

      server.on("request", async (req, res) => {
        try {
          const url = new URL(req.url ?? "/", redirectUri);
          const err = url.searchParams.get("error_description") || url.searchParams.get("error");
          if (err) {
            res.end("Sign-in failed. You can close this tab.");
            server.close();
            return reject(new Error(err));
          }
          const code = url.searchParams.get("code");
          if (!code || url.searchParams.get("state") !== state) {
            res.end("You can close this tab.");
            return;
          }
          res.end("Jarvis is now connected to Outlook. You can close this tab and return to the app.");
          server.close();

          const resp = await fetch(authEndpoint("token"), {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              client_id: clientId,
              grant_type: "authorization_code",
              code,
              redirect_uri: redirectUri,
              code_verifier: verifier,
              scope: SCOPES,
            }),
          });
          const data = (await resp.json()) as any;
          if (!resp.ok) return reject(new Error(data.error_description || "token exchange failed"));
          resolve({
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expiry: Date.now() + data.expires_in * 1000,
          });
        } catch (e) {
          reject(e);
        }
      });

      await shell.openExternal(authUrl);
    });
    server.on("error", reject);
  });
}

async function refresh(t: Tokens): Promise<Tokens> {
  const { clientId } = config();
  const resp = await fetch(authEndpoint("token"), {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId!,
      grant_type: "refresh_token",
      refresh_token: t.refresh_token!,
      scope: SCOPES,
    }),
  });
  const data = (await resp.json()) as any;
  if (!resp.ok) throw new Error(data.error_description || "token refresh failed");
  const updated: Tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || t.refresh_token,
    expiry: Date.now() + data.expires_in * 1000,
    account: t.account,
  };
  store.write(TOKEN_KEY, updated);
  return updated;
}

async function validToken(): Promise<string> {
  let t = store.read<Tokens | null>(TOKEN_KEY, null);
  if (!t?.refresh_token) throw new Error("Outlook isn't connected. Open Settings and click Connect Outlook.");
  if (Date.now() > t.expiry - 60_000) t = await refresh(t);
  return t.access_token;
}

/** Explicit connect flow (from the Settings "Connect Outlook" button). */
export async function connect(): Promise<{ connected: boolean; account?: string; error?: string }> {
  try {
    const t = await authorize();
    store.write(TOKEN_KEY, t); // store first so graphFetch can authenticate
    let acct: string | undefined;
    try {
      const me = await graphFetch("/me?$select=userPrincipalName,mail,displayName");
      acct = me.mail || me.userPrincipalName || me.displayName;
    } catch {
      /* profile is best-effort */
    }
    store.write(TOKEN_KEY, { ...t, account: acct });
    return { connected: true, account: acct };
  } catch (e: any) {
    return { connected: false, error: e?.message ?? String(e) };
  }
}

export function disconnect(): void {
  store.write(TOKEN_KEY, null);
}

/** Authenticated GET/POST against Microsoft Graph v1.0. Throws on HTTP error. */
export async function graphFetch(pathAndQuery: string, init: RequestInit = {}): Promise<any> {
  const token = await validToken();
  const resp = await fetch(`https://graph.microsoft.com/v1.0${pathAndQuery}`, {
    ...init,
    headers: {
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });
  const text = await resp.text();
  const data = text ? JSON.parse(text) : {};
  if (!resp.ok) throw new Error(data?.error?.message || `Microsoft Graph error ${resp.status}`);
  return data;
}

export const NOT_CONFIGURED_MSG =
  "Outlook isn't set up yet. Open the ⚙ Settings panel, enter your Microsoft app " +
  "Client ID and Tenant ID, then click Connect Outlook to sign in.";
export const NOT_CONNECTED_MSG =
  "Outlook isn't connected yet. Open ⚙ Settings and click Connect Outlook to sign in.";

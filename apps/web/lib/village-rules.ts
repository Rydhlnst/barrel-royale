// Village rules shared by the browser and the server: how often players report in, how long they count
// as present, and what the chat accepts. The chat is open text, so links, wallet addresses and the worst
// words are kept out here, and the server applies the same check before anything is stored.

export const VILLAGE = {
  /** How often a player sends their position: quicker while walking, slower when standing still. */
  tickMs: 1200,
  idleTickMs: 4000,
  /** A player is shown while they've reported within this window. */
  presentMs: 12_000,
  /** Stop reporting after this long without moving, so an idle tab doesn't keep a seat. */
  awayMs: 5 * 60_000,
  maxPlayers: 40,
  chatMax: 140,
  chatEveryMs: 3000,
  chatHistory: 30,
  /** How long a chat bubble stays over someone's head. */
  bubbleMs: 6000,
  sessionHours: 24,
  /** The village map in pixels, 40 × 28 tiles of 16 px; positions are clamped to it. */
  width: 640,
  height: 448,
};

/** The text a wallet signs to enter the village. The server rebuilds and checks it. */
export const villageMessage = (wallet: string, issued: string) => `Enter the Barrel Royale village\n\nWallet: ${wallet.toLowerCase()}\nIssued: ${issued}`;

const LINK = /(https?:\/\/|www\.|t\.me\/|discord\.gg|\b[a-z0-9-]+\.(com|io|xyz|net|org|gg|me|app|co|fi|finance|link|site|top|info|vip|pro|ai|fun|lol|cc|to|so|sh)\b)/i;
const ADDRESS = /0x[0-9a-f]{20,}/i;
const BAD = ["fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot", "retard", "kontol", "memek", "anjing", "bangsat", "babi", "goblok", "tolol"];
const BAD_RE = new RegExp(`\\b(${BAD.join("|")})\\w*`, "gi");

export type ChatCheck = { ok: true; text: string } | { ok: false; error: string };

export function cleanChat(raw: string): ChatCheck {
  // control characters out, whitespace collapsed
  const text = raw.replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e]/g, "").replace(/\s+/g, " ").trim();
  if (!text) return { ok: false, error: "Type a message first." };
  if (text.length > VILLAGE.chatMax) return { ok: false, error: `Keep it under ${VILLAGE.chatMax} characters.` };
  if (LINK.test(text)) return { ok: false, error: "Links aren't allowed in the village chat." };
  if (ADDRESS.test(text)) return { ok: false, error: "Wallet and contract addresses aren't allowed in the village chat." };
  return { ok: true, text: text.replace(BAD_RE, (w) => "*".repeat(w.length)) };
}

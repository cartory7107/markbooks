/**
 * TavBook link-security heuristics (server only).
 *
 * Pure, dependency-free checks used by the automated link auditor to decide
 * whether an outgoing tool URL is clean, suspicious, parked or outright
 * malicious. No network access happens here — callers pass in what they
 * already fetched.
 */

export type SecurityStatus = "clean" | "suspicious" | "parked" | "malicious";

export interface SecurityVerdict {
  status: SecurityStatus;
  reasons: string[];
}

/** Registrar / domain-parking hosts: the destination is a for-sale page. */
const PARKING_HOSTS = [
  "sedoparking.com",
  "sedo.com",
  "bodis.com",
  "parkingcrew.net",
  "afternic.com",
  "dan.com",
  "hugedomains.com",
  "undeveloped.com",
  "above.com",
  "sav.com",
  "brandbucket.com",
  "squadhelp.com",
  "atom.com",
  "domainmarket.com",
  "buydomains.com",
  "namecheap.com",
  "godaddy.com",
  "porkbun.com",
  "cash4domain.com",
  "parklogic.com",
];

/** Phrases that appear on parked / expired-domain landing pages. */
const PARKED_BODY_MARKERS = [
  "this domain is for sale",
  "domain is for sale",
  "buy this domain",
  "the domain name is available",
  "domain parking",
  "parked free, courtesy of",
  "this webpage is parked",
  "inquire about this domain",
  "make an offer on this domain",
  "domain has expired",
  "this account has been suspended",
  "website coming soon! please check back",
];

/** Phrases typical of credential phishing or crypto scam pages. */
const PHISHING_BODY_MARKERS = [
  "connect your wallet to claim",
  "verify your wallet",
  "seed phrase",
  "private key to continue",
  "claim your airdrop",
  "double your crypto",
  "your account has been locked, verify",
  "enter your credit card to continue free trial",
];

/** Host fragments that indicate credential harvesting or scam funnels. */
const SUSPICIOUS_HOST_TOKENS = [
  "login-",
  "-login",
  "secure-",
  "-secure",
  "verify-",
  "-verify",
  "account-update",
  "wallet-connect",
  "airdrop",
  "giveaway",
  "free-gift",
  "claim-now",
  "crypto-double",
  "bonus-code",
  "mod-apk",
  "crack-download",
  "nulled",
];

/** TLDs with a very high abuse rate — enough on their own to warrant review. */
const HIGH_RISK_TLDS = [
  "zip",
  "mov",
  "tk",
  "ml",
  "ga",
  "cf",
  "gq",
  "xyz",
  "top",
  "click",
  "link",
  "rest",
  "cam",
  "quest",
  "cyou",
  "sbs",
  "lol",
  "beauty",
  "monster",
  "bar",
  "buzz",
];

/** Well-known AI / tech brands that scammers imitate. */
const PROTECTED_BRANDS = [
  "openai",
  "chatgpt",
  "anthropic",
  "claude",
  "midjourney",
  "stability",
  "huggingface",
  "perplexity",
  "gemini",
  "deepseek",
  "elevenlabs",
  "runway",
  "notion",
  "canva",
  "figma",
  "github",
  "google",
  "microsoft",
  "copilot",
  "nvidia",
  "grammarly",
  "jasper",
  "synthesia",
  "descript",
  "leonardo",
  "suno",
  "cursor",
  "replit",
  "tavbook",
];

/** Legitimate hosts (or host suffixes) for the protected brands above. */
const BRAND_OFFICIAL_HOSTS: Record<string, string[]> = {
  openai: ["openai.com", "chatgpt.com", "chat.openai.com", "sora.com"],
  chatgpt: ["openai.com", "chatgpt.com", "chat.openai.com"],
  anthropic: ["anthropic.com", "claude.com", "claude.ai"],
  claude: ["anthropic.com", "claude.com", "claude.ai"],
  midjourney: ["midjourney.com"],
  stability: ["stability.ai"],
  huggingface: ["huggingface.co"],
  perplexity: ["perplexity.ai"],
  gemini: ["google.com", "gemini.google.com", "deepmind.google", "ai.google"],
  deepseek: ["deepseek.com"],
  elevenlabs: ["elevenlabs.io"],
  runway: ["runwayml.com", "runway.com"],
  notion: ["notion.so", "notion.com"],
  canva: ["canva.com"],
  figma: ["figma.com"],
  github: ["github.com", "github.io", "githubusercontent.com"],
  google: ["google.com", "google.dev", "withgoogle.com", "google.co.uk"],
  microsoft: ["microsoft.com", "azure.com", "bing.com", "office.com"],
  copilot: ["github.com", "microsoft.com", "copilot.microsoft.com"],
  nvidia: ["nvidia.com"],
  grammarly: ["grammarly.com"],
  jasper: ["jasper.ai"],
  synthesia: ["synthesia.io"],
  descript: ["descript.com"],
  leonardo: ["leonardo.ai"],
  suno: ["suno.com", "suno.ai"],
  cursor: ["cursor.com", "cursor.sh"],
  replit: ["replit.com"],
  tavbook: ["tavbook.top"],
};

/** Strip protocol/www and return the lowercase hostname, or "" when invalid. */
export function hostOf(url: string): string {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return "";
    return u.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return "";
  }
}

/** Registrable-ish root label, e.g. "openai" from "sub.openai.co.uk". */
function rootLabel(host: string): string {
  const parts = host.split(".").filter(Boolean);
  if (parts.length < 2) return host;
  const twoLevelTld = /^(co|com|net|org|gov|edu|ac)\.[a-z]{2}$/.test(parts.slice(-2).join("."));
  const idx = twoLevelTld ? parts.length - 3 : parts.length - 2;
  return parts[Math.max(0, idx)] ?? host;
}

function tldOf(host: string): string {
  const parts = host.split(".");
  return (parts[parts.length - 1] ?? "").toLowerCase();
}

/** Levenshtein distance with early exit at `max`. */
function editDistance(a: string, b: string, max = 2): number {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const prev = new Array(b.length + 1).fill(0).map((_, i) => i);
  const curr = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
      rowMin = Math.min(rowMin, curr[j]);
    }
    if (rowMin > max) return max + 1;
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

/** True when the host imitates a protected brand without being an official host. */
export function detectTyposquat(host: string): string | null {
  if (!host) return null;
  const label = rootLabel(host).replace(/[^a-z0-9]/g, "");
  if (!label || label.length < 4) return null;

  for (const brand of PROTECTED_BRANDS) {
    const official = BRAND_OFFICIAL_HOSTS[brand] ?? [];
    const isOfficial = official.some((h) => host === h || host.endsWith(`.${h}`));
    if (isOfficial) return null;

    if (label === brand) return brand; // exact brand label on a non-official domain
    const dist = editDistance(label, brand, 2);
    if (dist > 0 && dist <= (brand.length >= 8 ? 2 : 1)) return brand;
    // brand embedded with scam-style decoration: "openai-login", "claude4free"
    if (label.includes(brand) && label.length <= brand.length + 10) return brand;
  }
  return null;
}

export interface SecurityInput {
  url: string;
  finalUrl?: string | null;
  /** First few KB of the response body, lowercased by the caller or here. */
  body?: string | null;
  httpsValid?: boolean | null;
  statusCode?: number | null;
}

/** Score a checked URL into a security verdict with human-readable reasons. */
export function assessSecurity(input: SecurityInput): SecurityVerdict {
  const reasons: string[] = [];
  let status: SecurityStatus = "clean";

  const escalate = (next: SecurityStatus) => {
    const rank: Record<SecurityStatus, number> = { clean: 0, suspicious: 1, parked: 2, malicious: 3 };
    if (rank[next] > rank[status]) status = next;
  };

  const origin = hostOf(input.url);
  const final = hostOf(input.finalUrl || input.url) || origin;
  const body = (input.body || "").slice(0, 20000).toLowerCase();

  if (!origin) {
    return { status: "suspicious", reasons: ["The stored link is not a valid http(s) URL."] };
  }

  // Raw IP address or punycode host
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(origin)) {
    reasons.push("The link points at a raw IP address instead of a domain name.");
    escalate("suspicious");
  }
  if (origin.startsWith("xn--") || origin.includes(".xn--")) {
    reasons.push("The domain uses punycode characters, a common look-alike trick.");
    escalate("suspicious");
  }

  // Parked / for-sale destination
  if (PARKING_HOSTS.some((h) => final === h || final.endsWith(`.${h}`))) {
    reasons.push(`The link now lands on a domain-parking page (${final}).`);
    escalate("parked");
  }
  if (PARKED_BODY_MARKERS.some((m) => body.includes(m))) {
    reasons.push("The destination page looks like a parked, expired or suspended domain.");
    escalate("parked");
  }

  // Phishing / scam signals
  if (PHISHING_BODY_MARKERS.some((m) => body.includes(m))) {
    reasons.push("The destination page contains wallet or credential harvesting language.");
    escalate("malicious");
  }
  const badToken = SUSPICIOUS_HOST_TOKENS.find((t) => origin.includes(t) || final.includes(t));
  if (badToken) {
    reasons.push(`The domain contains the high-risk pattern "${badToken}".`);
    escalate("suspicious");
  }

  // Brand impersonation
  const squat = detectTyposquat(final);
  if (squat) {
    reasons.push(`The domain closely imitates the "${squat}" brand without being an official domain.`);
    escalate("malicious");
  }

  // Risky TLD (only a soft signal on its own)
  const tld = tldOf(final);
  if (HIGH_RISK_TLDS.includes(tld)) {
    reasons.push(`The ".${tld}" domain extension has a high abuse rate and needs a manual look.`);
    escalate("suspicious");
  }

  // Excessive hyphenation / very long label
  const label = rootLabel(final);
  if ((label.match(/-/g) || []).length >= 4 || label.length > 40) {
    reasons.push("The domain name pattern looks machine-generated.");
    escalate("suspicious");
  }

  if (input.httpsValid === false) {
    reasons.push("The site could not complete a valid HTTPS handshake.");
    escalate("suspicious");
  }

  return { status, reasons };
}

/** Should a verdict remove the listing from public indexing immediately? */
export function shouldQuarantine(verdict: SecurityVerdict, consecutiveFailures: number): boolean {
  if (verdict.status === "malicious" || verdict.status === "parked") return true;
  return consecutiveFailures >= 3;
}

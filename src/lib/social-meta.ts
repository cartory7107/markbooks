/**
 * Social layer metadata for the TavBook AI feed.
 *
 * Every tool card is presented like a social post: a verified curator who
 * "posted" it, a relative post time, a like count and a save count.
 * All values are derived deterministically from the tool name, so the same
 * tool always shows the same poster/counts across renders, routes and devices
 * (no hydration mismatch, no database round-trip).
 */

import p01 from "@/assets/avatars/p01.webp";
import p02 from "@/assets/avatars/p02.jpg";
import p03 from "@/assets/avatars/p03.jpg";
import p04 from "@/assets/avatars/p04.png";
import p05 from "@/assets/avatars/p05.jpg";
import p06 from "@/assets/avatars/p06.webp";
import p07 from "@/assets/avatars/p07.webp";
import p08 from "@/assets/avatars/p08.jpg";

export interface Curator {
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
}

/** The verified curator accounts that publish tools on TavBook. */
export const CURATORS: Curator[] = [
  { name: "Mira Kovács", handle: "mira.k", avatar: p01, verified: true },
  { name: "Ai Signal", handle: "ai.signal", avatar: p02, verified: true },
  { name: "TA Team", handle: "ta.team", avatar: p03, verified: true },
  { name: "Knotwork Labs", handle: "knotwork", avatar: p04, verified: true },
  { name: "Orbit Studio", handle: "orbit.studio", avatar: p05, verified: true },
  { name: "Mentra", handle: "mentra", avatar: p06, verified: true },
  { name: "Memric", handle: "memric", avatar: p07, verified: true },
  { name: "Memric Labs", handle: "memric.labs", avatar: p08, verified: true },
];


/** Stable 32-bit string hash (FNV-1a) — same result on server and client. */
function hash(str: string, seed = 2166136261): number {
  let h = seed;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Non-uniform like buckets. Most tools get a modest number of likes, a few get
 * hundreds and a rare one breaks a thousand — so neighbouring cards never look
 * like a copy-pasted sequence.
 */
const LIKE_BUCKETS: Array<[number, number]> = [
  [3, 19],
  [8, 46],
  [12, 88],
  [21, 63],
  [34, 152],
  [47, 231],
  [66, 118],
  [92, 407],
  [140, 612],
  [188, 934],
  [310, 1480],
  [520, 2760],
];

export interface SocialMeta {
  curator: Curator;
  /** Minutes since the tool was "posted". */
  minutesAgo: number;
  /** Human relative time, e.g. "4h" or "3d". */
  postedAgo: string;
  likes: number;
  saves: number;
}

function relativeTime(minutes: number): string {
  if (minutes < 60) return `${Math.max(1, minutes)}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d`;
  if (minutes < 43200) return `${Math.floor(minutes / 10080)}w`;
  return `${Math.floor(minutes / 43200)}mo`;
}

/** Derive the social metadata for a tool (deterministic by name). */
export function getSocialMeta(name: string): SocialMeta {
  const h1 = hash(name);
  const h2 = hash(name, 0x811c9dc5 ^ 0x5bf03635);
  const h3 = hash(`${name}:saves`);

  const curator = CURATORS[h1 % CURATORS.length]!;

  // 12 minutes … ~9 months, weighted towards recent posts.
  const bias = (h2 % 1000) / 1000;
  const minutesAgo = Math.max(12, Math.floor(12 + Math.pow(bias, 2.2) * 390000));

  const bucket = LIKE_BUCKETS[h2 % LIKE_BUCKETS.length]!;
  const spread = bucket[1] - bucket[0];
  const likes = bucket[0] + ((h1 >>> 7) % (spread + 1));

  // Saves are always a small, irregular fraction of likes.
  const divisor = 4 + (h3 % 17);
  const saves = Math.max(1, Math.floor(likes / divisor) + (h3 % 5));

  return { curator, minutesAgo, postedAgo: relativeTime(minutesAgo), likes, saves };
}

/** Base like count for a tool, used as the starting point for user reactions. */
export function baseLikes(name: string): number {
  return getSocialMeta(name).likes;
}

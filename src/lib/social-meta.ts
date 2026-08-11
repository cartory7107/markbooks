/**
 * Social layer metadata for the TavBook AI feed.
 *
 * Every tool card is presented like a social post: a verified curator who
 * "posted" it, a relative post time, a like count and a save count.
 * All values are derived deterministically from the tool name, so the same
 * tool always shows the same poster/counts across renders, routes and devices
 * (no hydration mismatch, no database round-trip).
 */

import a01 from "@/assets/avatars/a01.jpg";
import a02 from "@/assets/avatars/a02.jpg";
import a03 from "@/assets/avatars/a03.jpg";
import a04 from "@/assets/avatars/a04.jpg";
import a05 from "@/assets/avatars/a05.jpg";
import a06 from "@/assets/avatars/a06.jpg";
import a07 from "@/assets/avatars/a07.jpg";
import a08 from "@/assets/avatars/a08.jpg";
import a09 from "@/assets/avatars/a09.jpg";
import a10 from "@/assets/avatars/a10.jpg";
import a11 from "@/assets/avatars/a11.jpg";
import a12 from "@/assets/avatars/a12.jpg";
import a13 from "@/assets/avatars/a13.jpg";
import a14 from "@/assets/avatars/a14.jpg";
import a15 from "@/assets/avatars/a15.jpg";

export interface Curator {
  name: string;
  handle: string;
  avatar: string;
  verified: boolean;
}

/** The 15 verified curator accounts that publish tools on TavBook. */
export const CURATORS: Curator[] = [
  { name: "Arnab Sen", handle: "arnab.sen", avatar: a01, verified: true },
  { name: "Mira Kovács", handle: "mira.k", avatar: a02, verified: true },
  { name: "Pixel Whiskers", handle: "pixel.whiskers", avatar: a03, verified: true },
  { name: "Tomas Novak", handle: "tomas.novak", avatar: a04, verified: true },
  { name: "Peony Lab", handle: "peony.lab", avatar: a05, verified: true },
  { name: "Hana Ito", handle: "hana.ito", avatar: a06, verified: true },
  { name: "Marcus Ade", handle: "marcus.ade", avatar: a07, verified: true },
  { name: "Rusty Paws", handle: "rusty.paws", avatar: a08, verified: true },
  { name: "Camila Ruiz", handle: "camila.ruiz", avatar: a09, verified: true },
  { name: "Anita Roy", handle: "anita.roy", avatar: a10, verified: true },
  { name: "Blue Feather", handle: "blue.feather", avatar: a11, verified: true },
  { name: "Erik Lund", handle: "erik.lund", avatar: a12, verified: true },
  { name: "Layla Hasan", handle: "layla.hasan", avatar: a13, verified: true },
  { name: "Sun Field", handle: "sun.field", avatar: a14, verified: true },
  { name: "Jomar Cruz", handle: "jomar.cruz", avatar: a15, verified: true },
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

import { RES, LINES } from "../data/gameData.js";

// Compact number formatting: <10 shows one decimal, then K/M/B/T suffixes.
export const fmt = (n) => {
  if (n < 1000) return n < 10 && n % 1 !== 0 ? n.toFixed(1) : Math.floor(n).toLocaleString();
  const u = ["K", "M", "B", "T"];
  let i = -1;
  while (n >= 1000 && i < u.length - 1) { n /= 1000; i++; }
  return n.toFixed(n < 100 ? 1 : 0) + u[i];
};

// Renders a cost/consumption map as "40 ⚙️ · 10 rifles" using resource icons
// where available, falling back to the producing line's equipment name.
export const costStr = (cost) => Object.entries(cost).map(([k, v]) => {
  const r = RES.find((r) => r.key === k);
  const line = LINES.find((l) => l.out === k);
  return `${fmt(v)} ${r ? r.icon : line ? line.outName.toLowerCase() : k}`;
}).join(" · ");

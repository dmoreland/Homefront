// Persistence adapter — tries window.storage (Claude artifact API) first,
// then falls back to localStorage (deployed web build).
// Two independent stores: the per-campaign save (cleared on reset/prestige) and
// the cross-run doctrine save (persists through resets — the meta-progression).
const SAVE_KEY = "home-front-save";
const DOCTRINE_KEY = "home-front-doctrines";

async function readKey(key) {
  try {
    if (typeof window !== "undefined" && window.storage) {
      const r = await window.storage.get(key);
      return r?.value ? JSON.parse(r.value) : null;
    }
  } catch { /* fall through */ }
  try { const raw = window.localStorage?.getItem(key); return raw ? JSON.parse(raw) : null; } catch { return null; }
}

async function writeKey(key, data) {
  const json = JSON.stringify(data);
  try { if (window.storage) { await window.storage.set(key, json); return; } } catch { /* fall through */ }
  try { window.localStorage?.setItem(key, json); } catch { /* ignore */ }
}

async function deleteKey(key) {
  try { if (window.storage) await window.storage.delete(key); } catch { /* ignore */ }
  try { window.localStorage?.removeItem(key); } catch { /* ignore */ }
}

export const saveStore = {
  load: () => readKey(SAVE_KEY),
  save: (data) => writeKey(SAVE_KEY, data),
  clear: () => deleteKey(SAVE_KEY),
  loadDoctrines: () => readKey(DOCTRINE_KEY),
  saveDoctrines: (data) => writeKey(DOCTRINE_KEY, data),
};

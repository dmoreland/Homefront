// Persistence adapter — tries window.storage (Claude artifact API) first,
// then falls back to localStorage (deployed web build).
const SAVE_KEY = "home-front-uk-save";

export const saveStore = {
  async load() {
    try {
      if (typeof window !== "undefined" && window.storage) {
        const r = await window.storage.get(SAVE_KEY);
        return r?.value ? JSON.parse(r.value) : null;
      }
    } catch { /* fall through */ }
    try { const raw = window.localStorage?.getItem(SAVE_KEY); return raw ? JSON.parse(raw) : null; } catch { return null; }
  },
  async save(data) {
    const json = JSON.stringify(data);
    try { if (window.storage) { await window.storage.set(SAVE_KEY, json); return; } } catch { /* fall through */ }
    try { window.localStorage?.setItem(SAVE_KEY, json); } catch { /* ignore */ }
  },
  async clear() {
    try { if (window.storage) await window.storage.delete(SAVE_KEY); } catch { /* ignore */ }
    try { window.localStorage?.removeItem(SAVE_KEY); } catch { /* ignore */ }
  },
};

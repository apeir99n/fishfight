import type { PlayerSave } from '../systems/EconomySystem';

const PLAYER_ID_KEY = 'fishfight.playerId';

// Server URL — override at build time via VITE_SAVE_SERVER, default to localhost:4567
const SERVER_URL =
  (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_SAVE_SERVER) ||
  'http://localhost:4567';

export function getOrCreatePlayerId(): string {
  try {
    const existing = localStorage.getItem(PLAYER_ID_KEY);
    if (existing) return existing;
    const id = 'p_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    localStorage.setItem(PLAYER_ID_KEY, id);
    return id;
  } catch {
    // localStorage unavailable — return ephemeral id
    return 'p_' + Math.random().toString(36).slice(2, 10);
  }
}

export async function fetchSave(playerId: string): Promise<PlayerSave | null> {
  try {
    const res = await fetch(`${SERVER_URL}/save/${encodeURIComponent(playerId)}`);
    if (!res.ok) return null;
    return (await res.json()) as PlayerSave;
  } catch {
    return null;
  }
}

/**
 * Fire-and-forget persist using the cached playerId. Safe to call often —
 * it's debounced so rapid consecutive calls collapse into a single POST.
 */
let persistTimer: ReturnType<typeof setTimeout> | null = null;
let latestSave: PlayerSave | null = null;
export function persistSave(save: PlayerSave, delayMs = 200): void {
  latestSave = save;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    const s = latestSave;
    persistTimer = null;
    latestSave = null;
    if (s) void pushSave(getOrCreatePlayerId(), s);
  }, delayMs);
}

export async function pushSave(playerId: string, save: PlayerSave): Promise<void> {
  try {
    await fetch(`${SERVER_URL}/save/${encodeURIComponent(playerId)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(save),
    });
  } catch {
    // swallow — offline-safe
  }
}

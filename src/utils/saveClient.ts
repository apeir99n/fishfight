import type { PlayerSave } from '../systems/EconomySystem';

// Local-only persistence. The save lives in localStorage under this key.
const SAVE_KEY = 'fishfight.save';

export function loadSave(): PlayerSave | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PlayerSave;
  } catch {
    // Missing localStorage or corrupt JSON — treat as "no save".
    return null;
  }
}

export function persistSave(save: PlayerSave): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  } catch {
    // localStorage unavailable or full — silently skip.
  }
}

export function clearSave(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch {
    // ignore
  }
}

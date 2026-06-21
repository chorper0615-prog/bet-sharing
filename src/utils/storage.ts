import { Bet } from '../types';

const KEY = 'betlog_bets_v2';

export function loadBets(): Bet[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Bet[];
  } catch {
    return [];
  }
}

export function saveBets(bets: Bet[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(bets));
  } catch {
    // storage full or unavailable
  }
}

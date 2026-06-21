import { describe, expect, it, vi } from 'vitest';
import type { Bet } from '../types';
import {
  cloneSharedBet,
  createBetShare,
  fetchBetShare,
  generateShareCode,
  isShareCode,
  updateBetShare,
} from './betSharing';

const sampleBet: Bet = {
  id: 'local-1',
  playerA: 'Alice',
  playerB: 'Bob',
  content: '明天下雨',
  stake: '一杯咖啡',
  claimA: '会下',
  claimB: '不会下',
  date: '2026-06-20',
  status: 'pending',
  createdAt: '2026-06-20T00:00:00.000Z',
  category: '生活',
};

describe('betSharing', () => {
  it('validates five digit share codes', () => {
    expect(isShareCode('12345')).toBe(true);
    expect(isShareCode('1234')).toBe(false);
    expect(isShareCode('123456')).toBe(false);
    expect(isShareCode('12a45')).toBe(false);
  });

  it('generates five digit share codes', () => {
    expect(generateShareCode()).toMatch(/^\d{5}$/);
  });

  it('retries duplicate generated codes before creating a share', async () => {
    const insert = vi
      .fn()
      .mockResolvedValueOnce({ error: { code: '23505', message: 'duplicate' } })
      .mockResolvedValueOnce({ error: null });
    const from = vi.fn(() => ({ insert }));
    const codeGenerator = vi.fn().mockReturnValueOnce('11111').mockReturnValueOnce('22222');

    const result = await createBetShare({ from }, sampleBet, { codeGenerator });

    expect(result).toBe('22222');
    expect(from).toHaveBeenCalledWith('bet_shares');
    expect(insert).toHaveBeenCalledTimes(2);
  });

  it('updates a shared bet row', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ update }));

    await updateBetShare({ from }, '12345', { ...sampleBet, status: 'settled', winner: 'A' });

    expect(from).toHaveBeenCalledWith('bet_shares');
    expect(update).toHaveBeenCalledWith({
      bet: expect.objectContaining({ status: 'settled', winner: 'A' }),
    });
    expect(eq).toHaveBeenCalledWith('code', '12345');
  });

  it('returns null when a share code does not exist', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const result = await fetchBetShare({ from }, '12345');

    expect(result).toBeNull();
  });

  it('clones an imported bet with a new local identity and share code', () => {
    const result = cloneSharedBet(sampleBet, {}, '54321');

    expect(result).toMatchObject({
      id: expect.any(String),
      playerA: 'Alice',
      playerB: 'Bob',
      status: 'pending',
      winner: undefined,
      settledAt: undefined,
      shareCode: '54321',
    });
  });
});

import { v4 as uuidv4 } from 'uuid';
import type { Bet } from '../types';

const SHARE_TABLE = 'bet_shares';
const MAX_CREATE_ATTEMPTS = 8;

type ShareError = {
  code?: string;
  message?: string;
};

type ShareRow = {
  code: string;
  bet: Bet;
  created_at?: string;
};

type SupabaseLike = {
  from: (table: string) => {
    insert?: (payload: unknown) => Promise<{ error: ShareError | null }>;
    select?: (columns: string) => {
      eq: (column: string, value: string) => {
        maybeSingle: () => Promise<{ data: ShareRow | null; error: ShareError | null }>;
      };
    };
    update?: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: ShareError | null }>;
    };
  };
};

type CreateOptions = {
  codeGenerator?: () => string;
};

type CloneOptions = {
  idGenerator?: () => string;
  now?: () => string;
};

export function isShareCode(code: string): boolean {
  return /^\d{5}$/.test(code.trim());
}

export function generateShareCode(): string {
  return String(Math.floor(Math.random() * 100000)).padStart(5, '0');
}

export async function createBetShare(
  client: SupabaseLike,
  bet: Bet,
  options: CreateOptions = {},
): Promise<string> {
  const table = client.from(SHARE_TABLE);
  if (!table.insert) {
    throw new Error('Supabase insert is unavailable.');
  }

  const codeGenerator = options.codeGenerator ?? generateShareCode;
  for (let attempt = 0; attempt < MAX_CREATE_ATTEMPTS; attempt += 1) {
    const code = codeGenerator();
    const { error } = await table.insert({ code, bet });
    if (!error) return code;
    if (error.code !== '23505') {
      throw new Error(error.message || '创建赌注分享失败。');
    }
  }

  throw new Error('共享码生成冲突过多，请稍后重试。');
}

export async function fetchBetShare(client: SupabaseLike, code: string): Promise<Bet | null> {
  const normalizedCode = code.trim();
  if (!isShareCode(normalizedCode)) {
    throw new Error('请输入 5 位数字共享码。');
  }

  const table = client.from(SHARE_TABLE);
  if (!table.select) {
    throw new Error('Supabase select is unavailable.');
  }

  const { data, error } = await table
    .select('code, bet, created_at')
    .eq('code', normalizedCode)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    throw new Error(error.message || '读取赌注分享失败。');
  }

  return data?.bet ?? null;
}

export async function updateBetShare(
  client: SupabaseLike,
  code: string,
  bet: Bet,
): Promise<void> {
  const table = client.from(SHARE_TABLE);
  if (!table.update) {
    throw new Error('Supabase update is unavailable.');
  }

  const { error } = await table.update({ bet }).eq('code', code);
  if (error) {
    throw new Error(error.message || '更新共享赌注失败。');
  }
}

export function cloneSharedBet(
  bet: Bet,
  options: CloneOptions = {},
  shareCode?: string,
): Bet {
  const idGenerator = options.idGenerator ?? uuidv4;
  const now = options.now ?? (() => new Date().toISOString());

  return {
    ...bet,
    id: idGenerator(),
    status: 'pending',
    winner: undefined,
    settledAt: undefined,
    createdAt: now(),
    shareCode,
  };
}

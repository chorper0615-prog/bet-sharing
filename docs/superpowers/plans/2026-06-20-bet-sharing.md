# Bet Sharing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add single-bet sharing through a five digit Supabase-backed code.

**Architecture:** Keep sharing logic in `src/utils/betSharing.ts` with a tiny Supabase client wrapper in `src/utils/supabase.ts`. React UI uses two focused modals: one for creating/copying a share code and one for entering/importing a code.

**Tech Stack:** Vite, React 19, TypeScript, Supabase JS client, Vitest.

---

## File Structure

- Modify `package.json` to add `@supabase/supabase-js`, `vitest`, and a `test` script.
- Create `src/utils/supabase.ts` for optional client initialization from `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
- Create `src/utils/betSharing.ts` for pure validation/import helpers and Supabase operations.
- Create `src/utils/betSharing.test.ts` for service tests.
- Create `src/components/ShareBetModal.tsx` for code creation and copying.
- Create `src/components/ImportShareModal.tsx` for entering a code, previewing the bet, and importing it.
- Modify `src/components/BetCard.tsx` to expose a share action.
- Modify `src/App.tsx` to open sharing/import modals and add imported bets to local state.

### Task 1: Dependencies And Tests

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/utils/betSharing.test.ts`

- [ ] **Step 1: Install dependencies**

Run: `npm install @supabase/supabase-js && npm install -D vitest`

Expected: `package.json` and `package-lock.json` include the new packages.

- [ ] **Step 2: Add test script**

Add this script to `package.json`:

```json
"test": "vitest run"
```

- [ ] **Step 3: Write failing tests**

Create `src/utils/betSharing.test.ts` with tests for:

```ts
import { describe, expect, it, vi } from 'vitest';
import type { Bet } from '../types';
import {
  cloneSharedBet,
  createBetShare,
  fetchBetShare,
  generateShareCode,
  isShareCode,
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
    expect(generateShareCode()).toMatch(/^\\d{5}$/);
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

  it('returns null when a share code does not exist', async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } });
    const eq = vi.fn(() => ({ maybeSingle }));
    const select = vi.fn(() => ({ eq }));
    const from = vi.fn(() => ({ select }));

    const result = await fetchBetShare({ from }, '12345');

    expect(result).toBeNull();
  });

  it('clones an imported bet with a new local identity', () => {
    const result = cloneSharedBet(sampleBet, {
      idGenerator: () => 'new-id',
      now: () => '2026-06-20T12:00:00.000Z',
    });

    expect(result).toMatchObject({
      id: 'new-id',
      playerA: 'Alice',
      playerB: 'Bob',
      status: 'pending',
      winner: undefined,
      settledAt: undefined,
      createdAt: '2026-06-20T12:00:00.000Z',
    });
  });
});
```

- [ ] **Step 4: Run tests to verify they fail**

Run: `npm test -- src/utils/betSharing.test.ts`

Expected: FAIL because `src/utils/betSharing.ts` does not exist yet.

### Task 2: Sharing Service

**Files:**
- Create: `src/utils/supabase.ts`
- Create: `src/utils/betSharing.ts`
- Test: `src/utils/betSharing.test.ts`

- [ ] **Step 1: Implement Supabase client wrapper**

Create `src/utils/supabase.ts` exporting `getSupabaseClient()` and `getSupabaseSetupMessage()`. It reads `import.meta.env.VITE_SUPABASE_URL` and `import.meta.env.VITE_SUPABASE_ANON_KEY`, returns `null` when either is missing, and never throws during local-only use.

- [ ] **Step 2: Implement sharing helpers and service**

Create `src/utils/betSharing.ts` with:

- `isShareCode(code: string): boolean`
- `generateShareCode(): string`
- `createBetShare(client, bet, options?): Promise<string>`
- `fetchBetShare(client, code): Promise<Bet | null>`
- `cloneSharedBet(bet, options?): Bet`

Use table name `bet_shares`; retry duplicate insert errors with code `23505` up to 8 times.

- [ ] **Step 3: Run tests to verify pass**

Run: `npm test -- src/utils/betSharing.test.ts`

Expected: PASS.

### Task 3: Sharing UI

**Files:**
- Create: `src/components/ShareBetModal.tsx`
- Create: `src/components/ImportShareModal.tsx`
- Modify: `src/components/BetCard.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `ShareBetModal`**

The modal accepts `bet`, `onClose`, creates a code via `createBetShare`, shows loading/error/success states, and has a copy button using `navigator.clipboard.writeText(code)`.

- [ ] **Step 2: Add `ImportShareModal`**

The modal accepts `onClose` and `onImport`. It validates a five digit code, calls `fetchBetShare`, previews the bet, then calls `onImport(cloneSharedBet(sharedBet))`.

- [ ] **Step 3: Add share action to cards**

Update `BetCardProps` with `onShare: (bet: Bet) => void`; add a small icon+text button near Edit/Delete that calls `onShare(bet)`.

- [ ] **Step 4: Wire modals in `App`**

Add state for `shareBet` and `showImportShare`. Pass `onShare` to cards. Add a button near search/filter controls for entering a shared code. On import, add the cloned bet to the top of the list and close the modal.

### Task 4: Verification

**Files:**
- All modified files

- [ ] **Step 1: Run unit tests**

Run: `npm test -- src/utils/betSharing.test.ts`

Expected: PASS.

- [ ] **Step 2: Run TypeScript/build verification**

Run: `npm run build`

Expected: PASS and production files generated.

- [ ] **Step 3: Start dev server**

Run: `npm run dev -- --host 127.0.0.1`

Expected: Vite serves the app locally.

- [ ] **Step 4: Browser smoke test**

Open the local URL, verify the list page renders, the import-share modal opens, and the share action appears on bet cards.

## Self-Review

The plan covers the spec requirements: Supabase storage, code generation, share lookup, import, local-only fallback, and focused tests. It avoids whole-list sharing and does not introduce accounts or unrelated persistence changes.

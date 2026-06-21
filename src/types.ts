export type BetStatus = 'pending' | 'settled';

export interface Bet {
  id: string;
  playerA: string;
  playerB: string;
  content: string;
  stake: string;
  claimA: string;
  claimB: string;
  date: string;
  deadline?: string;
  status: BetStatus;
  winner?: 'A' | 'B';
  settledAt?: string;
  createdAt: string;
  category?: string;
  shareCode?: string;
}

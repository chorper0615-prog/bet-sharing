import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, Loader2, Search, X } from 'lucide-react';
import type { Bet } from '../types';
import { cloneSharedBet, fetchBetShare, isShareCode } from '../utils/betSharing';
import { getSupabaseClient, getSupabaseSetupMessage } from '../utils/supabase';
import { playAdd, playClick } from '../utils/sounds';

interface ImportShareModalProps {
  onClose: () => void;
  onImport: (bet: Bet) => void;
}

export const ImportShareModal: React.FC<ImportShareModalProps> = ({ onClose, onImport }) => {
  const [code, setCode] = useState('');
  const [sharedBet, setSharedBet] = useState<Bet | null>(null);
  const [error, setError] = useState(getSupabaseSetupMessage() || '');
  const [loading, setLoading] = useState(false);

  const normalizedCode = code.trim();

  const handleLookup = async () => {
    if (!isShareCode(normalizedCode)) {
      setError('请输入 5 位数字共享码。');
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      setError(getSupabaseSetupMessage() || 'Supabase 未配置。');
      return;
    }

    setLoading(true);
    setError('');
    setSharedBet(null);

    try {
      const bet = await fetchBetShare(client, normalizedCode);
      if (!bet) {
        setError('没有找到这个共享码对应的赌注。');
        return;
      }
      setSharedBet(bet);
      playClick();
    } catch (err) {
      setError(err instanceof Error ? err.message : '读取赌注共享失败。');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = () => {
    if (!sharedBet) return;
    onImport(cloneSharedBet(sharedBet, {}, normalizedCode));
    playAdd();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-label="关闭导入弹窗" />
      <motion.div
        className="glass-card liquid-glass relative w-full max-w-[410px] rounded-[2rem] p-6"
        initial={{ scale: 0.92, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.92, y: 30, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      >
        <button
          className="absolute right-5 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/35 transition hover:text-white"
          onClick={onClose}
          aria-label="关闭"
        >
          <X size={15} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-blue-400/30 bg-blue-500/15 text-blue-200">
            <Download size={19} />
          </div>
          <div>
            <h2 className="text-base font-black tracking-[0.18em] text-white">输入共享码</h2>
            <p className="text-xs font-medium text-white/35">查看并导入别人共享的赌注</p>
          </div>
        </div>

        <div className="flex gap-2">
          <input
            className="glass-input min-w-0 flex-1 rounded-xl px-4 py-3 text-center text-xl font-black tracking-[0.2em]"
            inputMode="numeric"
            maxLength={5}
            placeholder="00000"
            value={code}
            onChange={event => {
              setCode(event.target.value.replace(/\D/g, '').slice(0, 5));
              setSharedBet(null);
              setError(getSupabaseSetupMessage() || '');
            }}
          />
          <button
            className="glass-btn flex h-[52px] w-[52px] items-center justify-center rounded-xl border border-blue-400/30 bg-blue-500/15 text-blue-200 disabled:opacity-50"
            onClick={handleLookup}
            disabled={loading || normalizedCode.length !== 5 || Boolean(getSupabaseSetupMessage())}
            aria-label="查找共享赌注"
          >
            {loading ? <Loader2 size={17} className="animate-spin" /> : <Search size={17} />}
          </button>
        </div>

        {sharedBet && (
          <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.03] p-4">
            <div className="mb-3 grid grid-cols-[1fr,auto,1fr] items-center gap-3">
              <span className="truncate text-sm font-bold text-violet-200">{sharedBet.playerA}</span>
              <span className="text-[10px] font-black text-white/25">VS</span>
              <span className="truncate text-right text-sm font-bold text-blue-200">{sharedBet.playerB}</span>
            </div>
            <p className="break-all text-sm leading-relaxed text-white/75">{sharedBet.content}</p>
            <p className="mt-3 text-xs font-bold text-amber-300">赌注：{sharedBet.stake}</p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-violet-400/20 bg-violet-500/10 p-3">
                <p className="mb-1 text-xs font-bold text-violet-200">{sharedBet.playerA}</p>
                <p className="text-xs leading-relaxed text-white/55">{sharedBet.claimA}</p>
              </div>
              <div className="rounded-xl border border-blue-400/20 bg-blue-500/10 p-3">
                <p className="mb-1 text-xs font-bold text-blue-200">{sharedBet.playerB}</p>
                <p className="text-xs leading-relaxed text-white/55">{sharedBet.claimB}</p>
              </div>
            </div>
            <button
              className="glass-btn mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-emerald-500 py-3 text-sm font-black text-white"
              onClick={handleImport}
            >
              <Download size={16} />
              导入到我的赌注
            </button>
          </div>
        )}

        {error && (
          <p className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-xs leading-relaxed text-red-200">
            {error}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
};

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Copy, Loader2, Share2, X } from 'lucide-react';
import type { Bet } from '../types';
import { createBetShare } from '../utils/betSharing';
import { getSupabaseClient, getSupabaseSetupMessage } from '../utils/supabase';
import { playClick } from '../utils/sounds';

interface ShareBetModalProps {
  bet: Bet;
  onClose: () => void;
  onShared?: (code: string, betId: string) => void;
}

export const ShareBetModal: React.FC<ShareBetModalProps> = ({ bet, onClose, onShared }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState(getSupabaseSetupMessage() || '');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    const client = getSupabaseClient();
    if (!client) {
      setError(getSupabaseSetupMessage() || 'Supabase 未配置。');
      return;
    }

    setLoading(true);
    setError('');
    setCopied(false);

    try {
      const shareCode = await createBetShare(client, bet);
      setCode(shareCode);
      onShared?.(shareCode, bet.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : '创建赌注共享失败。');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!code) return;
    await navigator.clipboard.writeText(code);
    setCopied(true);
    playClick();
  };

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <button className="absolute inset-0 bg-black/65 backdrop-blur-sm" onClick={onClose} aria-label="关闭共享弹窗" />
      <motion.div
        className="glass-card liquid-glass relative w-full max-w-[390px] rounded-[2rem] p-6"
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
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-violet-400/30 bg-violet-500/15 text-violet-200">
            <Share2 size={19} />
          </div>
          <div>
            <h2 className="text-base font-black tracking-[0.18em] text-white">赌注共享</h2>
            <p className="text-xs font-medium text-white/35">生成 5 位码，让别人导入这条赌注</p>
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="truncate text-sm font-bold text-violet-200">{bet.playerA}</span>
            <span className="text-[10px] font-black text-white/25">VS</span>
            <span className="truncate text-right text-sm font-bold text-blue-200">{bet.playerB}</span>
          </div>
          <p className="line-clamp-2 break-all text-sm leading-relaxed text-white/70">{bet.content}</p>
          <p className="mt-3 text-xs font-bold text-amber-300">赌注：{bet.stake}</p>
        </div>

        {code ? (
          <div className="mt-5 rounded-2xl border border-emerald-400/25 bg-emerald-500/10 p-5 text-center">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-300/70">共享码</p>
            <div className="mb-4 text-4xl font-black tracking-[0.24em] text-white">{code}</div>
            <button
              className="glass-btn mx-auto flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-5 py-3 text-sm font-bold text-emerald-200"
              onClick={handleCopy}
            >
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? '已复制' : '复制共享码'}
            </button>
          </div>
        ) : (
          <button
            className="glass-btn mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 py-3.5 text-sm font-black text-white disabled:opacity-50"
            onClick={handleCreate}
            disabled={loading || Boolean(getSupabaseSetupMessage())}
          >
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />}
            {loading ? '正在生成...' : '生成赌注共享码'}
          </button>
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

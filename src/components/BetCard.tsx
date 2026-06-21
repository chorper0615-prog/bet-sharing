import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bet } from '../types';
import { Calendar, Clock, Edit2, RefreshCw, Share2, Trash2, Trophy, ChevronDown, ChevronUp } from 'lucide-react';
import { playDelete, playClick, playHover } from '../utils/sounds';
import { WinnerModal } from './WinnerModal';

interface BetCardProps {
  bet: Bet;
  onSettle: (id: string, winner: 'A' | 'B') => void;
  onEdit: (bet: Bet) => void;
  onDelete: (id: string) => void;
  onShare: (bet: Bet) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  '体育': 'bg-orange-500/20 border-orange-400/30 text-orange-300',
  '娱乐': 'bg-pink-500/20 border-pink-400/30 text-pink-300',
  '金融': 'bg-amber-500/20 border-amber-400/30 text-amber-300',
  '生活': 'bg-green-500/20 border-green-400/30 text-green-300',
  '科技': 'bg-blue-500/20 border-blue-400/30 text-blue-300',
  '政治': 'bg-red-500/20 border-red-400/30 text-red-300',
  '游戏': 'bg-violet-500/20 border-violet-400/30 text-violet-300',
  '其他': 'bg-gray-500/20 border-gray-400/30 text-gray-300',
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

export const BetCard: React.FC<BetCardProps> = ({ bet, onSettle, onEdit, onDelete, onShare }) => {
  const [expanded, setExpanded] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showWinner, setShowWinner] = useState(false);
  const [pendingWinner, setPendingWinner] = useState<'A' | 'B' | null>(null);
  const [settlingFor, setSettlingFor] = useState<'A' | 'B' | null>(null);

  const catColor = CATEGORY_COLORS[bet.category || '其他'] || CATEGORY_COLORS['其他'];

  const handleSettle = (side: 'A' | 'B') => {
    setSettlingFor(side);
    setPendingWinner(side);
    setTimeout(() => {
      onSettle(bet.id, side);
      setShowWinner(true);
      setSettlingFor(null);
    }, 300);
  };

  const isSettled = bet.status === 'settled';
  const winnerName = pendingWinner
    ? (pendingWinner === 'A' ? bet.playerA : bet.playerB)
    : (bet.winner === 'A' ? bet.playerA : bet.playerB);
  const loserName = pendingWinner
    ? (pendingWinner === 'A' ? bet.playerB : bet.playerA)
    : (bet.winner === 'A' ? bet.playerB : bet.playerA);

  return (
    <>
      <WinnerModal
        show={showWinner}
        winnerName={winnerName}
        loserName={loserName}
        content={bet.content}
        stake={bet.stake}
        onClose={() => setShowWinner(false)}
      />
      <motion.div
        layout
        className={`glass-card bet-card rounded-2xl overflow-hidden ${isSettled ? 'opacity-90' : ''}`}
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        whileHover={{ scale: isSettled ? 1.005 : 1.01 }}
      >
        {/* Top gradient line */}
        <div className={`h-0.5 w-full ${isSettled ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : 'bg-gradient-to-r from-violet-500 to-blue-500'} opacity-70`} />

        {/* Card header */}
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between gap-3">
            {/* Players vs display - Optimized for long names and mobile */}
            <div className="grid grid-cols-[1fr,auto,1fr] items-center gap-2 flex-1 min-w-0">
              {/* Player A */}
              <div className="flex items-center gap-1.5 min-w-0">
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  isSettled && bet.winner === 'A'
                    ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-300'
                    : isSettled && bet.winner === 'B'
                    ? 'bg-gray-500/20 border-gray-400/20 text-gray-400'
                    : 'bg-violet-500/20 border-violet-400/40 text-violet-300'
                }`}>
                  {bet.playerA[0]?.toUpperCase()}
                </div>
                <span className={`text-xs font-bold truncate ${
                  isSettled && bet.winner === 'A' ? 'text-emerald-300' :
                  isSettled && bet.winner === 'B' ? 'text-white/35 line-through' :
                  'text-violet-200'
                }`}>
                  {bet.playerA}
                </span>
              </div>

              <div className="text-[10px] text-white/20 font-black italic">VS</div>

              {/* Player B */}
              <div className="flex items-center gap-1.5 min-w-0 justify-end">
                <span className={`text-xs font-bold truncate text-right ${
                  isSettled && bet.winner === 'B' ? 'text-emerald-300' :
                  isSettled && bet.winner === 'A' ? 'text-white/35 line-through' :
                  'text-blue-200'
                }`}>
                  {bet.playerB}
                </span>
                <div className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold border ${
                  isSettled && bet.winner === 'B'
                    ? 'bg-emerald-500/30 border-emerald-400/60 text-emerald-300'
                    : isSettled && bet.winner === 'A'
                    ? 'bg-gray-500/20 border-gray-400/20 text-gray-400'
                    : 'bg-blue-500/20 border-blue-400/40 text-blue-300'
                }`}>
                  {bet.playerB[0]?.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Status badge */}
            <div className={`flex-shrink-0 chip border ${
              isSettled
                ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                : 'bg-amber-500/15 border-amber-400/30 text-amber-300'
            }`}>
              {isSettled ? '已结算' : '进行中'}
            </div>
          </div>

          {/* Content preview - fixed overflow */}
          <div className="mt-3">
            <p className="text-sm text-white/80 leading-relaxed line-clamp-2 break-all font-medium">
              {bet.content}
            </p>
          </div>

          {/* Meta row - responsive wrap */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 pb-3">
            <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium">
              <Calendar size={10} />
              {formatDate(bet.date)}
            </div>
            {bet.deadline && (
              <div className="flex items-center gap-1.5 text-[10px] text-white/40 font-medium">
                <Clock size={10} />
                {formatDate(bet.deadline)}
              </div>
            )}
            {bet.category && (
              <span className={`chip ${catColor} !py-0 !px-2 scale-90 origin-left`}>
                {bet.category}
              </span>
            )}
            <div className="flex items-center gap-1 text-[11px] text-amber-300 font-bold ml-auto bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/20">
              <span className="opacity-70 text-[9px]">馃幇</span> {bet.stake}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mx-4 h-px bg-white/5" />

        {/* Expandable details */}
        <div className="px-4 py-2">
          <button
            className="flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60 transition-colors w-full"
            onClick={() => { setExpanded(!expanded); playClick(); }}
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? '收起详情' : '查看双方立场'}
          </button>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div className="grid grid-cols-2 gap-3 mt-3 mb-2">
                  <div className={`rounded-xl p-3 border transition-all ${
                    isSettled && bet.winner === 'A'
                      ? 'bg-emerald-500/10 border-emerald-400/30'
                      : isSettled && bet.winner === 'B'
                      ? 'bg-white/3 border-white/5 opacity-40'
                      : 'bg-violet-500/10 border-violet-400/20'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs font-bold text-violet-300">{bet.playerA}</span>
                      {isSettled && bet.winner === 'A' && <Trophy size={11} className="text-amber-400" />}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{bet.claimA}</p>
                  </div>
                  <div className={`rounded-xl p-3 border transition-all ${
                    isSettled && bet.winner === 'B'
                      ? 'bg-emerald-500/10 border-emerald-400/30'
                      : isSettled && bet.winner === 'A'
                      ? 'bg-white/3 border-white/5 opacity-40'
                      : 'bg-blue-500/10 border-blue-400/20'
                  }`}>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span className="text-xs font-bold text-blue-300">{bet.playerB}</span>
                      {isSettled && bet.winner === 'B' && <Trophy size={11} className="text-amber-400" />}
                    </div>
                    <p className="text-xs text-white/60 leading-relaxed">{bet.claimB}</p>
                  </div>
                </div>

                {isSettled && bet.settledAt && (
                  <p className="text-xs text-white/25 pb-1">
                    已结算{formatDate(bet.settledAt)} · {winnerName} 胜，{loserName} 输                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4">
          {!isSettled ? (
            <div className="space-y-2">
              <p className="text-xs text-white/30 text-center mb-2 font-medium tracking-wide">— 宣布胜者 —</p>
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  className="glass-btn py-2.5 rounded-xl bg-violet-500/20 border border-violet-400/30 text-violet-200 text-sm font-semibold hover:bg-violet-500/35 transition-colors"
                  onClick={() => handleSettle('A')}
                  onHoverStart={() => playHover()}
                  whileTap={{ scale: 0.95 }}
                  disabled={settlingFor !== null}
                >
                  🏳 {bet.playerA} 胜                </motion.button>
                <motion.button
                  className="glass-btn py-2.5 rounded-xl bg-blue-500/20 border border-blue-400/30 text-blue-200 text-sm font-semibold hover:bg-blue-500/35 transition-colors"
                  onClick={() => handleSettle('B')}
                  onHoverStart={() => playHover()}
                  whileTap={{ scale: 0.95 }}
                  disabled={settlingFor !== null}
                >
                  🏳 {bet.playerB} 胜                </motion.button>
              </div>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-400/20"
            >
              <Trophy size={14} className="text-amber-400" />
              <span className="text-sm font-semibold text-emerald-300">
                {winnerName} 获胜！              </span>
            </motion.div>
          )}

          {/* Edit/Delete row */}
          <div className="flex gap-2 mt-2">
            <button
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-white/35 hover:text-blue-300 border border-white/5 hover:border-blue-400/20 transition-all"
              onClick={() => { onShare(bet); playClick(); }}
            >
              {bet.shareCode ? <RefreshCw size={11} className="text-emerald-400" /> : <Share2 size={11} />}
              {bet.shareCode ? <span className="text-emerald-400">已同步</span> : '赌注共享'}
            </button>
            {!isSettled && (
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-white/35 hover:text-white/70 border border-white/5 hover:border-white/15 transition-all"
                onClick={() => { onEdit(bet); playClick(); }}
              >
                    <Edit2 size={11} /> 编辑
              </button>
            )}
            {!confirmDelete ? (
              <button
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs text-white/35 hover:text-red-400/70 border border-white/5 hover:border-red-400/20 transition-all"
                onClick={() => { setConfirmDelete(true); playClick(); }}
              >
                    <Trash2 size={11} /> 删除
              </button>
            ) : (
              <div className="flex-1 flex gap-1">
                <button
                  className="flex-1 py-2 rounded-xl text-xs text-red-400 border border-red-400/30 bg-red-500/10 font-semibold"
                  onClick={() => { onDelete(bet.id); playDelete(); }}
                >
                    确认删除
                </button>
                <button
                  className="flex-1 py-2 rounded-xl text-xs text-white/40 border border-white/10"
                  onClick={() => setConfirmDelete(false)}
                >
                    取消
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
};

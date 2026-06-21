import React from 'react';
import { motion } from 'framer-motion';
import { Bet } from '../types';
import { Trophy, Clock } from 'lucide-react';

interface BetTimelineProps {
  bets: Bet[];
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00');
  return {
    year: d.getFullYear().toString(),
    monthDay: d.toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' }),
  };
}

export const BetTimeline: React.FC<BetTimelineProps> = ({ bets }) => {
  // Group bets by year
  const byYear = bets.reduce<Record<string, Bet[]>>((acc, bet) => {
    const year = bet.date.slice(0, 4);
    if (!acc[year]) acc[year] = [];
    acc[year].push(bet);
    return acc;
  }, {});

  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));

  if (bets.length === 0) return null;

  return (
    <div className="space-y-8">
      {years.map((year, yi) => (
        <motion.div
          key={year}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: yi * 0.08 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-violet-600/40 to-blue-500/40 border border-violet-400/30">
              <span className="text-sm font-bold text-violet-200">{year}</span>
            </div>
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-xs text-white/25">{byYear[year].length} 场</span>
          </div>

          <div className="space-y-2 pl-2">
            {byYear[year].map((bet, i) => {
              const { monthDay } = formatDate(bet.date);
              const isSettled = bet.status === 'settled';
              const winnerName = bet.winner === 'A' ? bet.playerA : bet.playerB;

              return (
                <motion.div
                  key={bet.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: yi * 0.08 + i * 0.04 }}
                  className="flex items-start gap-3 group"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center mt-1.5">
                    <div className={`w-2.5 h-2.5 rounded-full border-2 flex-shrink-0 ${
                      isSettled
                        ? 'border-emerald-400 bg-emerald-400/40'
                        : 'border-amber-400 bg-amber-400/40 animate-pulse'
                    }`} />
                    {i < byYear[year].length - 1 && (
                      <div className="w-px flex-1 bg-white/8 mt-1" style={{ minHeight: 16 }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs text-white/30">{monthDay}</span>
                      {isSettled ? (
                        <span className="chip bg-emerald-500/15 border border-emerald-400/25 text-emerald-300 text-xs">
                          <Trophy size={9} className="mr-1" />已结算
                        </span>
                      ) : (
                        <span className="chip bg-amber-500/15 border border-amber-400/25 text-amber-300 text-xs">
                          <Clock size={9} className="mr-1" />进行中
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/65 leading-relaxed">
                      <span className="font-semibold text-violet-300">{bet.playerA}</span>
                      <span className="text-white/30 mx-1">vs</span>
                      <span className="font-semibold text-blue-300">{bet.playerB}</span>
                      <span className="text-white/35 mx-1.5">·</span>
                      <span className="text-white/50 text-xs">{bet.content.slice(0, 40)}{bet.content.length > 40 ? '...' : ''}</span>
                    </p>
                    {isSettled && (
                      <p className="text-xs text-emerald-400/70 mt-0.5">🏆 {winnerName} 获胜</p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Bet } from '../types';
import { Trophy, TrendingUp, Clock, BarChart2 } from 'lucide-react';

interface StatsPanelProps {
  bets: Bet[];
}

interface PlayerStat {
  name: string;
  wins: number;
  losses: number;
  total: number;
  winRate: number;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({ bets }) => {
  const settled = bets.filter(b => b.status === 'settled');
  const pending = bets.filter(b => b.status === 'pending');

  const playerStats = useMemo<PlayerStat[]>(() => {
    const map = new Map<string, { wins: number; losses: number }>();
    settled.forEach(b => {
      const winner = b.winner === 'A' ? b.playerA : b.playerB;
      const loser = b.winner === 'A' ? b.playerB : b.playerA;
      if (!map.has(winner)) map.set(winner, { wins: 0, losses: 0 });
      if (!map.has(loser)) map.set(loser, { wins: 0, losses: 0 });
      map.get(winner)!.wins++;
      map.get(loser)!.losses++;
    });
    return Array.from(map.entries())
      .map(([name, { wins, losses }]) => ({
        name,
        wins,
        losses,
        total: wins + losses,
        winRate: wins / (wins + losses),
      }))
      .sort((a, b) => b.winRate - a.winRate || b.wins - a.wins);
  }, [bets]);

  const yearlyStats = useMemo(() => {
    const map = new Map<string, { total: number; settled: number }>();
    bets.forEach(b => {
      const year = b.date.slice(0, 4);
      if (!map.has(year)) map.set(year, { total: 0, settled: 0 });
      const s = map.get(year)!;
      s.total++;
      if (b.status === 'settled') s.settled++;
    });
    return Array.from(map.entries())
      .map(([year, stats]) => ({ year, ...stats }))
      .sort((a, b) => b.year.localeCompare(a.year));
  }, [bets]);

  const categoryStats = useMemo(() => {
    const map = new Map<string, number>();
    bets.forEach(b => {
      const cat = b.category || '其他';
      map.set(cat, (map.get(cat) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1]);
  }, [bets]);

  const StatCard = ({ icon, label, value, sub, color }: {
    icon: React.ReactNode;
    label: string;
    value: string | number;
    sub?: string;
    color: string;
  }) => (
    <motion.div
      className="glass-card rounded-2xl p-3.5 flex items-center gap-3 overflow-hidden"
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      <div className={`w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider truncate">{label}</p>
        <p className="text-lg font-black text-white truncate">{value}</p>
        {sub && <p className="text-[9px] text-white/20 font-medium truncate">{sub}</p>}
      </div>
    </motion.div>
  );

  if (bets.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center -mt-20">
        <div className="text-[130px] mb-6 leading-none">📊</div>
        <p className="text-white font-black text-2xl tracking-widest uppercase mb-3">多维洞察</p>
        <p className="text-white/25 text-sm font-medium">需通过真实赌局激活数据流</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview cards */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={<BarChart2 size={18} className="text-violet-300" />}
          label="总赌局数"
          value={bets.length}
          color="bg-violet-500/20"
        />
        <StatCard
          icon={<Trophy size={18} className="text-amber-300" />}
          label="已结算"
          value={settled.length}
          sub={`${pending.length} 进行中`}
          color="bg-amber-500/20"
        />
        <StatCard
          icon={<TrendingUp size={18} className="text-emerald-300" />}
          label="结算率"
          value={bets.length > 0 ? `${Math.round(settled.length / bets.length * 100)}%` : '0%'}
          color="bg-emerald-500/20"
        />
        <StatCard
          icon={<Clock size={18} className="text-blue-300" />}
          label="待结算"
          value={pending.length}
          color="bg-blue-500/20"
        />
      </div>

      {/* Player leaderboard */}
      {playerStats.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white/70 mb-4 flex items-center gap-2">
            <Trophy size={14} className="text-amber-400" /> 玩家战绩榜
          </h3>
          <div className="space-y-3">
            {playerStats.map((p, i) => (
              <motion.div
                key={p.name}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center gap-3"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  i === 0 ? 'bg-amber-500/30 text-amber-300 border border-amber-400/40' :
                  i === 1 ? 'bg-gray-400/20 text-gray-300 border border-gray-400/30' :
                  i === 2 ? 'bg-orange-700/30 text-orange-400 border border-orange-600/40' :
                  'bg-white/5 text-white/30 border border-white/10'
                }`}>
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-semibold text-white/80">{p.name}</span>
                    <span className="text-xs text-white/40">{p.wins}胜 {p.losses}负</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        p.winRate >= 0.7 ? 'bg-emerald-400' :
                        p.winRate >= 0.5 ? 'bg-blue-400' :
                        'bg-red-400'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${p.winRate * 100}%` }}
                      transition={{ duration: 0.8, delay: i * 0.05, ease: 'easeOut' }}
                    />
                  </div>
                </div>
                <span className={`text-xs font-bold w-10 text-right ${
                  p.winRate >= 0.7 ? 'text-emerald-400' :
                  p.winRate >= 0.5 ? 'text-blue-400' :
                  'text-red-400'
                }`}>
                  {Math.round(p.winRate * 100)}%
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Yearly breakdown */}
      {yearlyStats.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white/70 mb-4 flex items-center gap-2">
            <BarChart2 size={14} className="text-blue-400" /> 年度分布
          </h3>
          <div className="space-y-2">
            {yearlyStats.map((y, i) => (
              <motion.div
                key={y.year}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-center gap-3"
              >
                <span className="text-sm font-bold text-white/50 w-10">{y.year}</span>
                <div className="flex-1 h-5 bg-white/5 rounded-full overflow-hidden flex">
                  <motion.div
                    className="h-full bg-gradient-to-r from-violet-500 to-blue-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(y.settled / y.total) * 100}%` }}
                    transition={{ duration: 0.8, delay: i * 0.06 }}
                  />
                </div>
                <span className="text-xs text-white/40 w-16 text-right">{y.settled}/{y.total} 局</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Category breakdown */}
      {categoryStats.length > 0 && (
        <div className="glass-card rounded-2xl p-4">
          <h3 className="text-sm font-bold text-white/70 mb-4">分类统计</h3>
          <div className="flex flex-wrap gap-2">
            {categoryStats.map(([cat, count]) => (
              <div key={cat} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
                <span className="text-xs text-white/60 font-medium">{cat}</span>
                <span className="text-xs font-bold text-violet-300">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

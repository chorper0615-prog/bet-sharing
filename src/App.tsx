import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart2, Download, History, List, Search, SlidersHorizontal, Swords, X } from 'lucide-react';
import { Bet } from './types';
import { loadBets, saveBets } from './utils/storage';
import { playClick, playOpen, playTab } from './utils/sounds';
import { BetCard } from './components/BetCard';
import { BetForm } from './components/BetForm';
import { StatsPanel } from './components/StatsPanel';
import { BetTimeline } from './components/BetTimeline';
import { ShareBetModal } from './components/ShareBetModal';
import { ImportShareModal } from './components/ImportShareModal';
import { fetchBetShare, updateBetShare } from './utils/betSharing';
import { getSupabaseClient } from './utils/supabase';

type Tab = 'list' | 'timeline' | 'stats';
type FilterStatus = 'all' | 'pending' | 'settled';
type SortBy = 'date_desc' | 'date_asc' | 'created_desc';

const SORT_LABELS: Record<SortBy, string> = {
  date_desc: '日期 ↓',
  date_asc: '日期 ↑',
  created_desc: '最新创建',
};

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'list', label: '赌局', icon: <List size={14} /> },
  { id: 'timeline', label: '时间轴', icon: <History size={14} /> },
  { id: 'stats', label: '统计', icon: <BarChart2 size={14} /> },
];

function mergeSharedBet(local: Bet, remote: Bet): Bet {
  return {
    ...local,
    ...remote,
    id: local.id,
    shareCode: local.shareCode ?? remote.shareCode,
  };
}

export default function App() {
  const [bets, setBets] = useState<Bet[]>([]);
  const [tab, setTab] = useState<Tab>('list');
  const [showForm, setShowForm] = useState(false);
  const [editBet, setEditBet] = useState<Bet | null>(null);
  const [shareBet, setShareBet] = useState<Bet | null>(null);
  const [showImportShare, setShowImportShare] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date_desc');
  const [showFilters, setShowFilters] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBets(loadBets());
    const timer = window.setTimeout(() => setMounted(true), 100);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (mounted) saveBets(bets);
  }, [bets, mounted]);

  const handleSave = (bet: Bet) => {
    setBets(prev => {
      const exists = prev.find(b => b.id === bet.id);
      if (exists) return prev.map(b => (b.id === bet.id ? bet : b));
      return [bet, ...prev];
    });
    setShowForm(false);
    setEditBet(null);
  };

  const syncSharedBet = async (bet: Bet) => {
    if (!bet.shareCode) return;
    const client = getSupabaseClient();
    if (!client) return;
    try {
      await updateBetShare(client, bet.shareCode, bet);
    } catch {
      // keep local state; sync will retry on the polling tick
    }
  };

  const handleSettle = (id: string, winner: 'A' | 'B') => {
    setBets(prev =>
      prev.map(b => {
        if (b.id !== id) return b;
        const updated = {
          ...b,
          status: 'settled' as const,
          winner,
          settledAt: new Date().toISOString().slice(0, 10),
        };
        void syncSharedBet(updated);
        return updated;
      }),
    );
  };

  const handleEdit = (bet: Bet) => {
    setEditBet(bet);
    setShowForm(true);
    playOpen();
  };

  const handleDelete = (id: string) => {
    setBets(prev => prev.filter(b => b.id !== id));
  };

  const handleShareCreated = (code: string, betId: string) => {
    setBets(prev =>
      prev.map(b => (b.id === betId ? { ...b, shareCode: code } : b)),
    );
  };

  const handleImportSharedBet = (bet: Bet) => {
    setBets(prev => [bet, ...prev.filter(item => item.id !== bet.id)]);
    setShowImportShare(false);
  };

  const sharedCodesKey = useMemo(
    () =>
      [...new Set(bets.filter(b => b.shareCode).map(b => b.shareCode!))]
        .sort()
        .join('|'),
    [bets],
  );

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;

    const sharedCodes = sharedCodesKey ? sharedCodesKey.split('|') : [];
    if (sharedCodes.length === 0) return;

    let cancelled = false;

    const syncSharedStates = async () => {
      for (const code of sharedCodes) {
        if (cancelled) return;
        try {
          const remoteBet = await fetchBetShare(client, code);
          if (!remoteBet) continue;
          setBets(prev =>
            prev.map(local => {
              if (local.shareCode !== code) return local;
              if (
                local.status === remoteBet.status &&
                local.winner === remoteBet.winner &&
                local.settledAt === remoteBet.settledAt
              ) {
                return local;
              }
              return mergeSharedBet(local, remoteBet);
            }),
          );
        } catch {
          // ignore transient network failures; polling will retry
        }
      }
    };

    void syncSharedStates();
    const interval = window.setInterval(() => {
      void syncSharedStates();
    }, 5000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [sharedCodesKey]);

  const filtered = useMemo(() => {
    let result = [...bets];
    if (filterStatus !== 'all') result = result.filter(b => b.status === filterStatus);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(b =>
        b.playerA.toLowerCase().includes(q) ||
        b.playerB.toLowerCase().includes(q) ||
        b.content.toLowerCase().includes(q) ||
        b.stake.toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q),
      );
    }
    result.sort((a, b) => {
      if (sortBy === 'date_desc') return b.date.localeCompare(a.date);
      if (sortBy === 'date_asc') return a.date.localeCompare(b.date);
      return b.createdAt.localeCompare(a.createdAt);
    });
    return result;
  }, [bets, filterStatus, search, sortBy]);

  const pendingCount = bets.filter(b => b.status === 'pending').length;
  const settledCount = bets.filter(b => b.status === 'settled').length;

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      <div className="liquid-blob" style={{ width: '600px', height: '600px', background: 'radial-gradient(circle, #4c1d95 0%, transparent 70%)', top: '-200px', left: '-200px' }} />
      <div className="liquid-blob" style={{ width: '500px', height: '500px', background: 'radial-gradient(circle, #1e3a8a 0%, transparent 70%)', top: '20%', right: '-150px', animationDelay: '-5s' }} />
      <div className="liquid-blob" style={{ width: '400px', height: '400px', background: 'radial-gradient(circle, #831843 0%, transparent 70%)', bottom: '-100px', left: '10%', animationDelay: '-10s' }} />

      <div className="relative z-10 max-w-xl mx-auto px-5 py-4 pb-36 h-screen flex flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 flex-shrink-0"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <motion.div
                className="relative w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center"
                style={{ boxShadow: '0 4px 20px rgba(124,58,237,0.5)' }}
                whileHover={{ rotate: [0, -10, 10, 0], scale: 1.08 }}
                transition={{ duration: 0.4 }}
              >
                <Swords size={22} className="text-white" />
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-[#0a0a1a] text-[7px] flex items-center justify-center text-black font-black">
                  {bets.length > 9 ? '9+' : bets.length}
                </span>
              </motion.div>
              <div>
                <h1 className="text-xl font-black text-gradient leading-none">赌局录</h1>
                <p className="text-[11px] text-white/25 font-medium tracking-widest mt-0.5">BetLog · 见证每一场约定</p>
              </div>
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <motion.div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-amber-400/25 bg-amber-500/10"
                animate={{ opacity: pendingCount > 0 ? 1 : 0.4 }}
              >
                {pendingCount > 0 && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />}
                <span className="text-[11px] font-semibold text-amber-300">{pendingCount} 进行中</span>
              </motion.div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-emerald-400/20 bg-emerald-500/8">
                <span className="text-[11px] font-semibold text-emerald-300/80">{settledCount} 已结算</span>
              </div>
            </div>
          </div>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass-card rounded-[2rem] p-2.5 flex mb-8 flex-shrink-0"
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); playTab(); }}
              className={`relative flex-1 flex items-center justify-center gap-3 py-5 rounded-[1.5rem] text-[15px] font-black uppercase tracking-[0.15em] transition-all duration-300 ${
                tab === t.id ? 'text-white shadow-2xl' : 'text-white/25 hover:text-white/40'
              }`}
            >
              {tab === t.id && (
                <motion.div
                  layoutId="tab-bg"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/80 to-blue-500/80"
                  style={{ boxShadow: '0 4px 20px rgba(124,58,237,0.35)' }}
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {t.icon}
                {t.label}
              </span>
            </button>
          ))}
        </motion.div>

        <div className="flex-1">
          <AnimatePresence mode="wait">
            {tab === 'list' && (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.22 }}
              >
                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative">
                    <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
                    <input
                      className="glass-input w-full pl-9 pr-9 py-2.5 rounded-xl text-sm"
                      placeholder="搜索玩家、内容、赌注..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                    />
                    <AnimatePresence>
                      {search && (
                        <motion.button
                          initial={{ opacity: 0, scale: 0.5 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.5 }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                          onClick={() => setSearch('')}
                        >
                          <X size={13} />
                        </motion.button>
                      )}
                    </AnimatePresence>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    className={`px-3.5 rounded-xl border transition-all ${
                      showFilters
                        ? 'bg-violet-500/25 border-violet-400/50 text-violet-300'
                        : 'glass-input border-white/12 text-white/40 hover:text-white/65'
                    }`}
                    onClick={() => { setShowFilters(!showFilters); playClick(); }}
                  >
                    <SlidersHorizontal size={15} />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    className="px-3.5 rounded-xl border glass-input border-white/12 text-white/40 hover:text-blue-300 transition-all"
                    onClick={() => { setShowImportShare(true); playOpen(); }}
                    aria-label="输入赌注共享码"
                  >
                    <Download size={15} />
                  </motion.button>
                </div>

                <AnimatePresence>
                  {showFilters && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                      animate={{ opacity: 1, height: 'auto', marginBottom: 16 }}
                      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="glass-card rounded-2xl p-4 space-y-3.5">
                        <div>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">状态</p>
                          <div className="flex gap-2">
                            {(['all', 'pending', 'settled'] as FilterStatus[]).map(s => (
                              <button
                                key={s}
                                onClick={() => { setFilterStatus(s); playClick(); }}
                                className={`chip border text-xs font-semibold transition-all duration-200 ${
                                  filterStatus === s
                                    ? 'bg-violet-500/25 border-violet-400/50 text-violet-200'
                                    : 'bg-white/5 border-white/8 text-white/35 hover:bg-white/8'
                                }`}
                              >
                                {s === 'all' ? '全部' : s === 'pending' ? '进行中' : '已结算'}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">排序</p>
                          <div className="flex gap-2 flex-wrap">
                            {(Object.entries(SORT_LABELS) as [SortBy, string][]).map(([s, label]) => (
                              <button
                                key={s}
                                onClick={() => { setSortBy(s); playClick(); }}
                                className={`chip border text-xs font-semibold transition-all duration-200 ${
                                  sortBy === s
                                    ? 'bg-blue-500/25 border-blue-400/50 text-blue-200'
                                    : 'bg-white/5 border-white/8 text-white/35 hover:bg-white/8'
                                }`}
                              >
                                {label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {filtered.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex-1 flex flex-col items-center justify-center text-center -mt-20"
                  >
                    <motion.div
                      className="text-[130px] mb-6 leading-none select-none"
                      animate={{
                        rotateZ: [0, -5, 5, -5, 5, 0],
                        y: [0, -10, 0],
                      }}
                      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      🎲
                    </motion.div>
                    {bets.length === 0 ? (
                      <div className="flex flex-col items-center">
                        <h3 className="text-white font-black text-2xl tracking-widest uppercase mb-3">无局可寻</h3>
                        <p className="text-white/25 text-[13px] mb-12 max-w-[280px] leading-loose font-medium">
                          还没立下任何约定？
                          <br />
                          让每一次的打赌都有迹可循，由我见证
                        </p>
                        <motion.button
                          className="flex items-center justify-center gap-3 px-10 py-5 rounded-full bg-violet-500/10 border border-violet-400/20 text-violet-300/80 hover:text-white transition-all group"
                          whileHover={{ scale: 1.02, background: 'rgba(139, 92, 246, 0.2)' }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { setShowForm(true); playOpen(); }}
                        >
                          <Swords size={18} className="group-hover:rotate-12 transition-transform" />
                          <span className="font-black text-[14px] uppercase tracking-[0.15em]">立下第一个赌约</span>
                        </motion.button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <p className="text-white/40 font-black text-xl uppercase tracking-widest">未匹配内容</p>
                        <p className="text-white/20 text-xs mt-3">换个关键词再次搜索</p>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-3">
                      {filtered.map(bet => (
                        <BetCard
                          key={bet.id}
                          bet={bet}
                          onSettle={handleSettle}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                          onShare={setShareBet}
                        />
                      ))}
                    </div>
                  </AnimatePresence>
                )}
              </motion.div>
            )}

            {tab === 'timeline' && (
              <motion.div
                key="timeline"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="flex-1 flex flex-col min-h-0"
              >
                {bets.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center -mt-20">
                    <div className="text-[130px] mb-6 leading-none">📅</div>
                    <p className="text-white font-black text-2xl tracking-widest uppercase mb-3">时间长河</p>
                    <p className="text-white/25 text-sm font-medium">还没有任何历史足迹</p>
                  </div>
                ) : (
                  <div className="glass-card rounded-2xl p-5">
                    <h2 className="text-sm font-bold text-white/60 mb-5 flex items-center gap-2">
                      <History size={14} className="text-violet-400" />
                      完整赌局时间轴
                      <span className="ml-auto text-xs text-white/25 font-normal">{bets.length} 场总计</span>
                    </h2>
                    <BetTimeline bets={[...bets].sort((a, b) => b.date.localeCompare(a.date))} />
                  </div>
                )}
              </motion.div>
            )}

            {tab === 'stats' && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.22 }}
              >
                <StatsPanel bets={bets} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 flex justify-center pb-12 pt-10 pointer-events-none">
        <div className="pointer-events-auto">
          <motion.button
            className="flex items-center justify-center gap-5 px-14 py-6 rounded-full text-white font-black text-[14px] uppercase tracking-[0.25em] relative border border-white/10 overflow-hidden min-w-[260px]"
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(40px) saturate(200%)',
              WebkitBackdropFilter: 'blur(40px) saturate(200%)',
              boxShadow: '0 40px 80px -15px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.05)',
            }}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, type: 'spring', stiffness: 200, damping: 20 }}
            whileHover={{ scale: 1.03, background: 'rgba(255, 255, 255, 0.1)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => { setEditBet(null); setShowForm(true); playOpen(); }}
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-violet-600/10 via-transparent to-blue-500/10" />
            <motion.div
              animate={{ rotate: showForm ? 180 : 0, scale: showForm ? 1.2 : 1 }}
              className="relative z-10 w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-[0_8px_20px_rgba(124,58,237,0.4)] flex-shrink-0"
            >
              <Swords size={20} strokeWidth={2.5} />
            </motion.div>
            <span className="relative z-10 whitespace-nowrap">新建赌局</span>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {showForm && (
          <BetForm
            onClose={() => { setShowForm(false); setEditBet(null); playClick(); }}
            onSave={handleSave}
            editBet={editBet}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {shareBet && (
          <ShareBetModal
            bet={shareBet}
            onClose={() => { setShareBet(null); playClick(); }}
            onShared={handleShareCreated}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showImportShare && (
          <ImportShareModal
            onClose={() => { setShowImportShare(false); playClick(); }}
            onImport={handleImportSharedBet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

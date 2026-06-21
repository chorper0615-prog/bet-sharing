import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, FileText, DollarSign, Calendar, ChevronRight, Swords } from 'lucide-react';
import { Bet } from '../types';
import { playAdd, playClick, playOpen } from '../utils/sounds';
import { v4 as uuidv4 } from 'uuid';

interface BetFormProps {
  onClose: () => void;
  onSave: (bet: Bet) => void;
  editBet?: Bet | null;
}

const CATEGORIES = ['体育', '娱乐', '金融', '生活', '科技', '政治', '游戏', '其他'];

export const BetForm: React.FC<BetFormProps> = ({ onClose, onSave, editBet }) => {
  const [playerA, setPlayerA] = useState('');
  const [playerB, setPlayerB] = useState('');
  const [content, setContent] = useState('');
  const [stake, setStake] = useState('');
  const [claimA, setClaimA] = useState('');
  const [claimB, setClaimB] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('其他');
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    playOpen();
    if (editBet) {
      setPlayerA(editBet.playerA);
      setPlayerB(editBet.playerB);
      setContent(editBet.content);
      setStake(editBet.stake);
      setClaimA(editBet.claimA);
      setClaimB(editBet.claimB);
      setDate(editBet.date);
      setDeadline(editBet.deadline || '');
      setCategory(editBet.category || '其他');
    }
  }, []);

  const validate = () => {
    const e: Record<string, string> = {};
    if (step === 0) {
      if (!playerA.trim()) e.playerA = '请输入甲方名字';
      if (!playerB.trim()) e.playerB = '请输入乙方名字';
      if (playerA.trim() && playerB.trim() && playerA.trim() === playerB.trim()) e.playerB = '双方名字不能相同';
    }
    if (step === 1) {
      if (!content.trim()) e.content = '请描述打赌内容';
      if (!stake.trim()) e.stake = '请填写赌注';
    }
    if (step === 2) {
      if (!claimA.trim()) e.claimA = `请填写 ${playerA || '甲方'} 的预测`;
      if (!claimB.trim()) e.claimB = `请填写 ${playerB || '乙方'} 的预测`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (!validate()) return;
    playClick();
    setStep(s => s + 1);
  };

  const handleBack = () => {
    playClick();
    setStep(s => s - 1);
  };

  const handleSubmit = () => {
    if (!validate()) return;
    const bet: Bet = {
      id: editBet?.id || uuidv4(),
      playerA: playerA.trim(),
      playerB: playerB.trim(),
      content: content.trim(),
      stake: stake.trim(),
      claimA: claimA.trim(),
      claimB: claimB.trim(),
      date,
      deadline: deadline || undefined,
      category,
      status: editBet?.status || 'pending',
      winner: editBet?.winner,
      settledAt: editBet?.settledAt,
      createdAt: editBet?.createdAt || new Date().toISOString(),
    };
    playAdd();
    onSave(bet);
  };

  const steps = [
    { title: '双方信息', icon: <Users size={18} /> },
    { title: '赌局详情', icon: <FileText size={18} /> },
    { title: '立场声明', icon: <Swords size={18} /> },
    { title: '时间分类', icon: <Calendar size={18} /> },
  ];

  const inputClass = "glass-input w-full rounded-xl px-4 py-3 text-[16px] font-bold placeholder:text-white/20 focus:outline-none";
  const labelClass = "block text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 ml-1";
  const errorClass = "text-red-400 text-[10px] mt-1.5 ml-1";

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onClick={onClose}
      />

      <motion.div
        className="glass-card liquid-glass rounded-[3rem] w-full max-w-[min(92vw,440px)] relative mx-auto mt-16"
        style={{ maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}
        initial={{ scale: 0.9, opacity: 0, y: 60 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 60 }}
        transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      >
        {/* 4. Floating Header - Centered Above the Border */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-10 w-full">
          <div className="px-8 py-3 rounded-2xl bg-[#0a0a1a] border border-white/15 shadow-[0_15px_40px_rgba(0,0,0,0.6)]">
            <h2 className="text-[14px] font-black text-white tracking-[0.3em] uppercase whitespace-nowrap text-center">
              {editBet ? '编辑此局' : '立下赌约'}
            </h2>
          </div>
          <div className="px-3 py-1 rounded-full bg-violet-600 border border-violet-400/50 shadow-lg -mt-1">
            <span className="text-[9px] font-black uppercase tracking-widest text-white leading-none">Step {step + 1}</span>
          </div>
        </div>

        {/* Close Button - More discreet and positioned */}
        <button
          className="absolute top-6 right-8 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/20 hover:text-white/60 transition-all active:scale-90 z-10"
          onClick={onClose}
        >
          <X size={14} />
        </button>

        {/* Spacing for floating header */}
        <div className="pt-10 flex flex-col min-h-0">
          <div className="px-8 pb-4">
             <span className="text-[9px] text-white/20 font-bold uppercase tracking-[0.3em]">{steps[step].title}</span>
          </div>
        </div>

        {/* Progress Dots - More Minimal */}
        <div className="flex justify-center gap-2 px-6 mb-6">
          {steps.map((_, i) => (
            <div 
              key={i} 
              className={`h-1 rounded-full transition-all duration-500 ${
                i === step ? 'w-8 bg-violet-500' : i < step ? 'w-2 bg-violet-500/40' : 'w-2 bg-white/10'
              }`} 
            />
          ))}
        </div>

        {/* Form content - Scrollable area for small screens */}
        <div className="px-7 pb-8 overflow-y-auto flex-1 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="space-y-5">
                  <div className="relative">
                    <label className="text-[10px] font-black text-violet-400/60 uppercase tracking-[0.2em] mb-2 block ml-1">甲方 · Player A</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center flex-shrink-0 text-violet-400 font-black">A</div>
                      <div className="flex-1">
                        <input
                          className="glass-input w-full rounded-xl px-4 py-3 text-sm font-bold placeholder:text-white/20 focus:outline-none"
                          placeholder="输入甲方名字..."
                          value={playerA}
                          onChange={e => setPlayerA(e.target.value)}
                        />
                      </div>
                    </div>
                    {errors.playerA && <p className="text-red-400 text-[10px] mt-1.5 ml-14">{errors.playerA}</p>}
                  </div>

                  <div className="relative">
                    <label className="text-[10px] font-black text-blue-400/60 uppercase tracking-[0.2em] mb-2 block ml-1">乙方 · Player B</label>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400 font-black">B</div>
                      <div className="flex-1">
                        <input
                          className="glass-input w-full rounded-xl px-4 py-3 text-sm font-bold placeholder:text-white/20 focus:outline-none"
                          placeholder="输入乙方名字..."
                          value={playerB}
                          onChange={e => setPlayerB(e.target.value)}
                        />
                      </div>
                    </div>
                    {errors.playerB && <p className="text-red-400 text-[10px] mt-1.5 ml-14">{errors.playerB}</p>}
                  </div>
                </div>
                {/* Preview names */}
                {playerA && playerB && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-center gap-4 py-3 rounded-2xl bg-white/5 border border-white/10"
                  >
                    <span className="font-bold text-violet-300">{playerA}</span>
                    <span className="text-2xl">⚔️</span>
                    <span className="font-bold text-blue-300">{playerB}</span>
                  </motion.div>
                )}
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <label className={labelClass}>打赌内容</label>
                  <textarea
                    className={`${inputClass} h-28 resize-none`}
                    placeholder="描述这场赌局的内容..."
                    value={content}
                    onChange={e => setContent(e.target.value)}
                  />
                  {errors.content && <p className={errorClass}>{errors.content}</p>}
                </div>
                <div>
                  <label className={labelClass}>赌注 · Stake</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-400" />
                    <input
                      className={`${inputClass} pl-9`}
                      placeholder="例：请吃饭、100元..."
                      value={stake}
                      onChange={e => setStake(e.target.value)}
                    />
                  </div>
                  {errors.stake && <p className={errorClass}>{errors.stake}</p>}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div>
                  <label className={labelClass}>
                    <span className="text-violet-400">{playerA}</span> 的预测/立场
                  </label>
                  <textarea
                    className={`${inputClass} h-20 resize-none`}
                    placeholder={`${playerA} 认为...`}
                    value={claimA}
                    onChange={e => setClaimA(e.target.value)}
                  />
                  {errors.claimA && <p className={errorClass}>{errors.claimA}</p>}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-px bg-white/10" />
                  <span className="text-xs text-white/30 font-medium">VS</span>
                  <div className="flex-1 h-px bg-white/10" />
                </div>
                <div>
                  <label className={labelClass}>
                    <span className="text-blue-400">{playerB}</span> 的预测/立场
                  </label>
                  <textarea
                    className={`${inputClass} h-20 resize-none`}
                    placeholder={`${playerB} 认为...`}
                    value={claimB}
                    onChange={e => setClaimB(e.target.value)}
                  />
                  {errors.claimB && <p className={errorClass}>{errors.claimB}</p>}
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.25 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>打赌日期</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={date}
                      onChange={e => setDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>截止日期 (可选)</label>
                    <input
                      type="date"
                      className={inputClass}
                      value={deadline}
                      onChange={e => setDeadline(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className={labelClass}>分类标签</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => { setCategory(cat); playClick(); }}
                        className={`chip border transition-all duration-200 ${
                          category === cat
                            ? 'bg-violet-500/30 border-violet-400/60 text-violet-200'
                            : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <button
                onClick={handleBack}
                className="glass-btn flex-1 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm font-medium"
              >
                返回
              </button>
            )}
            {step < steps.length - 1 ? (
              <button
                onClick={handleNext}
                className="glass-btn flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-blue-500 text-white text-sm font-semibold flex items-center justify-center gap-2"
              >
                下一步 <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                className="glass-btn flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 via-blue-500 to-pink-500 text-white text-sm font-semibold"
              >
                {editBet ? '保存修改' : '🤝 立下赌约'}
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

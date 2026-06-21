import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { playWin } from '../utils/sounds';
import { Confetti } from './Confetti';

interface WinnerModalProps {
  show: boolean;
  winnerName: string;
  loserName: string;
  content: string;
  stake: string;
  onClose: () => void;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  show, winnerName, loserName, content, stake, onClose
}) => {
  useEffect(() => {
    if (show) {
      playWin();
      const t = setTimeout(onClose, 5000);
      return () => clearTimeout(t);
    }
  }, [show]);

  return (
    <>
      <Confetti active={show} />
      <AnimatePresence>
        {show && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="absolute inset-0 bg-black/70 backdrop-blur-md"
              onClick={onClose}
            />
            <motion.div
              className="relative glass-card rounded-3xl p-8 max-w-sm w-full text-center overflow-hidden"
              initial={{ scale: 0.6, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.7, opacity: 0, y: 30 }}
              transition={{ type: 'spring', stiffness: 280, damping: 22 }}
            >
              {/* Gold gradient line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400" />

              {/* Close */}
              <button
                className="absolute top-4 right-4 text-white/30 hover:text-white/60 transition-colors"
                onClick={onClose}
              >
                <X size={16} />
              </button>

              {/* Trophy icon */}
              <motion.div
                className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400/30 to-yellow-500/20 border border-amber-400/40 flex items-center justify-center mx-auto mb-5"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(251,191,36,0.3)',
                    '0 0 50px rgba(251,191,36,0.6)',
                    '0 0 20px rgba(251,191,36,0.3)',
                  ]
                }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                <motion.div
                  animate={{ rotateY: [0, 360] }}
                  transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity, repeatDelay: 1 }}
                >
                  <Trophy size={36} className="text-amber-400" />
                </motion.div>
              </motion.div>

              <motion.h2
                className="text-2xl font-black text-gradient mb-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                🎉 胜负已分！
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <p className="text-3xl font-black text-white mt-4 mb-1">{winnerName}</p>
                <p className="text-sm text-emerald-400 font-semibold mb-4">获得本场胜利 👑</p>

                <div className="h-px bg-white/8 my-4" />

                <p className="text-xs text-white/30 mb-1">赌局内容</p>
                <p className="text-sm text-white/60 leading-relaxed mb-4">{content}</p>

                <div className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-amber-500/10 border border-amber-400/25">
                  <span className="text-xs text-white/40">赌注</span>
                  <span className="text-sm font-bold text-amber-300">🎰 {stake}</span>
                  <span className="text-xs text-white/30">→</span>
                  <span className="text-sm font-bold text-red-300/70 line-through">{loserName}</span>
                  <span className="text-xs text-white/30">认输</span>
                </div>
              </motion.div>

              {/* Auto close bar */}
              <motion.div
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-violet-500 to-amber-400"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 5, ease: 'linear' }}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

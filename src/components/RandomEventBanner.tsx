import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Zap } from 'lucide-react';
import { RandomEvent } from '@/hooks/useRandomEvent';

interface RandomEventBannerProps {
  activeEvent: RandomEvent | null;
  timeRemaining: number;
  nextEventIn: number | null;
}

export function RandomEventBanner({ 
  activeEvent, 
  timeRemaining, 
  nextEventIn 
}: RandomEventBannerProps) {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    return `${secs}s`;
  };

  return (
    <div className="w-full">
      <AnimatePresence mode="wait">
        {activeEvent ? (
          <motion.div
            key={activeEvent.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20 }}
            className="relative overflow-hidden rounded-xl p-4"
            style={{
              background: `linear-gradient(135deg, ${activeEvent.color}20, ${activeEvent.color}40)`,
              border: `2px solid ${activeEvent.color}80`,
              boxShadow: `0 0 30px ${activeEvent.color}30`,
            }}
          >
            {/* Animated background pulse */}
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  `radial-gradient(circle at 20% 50%, ${activeEvent.color} 0%, transparent 50%)`,
                  `radial-gradient(circle at 80% 50%, ${activeEvent.color} 0%, transparent 50%)`,
                  `radial-gradient(circle at 20% 50%, ${activeEvent.color} 0%, transparent 50%)`,
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <motion.span 
                  className="text-3xl"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                >
                  {activeEvent.icon}
                </motion.span>
                <div>
                  <h3 className="font-display font-bold text-lg" style={{ color: activeEvent.color }}>
                    {activeEvent.name}
                  </h3>
                  <p className="text-sm text-foreground/80">
                    Revenus <span className="font-bold" style={{ color: activeEvent.color }}>
                      x{activeEvent.multiplier}
                    </span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background/50">
                <Clock className="w-4 h-4" style={{ color: activeEvent.color }} />
                <span className="font-mono font-bold text-lg" style={{ color: activeEvent.color }}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 rounded-full bg-background/30 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: activeEvent.color }}
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: activeEvent.duration, ease: 'linear' }}
              />
            </div>
          </motion.div>
        ) : nextEventIn !== null ? (
          <motion.div
            key="waiting"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary/50 border border-border"
          >
            <Zap className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Prochain événement dans <span className="font-mono font-semibold text-foreground">{formatTime(nextEventIn)}</span>
            </span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { Card } from '../types';
import { Play } from 'lucide-react';

interface CardViewProps {
  card: Card | null;
  faceDown?: boolean;
  className?: string;
  onClick?: () => void;
  key?: string | number;
}

export default function CardView({ card, faceDown = false, className, onClick }: CardViewProps) {
  if (!card) {
    return (
      <div 
        className={cn("w-[80px] h-[112px] sm:w-[100px] sm:h-[140px] border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/10", className)}
        onClick={onClick}
      />
    );
  }

  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const suitSymbol = {
    hearts: '♥',
    diamonds: '♦',
    clubs: '♣',
    spades: '♠',
    joker: '★'
  }[card.suit];

  const valueDisplay = card.suit === 'joker' ? 'JOKER' : {
    1: 'A', 11: 'J', 12: 'Q', 13: 'K'
  }[card.value] || card.value;

  return (
    <motion.div 
      layoutId={card.id}
      onClick={onClick}
      className={cn("perspective-1000 w-[80px] h-[112px] sm:w-[100px] sm:h-[140px] cursor-pointer", className)}
      whileTap={{ scale: 0.95 }}
    >
      <motion.div
        className="w-full h-full relative preserve-3d"
        initial={false}
        animate={{ rotateY: faceDown ? 180 : 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
      >
        {/* Front */}
        <div className={cn("absolute inset-0 backface-hidden bg-slate-900 rounded-xl shadow-2xl border border-white/20 overflow-hidden flex flex-col p-2", isRed ? "text-red-500" : "text-slate-100")}>
          <div className="flex gap-1 items-center leading-none">
            <span className="text-sm sm:text-base font-bold">{valueDisplay}</span>
            <span className="text-[10px] sm:text-xs opacity-50">{suitSymbol}</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center text-4xl sm:text-5xl font-black opacity-90 drop-shadow-md">
            {card.suit === 'joker' ? (
              <span className="rotate-12 drop-shadow-xl text-5xl">🃏</span>
            ) : (
              <span>{valueDisplay}</span>
            )}
          </div>

          <div className="flex gap-1 items-center leading-none self-end flex-row-reverse rotate-180">
            <span className="text-sm sm:text-base font-bold">{valueDisplay}</span>
            <span className="text-[10px] sm:text-xs opacity-50">{suitSymbol}</span>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-xl shadow-2xl border-2 border-white/20 rotate-y-180 overflow-hidden relative">
          <div className="absolute inset-0 opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="h-full w-full flex items-center justify-center relative z-10 p-2 sm:p-3">
             <div className="w-full h-full border border-white/20 rounded-lg flex items-center justify-center bg-white/5 backdrop-blur-sm">
                 <div className="w-6 h-8 sm:w-8 sm:h-12 border border-white/10 rounded-sm"></div>
             </div>
          </div>
          <div className="absolute inset-0 border-[6px] border-indigo-900/40 z-0 pointer-events-none rounded-xl"></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

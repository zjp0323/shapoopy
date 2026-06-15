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
            <span className="text-[10px] sm:text-xs">{suitSymbol}</span>
          </div>
          
          <div className="flex-1 flex items-center justify-center">
            {card.suit === 'joker' ? (
              <span className="text-3xl rotate-12">🃏</span>
            ) : (
              <span className="text-3xl sm:text-4xl text-inherit">{suitSymbol}</span>
            )}
          </div>

          <div className="flex gap-1 items-center leading-none self-end flex-row-reverse rotate-180">
            <span className="text-sm sm:text-base font-bold">{valueDisplay}</span>
            <span className="text-[10px] sm:text-xs">{suitSymbol}</span>
          </div>
        </div>

        {/* Back */}
        <div className="absolute inset-0 backface-hidden bg-indigo-700 rounded-xl shadow-2xl border-2 border-white/30 rotate-y-180 overflow-hidden relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          <div className="h-full w-full flex items-center justify-center relative z-10">
             <div className="w-8 h-8 sm:w-10 sm:h-10 border-2 border-white/30 rounded-full rotate-45"></div>
          </div>
          <div className="absolute inset-0 border-8 border-white/10 z-0 pointer-events-none"></div>
        </div>
      </motion.div>
    </motion.div>
  );
}

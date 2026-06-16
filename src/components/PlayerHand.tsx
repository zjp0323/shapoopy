import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { PlayerState, GameStatus } from '../types';
import CardView from './CardView';
import { Check, ShieldAlert } from 'lucide-react';

interface PlayerHandProps {
  player: PlayerState;
  isMe: boolean;
  active: boolean;
  status: GameStatus;
  onCardClick?: (index: number) => void;
  key?: string | number;
}

export default function PlayerHand({ player, isMe, active, status, onCardClick }: PlayerHandProps) {
  // hand can range from 0 to 5 cards (4 initially, 5 on penalty, decreases on string matches)
  // Grid layout adjusts dynamically. 4 cards = 2x2. 5 cards = 3 top, 2 bottom? Or flex run.
  
  const handSize = player.hand.length;
  
  const checkShouldFaceDown = (idx: number) => {
    if (status === 'scoring') return false;
    if (status === 'memorization' && isMe && !player.isReady) {
      // In a 2-col grid for 4 cards, indices 0 and 1 are the top two, 2 and 3 are bottom two.
      return idx < 2; // Top cards face down, bottom ones face up
    }
    return true;
  };

  return (
    <div className={cn("relative flex flex-col items-center", active ? "scale-105 transition-transform" : "")}>
      
      {active && status === 'playing' && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-indigo-600 text-white font-black text-xs rounded-full shadow-[0_0_15px_rgba(79,70,229,0.5)] flex items-center gap-2 whitespace-nowrap uppercase tracking-widest">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          {isMe ? "YOUR TURN" : "CURRENT TURN"}
        </div>
      )}

      {/* Hand Container */}
      <div className={cn("p-4 rounded-3xl relative", isMe ? "bg-white/5 border border-white/10 shadow-inner backdrop-blur-sm" : "")}>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          {player.hand.map((card, idx) => (
            <CardView 
              key={`${player.id}-slot-${idx}`} 
              card={card} 
              faceDown={card ? checkShouldFaceDown(idx) : false}
              onClick={() => onCardClick?.(idx)}
              className={cn(
                isMe && status === 'playing' && card ? "hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-emerald-400 transition-all duration-200" : ""
              )}
            />
          ))}
        </div>
      </div>

      {/* Player Header */}
      <div className="mt-3 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl px-4 py-2 flex items-center gap-3 shadow-lg">
        <img src={player.avatar} alt={player.name} className={cn("w-10 h-10 rounded-full border-2", active ? "border-emerald-400 ring-2 ring-emerald-400/50" : "border-white/20 bg-slate-800")} />
        <div className="flex flex-col">
          <span className="font-bold text-sm tracking-wide text-white">{player.name} {isMe && <span className="text-emerald-400 text-xs">(You)</span>}</span>
          
          <div className="flex items-center gap-2 mt-0.5">
            {status === 'memorization' && (
              <span className={cn("text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded flex items-center gap-1", player.isReady ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-slate-400")}>
                {player.isReady ? <><Check size={10} /> Ready</> : "Memorizing..."}
              </span>
            )}
            {player.finalTurnDone && (
              <span className="text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded flex items-center gap-1 bg-amber-500/20 text-amber-400">
                Final Done
              </span>
            )}
            <span className="text-[10px] font-bold text-slate-300 bg-white/10 px-2 py-0.5 rounded font-mono">
              {player.hand.filter(c=>c!==null).length} Cards
            </span>
          </div>
        </div>
      </div>
      
    </div>
  );
}

import { useState, useContext, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { SocketContext, RoomContext } from '../App';
import type { GameRoom, PlayerState, Card } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Copy, Users, Play, Crown, Trophy, Shuffle, CornerDownRight } from 'lucide-react';
import { useToast } from './Toast';
import { cn } from '../lib/utils';

// Component mapping
import CardView from './CardView';
import PlayerHand from './PlayerHand';

export default function RoomView() {
  const { roomId } = useParams();
  const socket = useContext(SocketContext);
  const room = useContext(RoomContext);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!socket) return;
    
    // If we refresh and lose socket state, redirect to lobby to rejoin but with roomcode
    if (socket.disconnected && !socket.active) {
      if (!room) {
        navigate(`/join/${roomId}`);
      }
      return;
    }

    // `room_state` is now handled by App.tsx, but we still handle penalty animations here
    const handlePenalty = (playerName: string, msg: string) => {
      toast(`${playerName} ${msg}`);
    };

    socket.on('penalty_animation', handlePenalty);

    return () => {
      socket.off('penalty_animation', handlePenalty);
    };
  }, [socket, navigate, roomId, room, toast]);

  // If user navigated directly here without joining context
  useEffect(() => {
    if (room && socket && socket.id) {
       const me = room.players.find(p => p.id === socket.id);
       if (!me) {
           navigate(`/join/${roomId}`);
       }
    }
  }, [room, socket, navigate, roomId]);

  if (!room) {
    return <div className="min-h-screen text-slate-400 flex items-center justify-center">Connecting to Room...</div>;
  }

  const isHost = room.hostId === socket?.id;
  const me = room.players.find(p => p.id === socket?.id);

  if (!me) return <div className="min-h-screen">Loading player state...</div>;

  const joinUrl = `${window.location.origin}/join/${room.id}`;

  const copyUrl = () => {
    navigator.clipboard.writeText(joinUrl);
    toast("Link copied!");
  };

  if (room.status === 'lobby') {
    return (
      <div className="flex flex-col items-center justify-center flex-1 p-6 relative w-full h-full">
        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="max-w-md w-full bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="text-center space-y-4 mb-10 text-slate-200">
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest px-2">Room Code</h2>
            <div className="text-6xl font-black tracking-widest text-emerald-400 drop-shadow-md">{room.id}</div>
            
            <div className="mt-8 bg-white p-4 rounded-2xl inline-block shadow-lg mx-auto border border-white/20">
              <QRCodeSVG value={joinUrl} size={180} fgColor="#000" bgColor="#fff" />
            </div>
            
            <button onClick={copyUrl} className="mx-auto flex items-center gap-2 text-sm font-semibold hover:text-white text-slate-300 transition-colors py-2 px-4 bg-white/10 rounded-full border border-white/10 mt-6">
              <Copy size={16} /> Copy Invite Link
            </button>
          </div>

          <div className="space-y-3">
            <div className="font-bold text-slate-400 uppercase tracking-widest text-xs mb-3 flex items-center justify-between">
              <span>Players ({room.players.length}/8)</span>
              <Users size={14} />
            </div>
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
              <AnimatePresence>
                {room.players.map(p => (
                  <motion.div key={p.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.8 }} 
                    className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 shadow-sm">
                    <img src={p.avatar} alt={p.name} className="w-10 h-10 rounded-full border border-white/20 bg-slate-800" />
                    <span className="font-semibold text-slate-200">{p.name}</span>
                    {p.id === room.hostId && <Crown size={16} className="text-yellow-400 ml-auto" />}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          {isHost && (
            <button 
              onClick={() => socket?.emit('start_game')}
              disabled={room.players.length < 2}
              className="mt-8 w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-white/10 border border-emerald-500 disabled:border-white/10 disabled:text-slate-500 text-white font-black uppercase tracking-widest py-4 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:shadow-none transition-all flex items-center justify-center gap-2"
            >
              <Play size={20} /> Start Game
            </button>
          )}
          {!isHost && (
            <div className="mt-8 w-full bg-white/5 border border-white/10 text-slate-400 font-bold py-4 rounded-xl text-center shadow-inner">
              Waiting for host...
            </div>
          )}
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full relative z-10 w-full overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-16 flex items-center justify-between px-4 sm:px-8 bg-white/5 backdrop-blur-md border-b border-white/10 z-20 shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-indigo-500 rounded-lg flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg shadow-indigo-500/20 text-white">S</div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-emerald-300 italic">SHAPOOPY</h1>
        </div>
        <div className="flex items-center gap-4 sm:gap-6">
          <div className="bg-white/5 px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <span className="text-[10px] sm:text-xs text-slate-400 uppercase tracking-widest font-bold hidden sm:inline">Room Code</span>
            <span className="text-sm sm:text-lg font-mono text-emerald-400">{room.id}</span>
          </div>
          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white p-1 rounded-md shadow-inner text-black cursor-pointer hidden sm:block" onClick={copyUrl} title="Copy Invite Link">
            <Copy size={24} className="w-full h-full p-1" />
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col pt-4 sm:pt-6 pb-24 overflow-y-auto w-full max-w-[1400px] mx-auto px-2 sm:px-6 z-10">
        
        {/* Opponents Area */}
        <div className="flex justify-center items-start gap-4 sm:gap-8 flex-wrap mb-4 sm:mb-8 min-h-[140px] sm:min-h-[160px]">
          <AnimatePresence>
            {room.players.filter(p => p.id !== me.id).map(p => (
              <PlayerHand key={p.id} player={p} isMe={false} active={room.activePlayerId === p.id} status={room.status} />
            ))}
          </AnimatePresence>
        </div>

        {/* Center Board (Deck & Discard) */}
        <div className="flex flex-col items-center justify-center relative my-4 flex-shrink-0">
          
          <div className="absolute top-0 right-0 flex flex-col items-end gap-2 text-right">
            {room.shapoopyCallerId && (
              <div className="bg-red-500/10 border border-red-500/20 px-4 py-2 rounded-xl font-bold animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.2)] text-red-200">
                <span className="text-xs uppercase block text-red-400">Game Status</span>
                <span className="font-bold underline text-sm">SHAPOOPY!</span>
                <div className="text-[10px] font-normal opacity-80 mt-0.5 truncate max-w-[120px]">
                  by {room.players.find(p=>p.id === room.shapoopyCallerId)?.name}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-4 sm:gap-12 w-full max-w-sm mt-4 sm:mt-0">
            {/* Draw Pile */}
            <div className="relative group cursor-pointer" onClick={() => socket?.emit('draw_deck')}>
              <CardView card={{ id: 'deck', suit: 'hearts', value: 0 } as any} 
                faceDown={true} 
                className={room.activePlayerId === me.id && room.status === 'playing' && !room.drawnCard ? "ring-2 ring-indigo-400 shadow-[0_0_15px_rgba(129,140,248,0.4)] transition-transform hover:-translate-y-2" : "opacity-80"} 
              />
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest drop-shadow-md">
                DECK <span className="opacity-60 block mt-0.5">{room.deckCount} CARDS</span>
              </div>
            </div>

            {/* Discard Pile */}
            <div className="relative">
              {room.discardPile.length > 0 ? (
                <CardView card={room.discardPile[room.discardPile.length - 1]} faceDown={false} className="rotate-3" />
              ) : (
                <div className="w-[80px] h-[112px] sm:w-[100px] sm:h-[140px] border-2 border-dashed border-white/20 rounded-2xl bg-white/5" />
              )}
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest drop-shadow-md whitespace-nowrap">Discard Pile</div>
            </div>
          </div>
        </div>

        {/* My Area */}
        <div className="mt-auto relative w-full flex justify-center pb-2">
          <div className="flex flex-col items-center">
            
            <PlayerHand 
              player={me} 
              isMe={true} 
              active={room.activePlayerId === me.id} 
              status={room.status} 
              onCardClick={(idx) => {
                if (room.activePlayerId === me.id && room.drawnCard) {
                  socket?.emit('swap_card', idx);
                } else if (room.status === 'playing') {
                  socket?.emit('match_discard', idx);
                }
              }}
            />
          </div>
        </div>
      </main>
      
      {/* Bottom Action Bar for Desktop/Mobile footer area */}
      <footer className="h-auto min-h-[80px] bg-white/5 backdrop-blur-xl border-t border-white/10 flex items-center justify-between px-4 sm:px-10 z-20 py-4 flex-wrap gap-4 absolute bottom-0 left-0 right-0">
          <div className="flex items-center gap-4 w-full justify-between sm:justify-start">
             <AnimatePresence mode="wait">
                {room.status === 'playing' && room.activePlayerId === me.id && room.drawnCard && (
                   <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-4 bg-white/5 p-2 pr-4 rounded-2xl border border-white/10 shadow-lg pointer-events-auto shrink-0 max-w-[50%] sm:max-w-max">
                     <div className="flex items-center gap-3">
                       <CardView card={room.drawnCard} faceDown={false} className="scale-75 origin-left hidden sm:block" />
                       <div className="flex flex-col gap-1">
                         <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">Drawn Card</div>
                         <button 
                           onClick={() => socket?.emit('discard_drawn_card')}
                           className="bg-red-600 hover:bg-red-500 text-white font-black text-xs px-4 py-2 rounded-full uppercase tracking-wider shadow-lg shadow-red-600/30 transition-transform active:scale-95"
                         >
                           Discard <span className="hidden sm:inline">Drawn</span>
                         </button>
                         <div className="text-[10px] text-slate-300 max-w-[120px] leading-tight mt-1 hidden sm:block">Or tap a card in hand to swap.</div>
                       </div>
                     </div>
                   </motion.div>
                )}

                {room.status === 'memorization' && !me.isReady && (
                   <motion.button 
                     initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                     onClick={() => socket?.emit('ready')}
                     className="px-8 py-3 bg-white text-slate-950 font-black rounded-full shadow-xl hover:scale-105 active:scale-95 transition-transform uppercase tracking-widest w-full sm:w-auto"
                   >
                     Ready
                   </motion.button>
                )}
                
                {room.status === 'playing' && room.activePlayerId === me.id && !room.drawnCard && !room.shapoopyCallerId && (
                   <motion.button
                     initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                     onClick={() => socket?.emit('call_shapoopy')}
                     className="px-6 py-3 sm:px-12 sm:py-4 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white font-black rounded-xl sm:rounded-full shadow-xl shadow-indigo-600/40 uppercase tracking-widest border border-white/20 transition-transform hover:scale-105 active:scale-95 w-full sm:w-auto text-sm"
                   >
                     CALL SHAPOOPY
                   </motion.button>
                )}
                
                {room.status === 'playing' && room.activePlayerId !== me.id && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-slate-400 font-medium italic text-sm pointer-events-none">
                    Waiting for {room.players.find(p=>p.id===room.activePlayerId)?.name}...
                  </motion.div>
                )}

                {room.status === 'scoring' && isHost && (
                  <motion.button
                     initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                     onClick={() => socket?.emit('play_again')}
                     className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] pointer-events-auto flex gap-2 items-center uppercase tracking-widest w-full sm:w-auto justify-center"
                   >
                     <Shuffle size={18} /> Play Again
                   </motion.button>
                )}
             </AnimatePresence>
          </div>
      </footer>
      
      {/* Scoring Overlay */}
      <AnimatePresence>
        {room.status === 'scoring' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
              <h2 className="text-3xl font-black text-center mb-8 flex items-center justify-center gap-3 drop-shadow-md text-emerald-400">
                <Trophy size={32} /> Results
              </h2>
              
              <div className="space-y-3">
                {[...room.players].sort((a,b) => a.score - b.score).map((p, i) => (
                  <div key={p.id} className={cn("flex items-center gap-4 p-4 rounded-xl border border-white/10", p.isWinner ? "bg-emerald-500/20 border-emerald-500/50" : "bg-white/5")}>
                    <div className="text-lg font-black text-slate-400 w-6">{i+1}</div>
                    <img src={p.avatar} alt={p.name} className="w-12 h-12 rounded-full bg-white/10 border-2 border-white/20" />
                    <div className="flex-1 font-bold text-lg">{p.name}</div>
                    <div className={cn("text-2xl font-black font-mono", p.isWinner ? "text-emerald-400" : "text-white")}>{p.score}</div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-white/10 text-center">
                {isHost ? (
                  <button onClick={() => socket?.emit('play_again')} className="w-full py-4 bg-white text-slate-950 shadow-xl hover:scale-105 active:scale-95 transition-transform rounded-xl font-black text-lg uppercase tracking-widest">
                    Next Round
                  </button>
                ) : (
                  <div className="text-slate-400 font-medium uppercase tracking-widest text-xs">Waiting for host...</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

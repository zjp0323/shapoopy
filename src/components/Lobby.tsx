import { useState, useContext, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { SocketContext } from '../App';
import { motion } from 'motion/react';
import { Sparkles, Gamepad2, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import { useToast } from './Toast';

export default function Lobby() {
  const { roomIdBase } = useParams();
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [roomId, setRoomId] = useState(roomIdBase || '');
  const [isJoining, setIsJoining] = useState(false);
  const { toast } = useToast();

  const handleCreate = () => {
    if (!name.trim()) return toast('Please enter your name');
    if (!socket) return;
    
    setIsJoining(true);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    socket.emit('create_room', name, avatar, (newRoomId: string) => {
      navigate(`/room/${newRoomId}`);
    });
  };

  const handleJoin = () => {
    if (!name.trim()) return toast('Please enter your name');
    if (!roomId.trim()) return toast('Please enter a room code');
    if (!socket) return;

    setIsJoining(true);
    const avatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(name)}`;
    socket.emit('join_room', roomId.toUpperCase(), name, avatar, (error?: string) => {
      setIsJoining(false);
      if (error) {
        toast(error);
      } else {
        navigate(`/room/${roomId.toUpperCase()}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 relative w-full h-full">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="z-10 w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl space-y-8"
      >
        <div className="text-center space-y-2">
          <div className="mb-4 inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500 shadow-lg shadow-indigo-500/20 text-white">
            <Sparkles size={32} />
          </div>
          <h1 className="text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-indigo-300 to-emerald-300 italic uppercase">
            SHAPOOPY
          </h1>
          <p className="text-slate-300 font-medium">Memory, bluffs, and chaos.</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5 mt-8">
            <label className="text-xs font-bold text-slate-300 tracking-wider uppercase ml-1">Player Name</label>
            <input 
              className="w-full bg-white/5 border border-white/10 text-white rounded-xl px-4 py-3.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-medium placeholder:text-slate-500"
              placeholder="E.g. Gambit"
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && (!roomIdBase ? handleCreate() : handleJoin())}
              maxLength={12}
            />
          </div>

          <div className="pt-2 grid grid-cols-1 gap-3">
            {roomIdBase ? (
              <button 
                onClick={handleJoin}
                disabled={isJoining}
                className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-600/40 border border-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
              >
                {isJoining ? 'Joining...' : 'Join Game'}
              </button>
            ) : (
              <>
                <button 
                  onClick={handleCreate}
                  disabled={isJoining}
                  className="w-full bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-black py-4 rounded-xl shadow-xl shadow-indigo-600/40 border border-white/10 transition-all flex items-center justify-center gap-2 uppercase tracking-widest"
                >
                  <Gamepad2 size={20} /> Create New Game
                </button>
                <div className="relative py-2 flex items-center">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Or</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>
                <div className="flex flex-row gap-2">
                  <input 
                    className="flex-grow bg-white/5 border border-white/10 text-white placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none focus:border-indigo-500 transition-all font-mono font-bold tracking-widest uppercase"
                    placeholder="ROOM CODE"
                    value={roomId}
                    onChange={e => setRoomId(e.target.value.toUpperCase())}
                    maxLength={4}
                    onKeyDown={e => e.key === 'Enter' && handleJoin()}
                  />
                  <button 
                    onClick={handleJoin}
                    disabled={isJoining}
                    className="bg-white/10 border border-white/20 hover:bg-white/20 text-white shadow-xl font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center flex-shrink-0 uppercase tracking-widest"
                  >
                    Join
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}

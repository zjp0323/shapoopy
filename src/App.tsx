import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, Link } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import type { GameRoom, ClientToServerEvents, ServerToClientEvents, PlayerState, Card } from './types';
import Lobby from './components/Lobby';
import RoomView from './components/RoomView';
import { ToastProvider, ToastViewport } from './components/Toast';

export const SocketContext = createContext<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
export const RoomContext = createContext<GameRoom | null>(null);

function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [room, setRoom] = useState<GameRoom | null>(null);

  useEffect(() => {
    const newSocket = io({ transports: ['websocket'] });
    setSocket(newSocket);
    
    newSocket.on('room_state', (r: GameRoom) => setRoom(r));
    return () => { newSocket.close(); };
  }, []);

  return (
    <SocketContext.Provider value={socket}>
      <RoomContext.Provider value={room}>
        {children}
      </RoomContext.Provider>
    </SocketContext.Provider>
  );
}

export default function App() {
  return (
    <SocketProvider>
      <BrowserRouter>
        <ToastProvider>
          <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-indigo-900 selection:text-white relative overflow-hidden flex flex-col">
            {/* Mesh Gradient Background Elements */}
            <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/30 blur-[120px] rounded-full pointer-events-none z-0"></div>
            <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/30 blur-[120px] rounded-full pointer-events-none z-0"></div>
            
            <div className="relative z-10 flex-1 flex flex-col overflow-y-auto">
              <Routes>
                <Route path="/" element={<Lobby />} />
                <Route path="/join/:roomIdBase" element={<Lobby />} />
                <Route path="/room/:roomId" element={<RoomView />} />
              </Routes>
            </div>
          </div>
          <ToastViewport />
        </ToastProvider>
      </BrowserRouter>
    </SocketProvider>
  );
}

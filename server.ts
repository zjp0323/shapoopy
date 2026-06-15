import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
// Use paths relative to server.ts for types, but we can't use type-only imports for values.
import type { GameRoom, PlayerState, Card, ClientToServerEvents, ServerToClientEvents, GameStatus } from "./src/types";

// State
interface ServerGameRoom extends Omit<GameRoom, 'deckCount'> {
  deck: Card[];
}
const rooms = new Map<string, ServerGameRoom>();

// Deck Utils
function generateDeck(): Card[] {
  const suits: ('hearts'|'diamonds'|'clubs'|'spades')[] = ['hearts', 'diamonds', 'clubs', 'spades'];
  let idCounter = 0;
  const deck: Card[] = [];
  
  for (const suit of suits) {
    for (let value = 1; value <= 13; value++) {
      deck.push({ id: `c-${idCounter++}`, suit, value });
    }
  }
  // 2 Jokers
  deck.push({ id: `j-1`, suit: 'joker', value: 0 });
  deck.push({ id: `j-2`, suit: 'joker', value: 0 });
  
  // Shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getCardScore(card: Card): number {
  if (card.suit === 'joker') return -2;
  return card.value as number;
}

function calculateScore(hand: (Card | null)[]): number {
  return hand.reduce((sum, card) => sum + (card ? getCardScore(card) : 0), 0);
}

function sanitizeRoom(room: ServerGameRoom): GameRoom {
  return {
    id: room.id,
    status: room.status,
    hostId: room.hostId,
    players: room.players.map(p => ({
      ...p,
      // hide cards unless status is scoring
      hand: room.status === 'scoring' ? p.hand : p.hand.map(c => c ? { ...c, faceUp: false, suit: 'hearts', value: 0 } as any : null) // obfuscated unless faceUp logic needed later, wait, client knows slot count
    })),
    turnIndex: room.turnIndex,
    shapoopyCallerId: room.shapoopyCallerId,
    drawnCard: room.drawnCard,
    discardPile: room.discardPile,
    deckCount: room.deck.length,
    activePlayerId: room.activePlayerId,
  };
}

// Function to selectively send state
function broadcastRoom(io: Server, room: ServerGameRoom) {
  const sanitized = sanitizeRoom(room);
  // Send to all in room, BUT each player needs to see array of their OWN cards IF memorization phase.
  room.players.forEach(p => {
    const playerSanitized = { ...sanitized, players: sanitized.players.map(sp => {
      // If it's this player, and it's memorization, they see their cards!
      // In playing phase, hand is face down for themselves too! (Except temporarily if we allowed faceUp? No, memorization is the only free look phase, plus scoring).
      if (sp.id === p.id && room.status === 'memorization') {
        return { ...sp, hand: p.hand };
      }
      return sp;
    })};
    io.to(p.id).emit('room_state', playerSanitized);
  });
}

function dealCards(room: ServerGameRoom) {
  room.players.forEach(p => {
    p.hand = [room.deck.pop()!, room.deck.pop()!, room.deck.pop()!, room.deck.pop()!];
    p.isReady = false;
  });
  // Top discard
  room.discardPile = [room.deck.pop()!];
}

function nextTurn(room: ServerGameRoom, io: Server) {
  if (room.status === 'scoring') return;
  
  if (room.shapoopyCallerId) {
    room.players[room.turnIndex].finalTurnDone = true;
  }
  
  // Check if anyone has no cards left -> instant win
  const outOfCardsPlayer = room.players.find(p => p.hand.every(slot => slot === null));
  
  // Or check if final round done for all EXCEPT shapoopy caller
  let allFinalsDone = false;
  if (room.shapoopyCallerId) {
    const others = room.players.filter(p => p.id !== room.shapoopyCallerId);
    if (others.every(p => p.finalTurnDone)) {
      allFinalsDone = true;
    }
  }
  
  if (outOfCardsPlayer || allFinalsDone) {
    // SCORING
    room.status = 'scoring';
    room.players.forEach(p => p.score = calculateScore(p.hand));
    const scores = room.players.map(p => p.score);
    const minScore = Math.min(...scores);
    room.players.forEach(p => p.isWinner = p.score === minScore);
    broadcastRoom(io, room);
    return;
  }
  
  // Advance turn
  room.turnIndex = (room.turnIndex + 1) % room.players.length;
  room.activePlayerId = room.players[room.turnIndex].id;
  room.drawnCard = null;
  broadcastRoom(io, room);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  const server = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
    cors: { origin: "*" }
  });

  io.on('connection', (socket) => {
    let currentRoomId: string | null = null;

    socket.on('create_room', (name, avatar, callback) => {
      const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
      const newRoom: ServerGameRoom = {
        id: roomId,
        status: 'lobby',
        hostId: socket.id,
        players: [{ id: socket.id, name, avatar, hand: [null, null, null, null], isReady: false, score: 0, finalTurnDone: false }],
        turnIndex: 0,
        shapoopyCallerId: null,
        drawnCard: null,
        discardPile: [],
        deck: [],
        activePlayerId: null,
      };
      rooms.set(roomId, newRoom);
      currentRoomId = roomId;
      socket.join(roomId);
      callback(roomId);
      broadcastRoom(io, newRoom);
    });

    socket.on('join_room', (roomId, name, avatar, callback) => {
      const room = rooms.get(roomId);
      if (!room) return callback("Room not found");
      if (room.status !== 'lobby') return callback("Game already started");
      if (room.players.length >= 8) return callback("Room full");

      room.players.push({ id: socket.id, name, avatar, hand: [null, null, null, null], isReady: false, score: 0, finalTurnDone: false });
      currentRoomId = roomId;
      socket.join(roomId);
      callback();
      broadcastRoom(io, room);
    });

    socket.on('start_game', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.hostId === socket.id && room.players.length >= 2) {
        room.deck = generateDeck();
        room.status = 'memorization';
        dealCards(room);
        broadcastRoom(io, room);
      }
    });

    socket.on('play_again', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.hostId === socket.id) {
        room.deck = generateDeck();
        room.status = 'memorization';
        room.turnIndex = 0;
        room.shapoopyCallerId = null;
        room.drawnCard = null;
        room.activePlayerId = room.players[0].id;
        dealCards(room);
        broadcastRoom(io, room);
      }
    });

    socket.on('ready', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.status === 'memorization') {
        const p = room.players.find(p => p.id === socket.id);
        if (p) {
          p.isReady = true;
          if (room.players.every(p => p.isReady)) {
            room.status = 'playing';
            room.activePlayerId = room.players[0].id;
          }
          broadcastRoom(io, room);
        }
      }
    });

    socket.on('draw_deck', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.status === 'playing' && room.activePlayerId === socket.id && !room.drawnCard) {
        if (room.deck.length === 0) {
          // Shuffle discard pile into deck if empty
          const topDiscard = room.discardPile.pop()!;
          room.deck = room.discardPile;
          room.discardPile = [topDiscard];
          // Simple shuffle
          for (let i = room.deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [room.deck[i], room.deck[j]] = [room.deck[j], room.deck[i]];
          }
        }
        room.drawnCard = room.deck.pop()!;
        broadcastRoom(io, room);
        socket.emit('drawn_card', room.drawnCard); // Private send to active player
      }
    });

    socket.on('swap_card', (slotIndex) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.status === 'playing' && room.activePlayerId === socket.id && room.drawnCard) {
        const p = room.players.find(p => p.id === socket.id);
        if (p && p.hand[slotIndex] !== undefined && p.hand[slotIndex] !== null) {
          const oldCard = p.hand[slotIndex]!;
          p.hand[slotIndex] = room.drawnCard;
          room.discardPile.push(oldCard);
          nextTurn(room, io);
        }
      }
    });

    socket.on('discard_drawn_card', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.status === 'playing' && room.activePlayerId === socket.id && room.drawnCard) {
        room.discardPile.push(room.drawnCard);
        nextTurn(room, io);
      }
    });

    socket.on('match_discard', (slotIndex) => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      // Can happen anytime if they have a card there
      if (room && room.status === 'playing' && room.discardPile.length > 0) {
        const p = room.players.find(p => p.id === socket.id);
        if (p && p.hand[slotIndex] !== undefined && p.hand[slotIndex] !== null) {
          const playedCard = p.hand[slotIndex]!;
          const topDiscard = room.discardPile[room.discardPile.length - 1];
          if (playedCard.value === topDiscard.value) {
            // MATCH!
            room.discardPile.push(playedCard);
            p.hand[slotIndex] = null; // permanently empty
            io.to(room.id).emit('penalty_animation', p.name, "Match! Discarded.");
          } else {
            // WRONG! PENALTY
            io.to(room.id).emit('penalty_animation', p.name, "Wrong Match! +1 Penalty Card");
            if (room.deck.length > 0) {
              const penaltyCard = room.deck.pop()!;
              p.hand.push(penaltyCard); // hand expands!
            }
          }
          broadcastRoom(io, room);
        }
      }
    });

    socket.on('call_shapoopy', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room && room.status === 'playing' && room.activePlayerId === socket.id && !room.drawnCard && !room.shapoopyCallerId) {
        room.shapoopyCallerId = socket.id;
        const p = room.players.find(p => p.id === socket.id);
        io.to(room.id).emit('penalty_animation', p?.name || 'Someone', "called Shapoopy!");
        nextTurn(room, io);
      }
    });

    socket.on('disconnect', () => {
      if (!currentRoomId) return;
      const room = rooms.get(currentRoomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== socket.id);
        if (room.players.length === 0) {
          rooms.delete(currentRoomId);
        } else if (room.hostId === socket.id) {
          room.hostId = room.players[0].id;
          broadcastRoom(io, room);
        } else {
          broadcastRoom(io, room);
        }
      }
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

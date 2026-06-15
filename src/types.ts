export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades' | 'joker';

export interface Card {
  id: string; // unique exact card id
  suit: Suit;
  value: number | string; // 1-13 (Ace=1, J=11, Q=12, K=13) or 0 for Joker
  faceUp?: boolean;
}

export type PlayerState = {
  id: string;
  name: string;
  avatar: string;
  hand: (Card | null)[];
  isReady: boolean;
  score: number;
  finalTurnDone: boolean;
  isWinner?: boolean;
};

export type GameStatus = 'lobby' | 'memorization' | 'playing' | 'final_round' | 'scoring';

export interface GameRoom {
  id: string;
  status: GameStatus;
  hostId: string;
  players: PlayerState[];
  turnIndex: number;
  shapoopyCallerId: string | null;
  drawnCard: Card | null;
  discardPile: Card[];
  deckCount: number; // Send only count to clients to prevent cheating
  activePlayerId: string | null;
  lastDiscardPenalty?: { playerId: string, reason: string }; // for animation
}

// Events Client -> Server
export interface ClientToServerEvents {
  'create_room': (name: string, avatar: string, callback: (roomId: string) => void) => void;
  'join_room': (roomId: string, name: string, avatar: string, callback: (error?: string) => void) => void;
  'start_game': () => void;
  'ready': () => void;
  'draw_deck': () => void;
  'swap_card': (slotIndex: number) => void;
  'discard_drawn_card': () => void;
  'match_discard': (slotIndex: number) => void;
  'call_shapoopy': () => void;
  'play_again': () => void;
}

// Events Server -> Client
export interface ServerToClientEvents {
  'room_state': (room: GameRoom) => void;
  'error': (msg: string) => void;
  'penalty_animation': (playerName: string, msg: string) => void;
  'drawn_card': (card: Card) => void; // sent ONLY to the active player!
}

import type { PlayerId } from './Player'
import type { PlayingCard } from './Card'
import type { Round, PlayerRoundScore } from './Round'
import type { Trick } from './Trick'
import type { Bid } from './Bid'

export type GamePhase = 'setup' | 'playing' | 'ended'

export interface Game {
  gameId: string
  gameName: string
  hostPlayer: PlayerId
  activePlayers: PlayerId[]
  deck: PlayingCard[]
  bidDecks: {
    setCollectionBidDeck: Bid[];
    pointsBidDeck: Bid[];
    tricksBidDeck: Bid[];
  };
  playerSessions?: Map<string, PlayerId>
  gamePhase: GamePhase
  round: Round
  playerTurnOrder: PlayerId[]
  tricksHistory: Trick[]
  bidsHistory: Bid[];
  playerScores: PlayerRoundScore[];
  gameSettings: {
    minPlayers: number
    maxPlayers: number
    pointsToWin: number
  }
}
export interface LobbyGame {
  gameId: string;
  gameName: string;
  hostPlayer: PlayerId;
  currentPlayers: 1 | 2 | 3 | 4;
  maxPlayers: 4;
  minPlayers: 2;
  hasSpace: boolean;
  createdAt: string;
}
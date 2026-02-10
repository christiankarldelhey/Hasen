import type { PlayerId, PlayerConnectionStatus } from './Player'
import type { PlayingCard, PlayerHand } from './Card'
import type { Round, PlayerRoundScore } from './Round'
import type { Trick } from './Trick'
import type { Bid } from './Bid'
import type { RoundPhase, RoundBids } from './Round'

export type GamePhase = 'setup' | 'playing' | 'ended'

export interface Game {
  gameId: string
  gameName: string
  hostPlayer: PlayerId
  hostUserId: string
  activePlayers: PlayerId[]
  deck: PlayingCard[]
  discardPile: PlayingCard[]
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
  playerScores: PlayerScore[];
  winner: PlayerId | null;
  playerConnectionStatus?: Map<PlayerId, PlayerConnectionStatus>
  disconnectionTimestamps?: Map<PlayerId, number>
  isPaused?: boolean
  pauseReason?: 'player_disconnected' | null
  gameSettings: {
    minPlayers: number
    maxPlayers: number
    pointsToWin: number
    reconnectionTimeoutMinutes: number
  }
}

export interface PlayerScore {
  playerId: PlayerId;
  score: number;
}

export interface LobbyGame {
  gameId: string;
  gameName: string;
  hostPlayer: PlayerId;
  currentPlayers: 1 | 2 | 3 | 4;
  maxPlayers: 2 | 3 | 4;
  minPlayers: 2;
  hasSpace: boolean;
  pointsToWin: number;
  createdAt: string;
}

export interface PrivateGameState {
  playerId: PlayerId;
  hand: PlayerHand | null;
}

export interface PublicRoundState {
  round: number
  roundPhase: RoundPhase
  playerTurn: PlayerId
  currentTrick: Trick | null
  roundBids: RoundBids
  roundScore: PlayerRoundScore[]
}
export interface PublicGameState {
  gameId: string
  gameName: string
  hostPlayer: PlayerId
  activePlayers: PlayerId[]
  gamePhase: GamePhase
  publicCards: Record<string, PlayingCard>
  opponentsPublicInfo: {
    playerId: PlayerId
    publicCardId: string | null
    handCardsCount: number
  }[]
  playerTurnOrder: PlayerId[]
  round: PublicRoundState
  playerScores: PlayerScore[];
  winner: PlayerId | null;
  playerConnectionStatus: Record<PlayerId, PlayerConnectionStatus>
  isPaused: boolean
  pauseReason: 'player_disconnected' | null
  gameSettings: {
    minPlayers: number
    maxPlayers: number
    pointsToWin: number
    reconnectionTimeoutMinutes: number
  }
}
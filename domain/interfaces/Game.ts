import { PlayerId } from './Player'
import { PlayingCard } from './Card'
import { Round, PlayerRoundScore } from './Round'
import { Trick } from './Trick'
import { Bid } from './Bid'

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
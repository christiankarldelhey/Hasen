// Player
export type PlayerId =  'player_1' | 'player_2' | 'player_3' | 'player_4'
export type PlayerColor = '#FF5733' | '#3498DB' | '#2ECC71' | '#F39C12'

export const AVAILABLE_PLAYERS = [
    {
        id: 'player_1' as const,
        color: '#FF5733' as const,
        defaultAvatar: 'avatar1.png'
    },
    {
        id: 'player_2' as const,
        color: '#3498DB' as const,
        defaultAvatar: 'avatar2.png'
    },
    {
        id: 'player_3' as const,
        color: '#2ECC71' as const,
        defaultAvatar: 'avatar3.png'
    },
    {
        id: 'player_4' as const,
        color: '#F39C12' as const,
        defaultAvatar: 'avatar4.png'
    }
] as const;

// Playing Card
export type Suit = 'acorns' | 'leaves' | 'berries' | 'flowers'
export type State = 'in_deck' | 'in_hand' | 'in_trick' | 'in_finished_trick' | 'in_discard_pile'
export type Character = '6' | '7' | '8' | '9' | '10' | 'U' | 'O' | 'K' 
export type Rank = {
    base: NormalRank,
    onSuit: LeadRank | null,
}
export type NormalRank = 
// Rank values from minor to mayor if they are not from leading suit:

// The special cards (when not leaded):
0 | // The Unter of berries when not played as lead card has no value at all (special card)
1 | // The unter of acorns (special card)
2 | // The unter of leaves (special card)

// The normal cards (when not leaded):
3 | // Normal values of acorns, leaves and berries offsuit (from 6 to K)

// The Minor Trumps (maintain always the base rank):
11 | // The 7 of flowers
12 | // The 8 of flowers
13 | // The 9 of flowers
14 | // The 10 of flowers

// The Major Triumphs (maintain always the base rank):
31 | // The Unter of flowers (beats the 40 if played in same trick)
32 | // The Ober of flowers
33 // The König of flowers

export type LeadRank = 
// Rank values from minor to mayor if they are from leading suit 
// (the suit that was played first):
6 | 7 | 8 | 9 | 10 | // Normal values of acorns, leaves and berries
20 | // The Ober of acorns, leaves and berries
21 | // The König of acorns, leaves and berries
40 // The Unter of berries (special card)

export type CardPoints = 0 | 2 | 3 | 4 | 10 | 11

export interface PlayingCard {
    id: string,
    suit: Suit,
    char: Character,
    rank: Rank,
    owner: PlayerId | null,
    state: State
    points: CardPoints,
};

// Trick

export type TrickNumber = 1 | 2 | 3 | 4 | 5
export type TrickState = 'in_progress' | 'ended'
export type LeadSuit = 'acorns' | 'leaves' | 'berries' 

export interface Trick {
    trick_id: number,
    trick_state: TrickState,
    trick_number: TrickNumber,
    winner: PlayerId,
    lead_suit: LeadSuit,
    cards: PlayingCard[],
}

// Bid

export type BidType = 'points' | 'set_collection' | 'trick'
export interface PointsBidCondition  {
    min_points: number;
    max_points: number;
}
export interface SetCollectionBidCondition {
    win_suit: Suit;
    avoid_suit: Suit;
}

export type WinThisTrick = boolean | null
export interface TrickBidCondition {
    tricks_to_win: {
        trick_1: WinThisTrick,
        trick_2: WinThisTrick,
        trick_3: WinThisTrick,
        trick_4: WinThisTrick,
        trick_5: WinThisTrick,
    }
}

export interface Bid {
    bid_id: number,
    bid_type: BidType,
    bid_score: number,
    current_bids: {
        trick_1: PlayerId | null,
        trick_2: PlayerId | null,
        trick_3: PlayerId | null,
    }
    bid_winner: PlayerId[] | null,
    win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition,
}


// Game
export type GamePhase = 'setup' | 'playing' | 'ended';

export interface Game {
    activePlayers: PlayerId[],
    round: number,
    gamePhase: GamePhase,
    roundPhase: RoundPhase,
    playerTurn: PlayerId,
}

// Round

export type RoundPhase = 
  | 'shuffle'                    // Mezclando el mazo
  | 'dealing_first_card'         // Repartiendo primera carta (visible)
  | 'dealing_remaining_cards'    // Repartiendo 4 cartas privadas
  | 'drawing'                    // Jugadores pueden reemplazar 1 carta
  | 'back_to_hand'               // Primera carta vuelve a ser privada
  | 'playing'                    // Jugando tricks
  | 'scoring'
export type TrickPhase = 
  | 'playing_and_bidding'
  | 'trick_resolution'
export interface Round {
  round: number
  playerTurn: PlayerId
  roundPhase: RoundPhase
  currentTrick: TrickNumber | null  // 1-5 cuando roundPhase === 'playing'
  trickPhase: TrickPhase | null     // solo cuando roundPhase === 'playing'
}
    
export interface PlayerRoundScore {
    playerId: PlayerId,
    points: number,
    totalScore: number,
    tricksWon: number,
    win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition,
}


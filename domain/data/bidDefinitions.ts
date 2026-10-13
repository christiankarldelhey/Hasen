import type { BidType, PlayerCount, PointsBidCondition, SetCollectionBidCondition, TrickBidCondition } from "../interfaces";

export interface BidDefinition {
  type: BidType
  /** Premio según la cantidad de jugadores (en Colección, valor por carta del palo) */
  score: Record<PlayerCount, number>
  /** Copias en el mazo según la cantidad de jugadores (0 = no se usa) */
  copies: Record<PlayerCount, number>
  win_condition: PointsBidCondition | SetCollectionBidCondition | TrickBidCondition
}

/** Valor de cada carta del palo apostado en una Colección */
export const COLLECTION_CARD_VALUE = 15
/** Convención interna para una apuesta de Puntos abierta (sin techo real) */
export const POINTS_BID_OPEN_MAX = 100

// Premios provisionales (versión 1). Ver docs/adr/0001-principios-de-diseno-de-apuestas.md
// Mazo por tipo: 8 cartas con 2 jugadores, 12 con 3 y 16 con 4.
export const BID_DEFINITIONS: BidDefinition[] = [
  // COLECCIÓN — neto = 15 × cartas del palo − (2 × ventana) × cartas de otros palos
  { type: 'set_collection', score: { 2: COLLECTION_CARD_VALUE, 3: COLLECTION_CARD_VALUE, 4: COLLECTION_CARD_VALUE }, copies: { 2: 2, 3: 4, 4: 5 }, win_condition: { win_suit: 'acorns', floor: 10 } },
  { type: 'set_collection', score: { 2: COLLECTION_CARD_VALUE, 3: COLLECTION_CARD_VALUE, 4: COLLECTION_CARD_VALUE }, copies: { 2: 2, 3: 4, 4: 5 }, win_condition: { win_suit: 'leaves', floor: 10 } },
  { type: 'set_collection', score: { 2: COLLECTION_CARD_VALUE, 3: COLLECTION_CARD_VALUE, 4: COLLECTION_CARD_VALUE }, copies: { 2: 2, 3: 4, 4: 5 }, win_condition: { win_suit: 'berries', floor: 10 } },
  { type: 'set_collection', score: { 2: COLLECTION_CARD_VALUE, 3: COLLECTION_CARD_VALUE, 4: COLLECTION_CARD_VALUE }, copies: { 2: 2, 3: 0, 4: 1 }, win_condition: { win_suit: 'flowers', floor: 20 } },

  // PUNTOS — franjas de 20 puntos y tres abiertas (max 100 = sin techo)
  { type: 'points', score: { 2: 35, 3: 45, 4: 45 }, copies: { 2: 2, 3: 2, 4: 2 }, win_condition: { min_points: 1, max_points: 20 } },
  { type: 'points', score: { 2: 30, 3: 40, 4: 50 }, copies: { 2: 1, 3: 2, 4: 2 }, win_condition: { min_points: 5, max_points: 25 } },
  { type: 'points', score: { 2: 25, 3: 35, 4: 45 }, copies: { 2: 2, 3: 2, 4: 2 }, win_condition: { min_points: 10, max_points: 30 } },
  { type: 'points', score: { 2: 25, 3: 35, 4: 45 }, copies: { 2: 2, 3: 2, 4: 2 }, win_condition: { min_points: 15, max_points: 35 } },
  { type: 'points', score: { 2: 0, 3: 55, 4: 70 }, copies: { 2: 0, 3: 2, 4: 2 }, win_condition: { min_points: 20, max_points: 40 } },
  { type: 'points', score: { 2: 30, 3: 25, 4: 25 }, copies: { 2: 1, 3: 2, 4: 2 }, win_condition: { min_points: 25, max_points: 100 } },
  { type: 'points', score: { 2: 0, 3: 0, 4: 40 }, copies: { 2: 0, 3: 0, 4: 2 }, win_condition: { min_points: 30, max_points: 100 } },
  { type: 'points', score: { 2: 0, 3: 0, 4: 55 }, copies: { 2: 0, 3: 0, 4: 2 }, win_condition: { min_points: 35, max_points: 100 } },

  // BAZAS — las de posición se definen en las bazas 4 y 5
  { type: 'trick', score: { 2: 40, 3: 25, 4: 20 }, copies: { 2: 2, 3: 2, 4: 2 }, win_condition: { win_min_tricks: 0, win_max_tricks: 0 } },
  { type: 'trick', score: { 2: 80, 3: 65, 4: 50 }, copies: { 2: 2, 3: 2, 4: 2 }, win_condition: { win_min_tricks: 1, win_max_tricks: 1 } },
  { type: 'trick', score: { 2: 0, 3: 0, 4: 70 }, copies: { 2: 0, 3: 0, 4: 2 }, win_condition: { win_min_tricks: 2, win_max_tricks: 2 } },
  { type: 'trick', score: { 2: 0, 3: 55, 4: 80 }, copies: { 2: 0, 3: 2, 4: 2 }, win_condition: { win_min_tricks: 3, win_max_tricks: 3 } },
  { type: 'trick', score: { 2: 15, 3: 25, 4: 35 }, copies: { 2: 1, 3: 2, 4: 2 }, win_condition: { may_win_trick_position: [1, 2, 3], win_trick_position: [4, 5] } },
  { type: 'trick', score: { 2: 0, 3: 55, 4: 70 }, copies: { 2: 0, 3: 2, 4: 2 }, win_condition: { lose_trick_position: [1, 2, 3], win_trick_position: [4, 5] } },
  { type: 'trick', score: { 2: 0, 3: 0, 4: 65 }, copies: { 2: 0, 3: 0, 4: 2 }, win_condition: { lose_trick_position: [1, 2, 3, 5], win_trick_position: [4] } },
  { type: 'trick', score: { 2: 80, 3: 75, 4: 60 }, copies: { 2: 2, 3: 2, 4: 2 }, win_condition: { lose_trick_position: [1, 2, 3, 4], win_trick_position: [5] } },
  { type: 'trick', score: { 2: 80, 3: 0, 4: 0 }, copies: { 2: 1, 3: 0, 4: 0 }, win_condition: { win_trick_position: [1, 2, 3, 4, 5] } },
]

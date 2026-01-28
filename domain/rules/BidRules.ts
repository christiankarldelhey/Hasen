import type { Game } from '../interfaces/Game'
import type { PlayerId } from '../interfaces/Player'
import type { BidType } from '../interfaces/Bid'
import type { TrickNumber } from '../interfaces/Trick'

export interface CanMakeBidResult {
  canMakeBid: boolean
  reason?: string
}

export function canMakeBid(
  game: Game,
  playerId: PlayerId,
  bidType: BidType,
  trickNumber: TrickNumber
): CanMakeBidResult {
  if (game.round.playerTurn !== playerId) {
    return {
      canMakeBid: false,
      reason: 'No es tu turno'
    }
  }

  if (trickNumber > 3) {
    return {
      canMakeBid: false,
      reason: 'Solo puedes hacer bids en los primeros 3 tricks'
    }
  }

  if (!game.round.currentTrick || game.round.currentTrick.trick_state !== 'in_progress') {
    return {
      canMakeBid: false,
      reason: 'El trick debe estar en progreso para hacer un bid'
    }
  }

  const availableBids = game.round.roundBids.bids.filter(b => b.bid_type === bidType)
  
  if (availableBids.length === 0) {
    return {
      canMakeBid: false,
      reason: 'No hay bid disponible de este tipo'
    }
  }

  const playerBids = game.round.roundBids.playerBids[playerId] || []
  
  // Rule: Solo un bid por turno (por trick)
  const hasBidInCurrentTrick = playerBids.some(pb => pb.trickNumber === trickNumber)
  if (hasBidInCurrentTrick) {
    return {
      canMakeBid: false,
      reason: 'Solo puedes hacer un bid por turno'
    }
  }

  // Rule: No se pueden hacer dos bids del mismo tipo en una ronda
  const hasBidTypeInRound = playerBids.some(pb => {
    const bid = game.round.roundBids.bids.find(b => b.bid_id === pb.bidId)
    return bid?.bid_type === bidType
  })
  
  if (hasBidTypeInRound) {
    return {
      canMakeBid: false,
      reason: 'Ya tienes un bid de este tipo en esta ronda'
    }
  }

  // Rule: Máximo 3 bids por ronda
  if (playerBids.length >= 3) {
    return {
      canMakeBid: false,
      reason: 'Ya tienes el máximo de 3 bids en esta ronda'
    }
  }

  // Rule: Máximo 2 jugadores por bid específico
  const allBidsFull = availableBids.every(bid => {
    const biddersCount = Object.values(game.round.roundBids.playerBids)
      .flat()
      .filter(pb => pb.bidId === bid.bid_id)
      .length
    return biddersCount >= 2
  })
  
  if (allBidsFull) {
    return {
      canMakeBid: false,
      reason: 'Todos los bids de este tipo ya tienen el máximo de 2 jugadores'
    }
  }

  // Rule: Verificar si la apuesta ya está perdida de antemano
  const playerRoundScore = game.round.roundScore.find(score => score.playerId === playerId)
  if (playerRoundScore) {
    // Para trick bids: verificar condiciones de tricks
    if (bidType === 'trick') {
      for (const bid of availableBids) {
        const condition = bid.win_condition as import('../interfaces/Bid').TrickBidCondition
        
        // Verificar win_trick_position: si debíamos ganar un trick específico y ya lo perdimos
        if (condition.win_trick_position) {
          const lostRequiredTrick = condition.win_trick_position.some(
            requiredTrick => requiredTrick < trickNumber && !playerRoundScore.tricksWon.includes(requiredTrick)
          )
          if (lostRequiredTrick) {
            return {
              canMakeBid: false,
              reason: 'Ya perdiste un trick que debías ganar'
            }
          }
        }
        
        // Verificar lose_trick_position: si debíamos perder un trick específico y ya lo ganamos
        if (condition.lose_trick_position) {
          const wonForbiddenTrick = condition.lose_trick_position.some(
            forbiddenTrick => playerRoundScore.tricksWon.includes(forbiddenTrick)
          )
          if (wonForbiddenTrick) {
            return {
              canMakeBid: false,
              reason: 'Ya ganaste un trick que debías perder'
            }
          }
        }
        
        // Verificar win_min_tricks: si ya es imposible alcanzar el mínimo
        if (condition.win_min_tricks) {
          const tricksWonSoFar = playerRoundScore.tricksWon.length
          const tricksRemaining = 6 - (game.round.currentTrick?.trick_number || 1) + 1
          const maxPossibleTricks = tricksWonSoFar + tricksRemaining
          
          if (maxPossibleTricks < condition.win_min_tricks) {
            return {
              canMakeBid: false,
              reason: 'Ya no puedes alcanzar el mínimo de tricks requeridos'
            }
          }
        }
        
        // Verificar win_max_tricks: si ya superamos el máximo
        if (condition.win_max_tricks !== undefined) {
          const tricksWonSoFar = playerRoundScore.tricksWon.length
          
          if (tricksWonSoFar > condition.win_max_tricks) {
            return {
              canMakeBid: false,
              reason: 'Ya superaste el máximo de tricks permitidos'
            }
          }
        }
      }
    }
    
    // Para points bids: verificar si ya superamos el max_points
    if (bidType === 'points') {
      for (const bid of availableBids) {
        const condition = bid.win_condition as import('../interfaces/Bid').PointsBidCondition
        
        if (playerRoundScore.points > condition.max_points) {
          return {
            canMakeBid: false,
            reason: 'Ya superaste el máximo de puntos permitidos'
          }
        }
      }
    }
    
    // Para set_collection: no hay validaciones (siempre hay posibilidad de revertir)
  }

  return {
    canMakeBid: true
  }
}

/**
 * Calcula la penalización (onLose) por fallar un bid según las reglas del juego
 * 
 * Reglas:
 * - set_collection: -10 (trick 1), -15 (trick 2), -20 (trick 3)
 * - trick/points: -20 (trick 1), -25 (trick 2), -30 (trick 3)
 */
export function calculateBidOnLose(
  bidType: BidType,
  trickNumber: TrickNumber
): number {
  if (bidType === 'set_collection') {
    if (trickNumber === 1) return -10
    if (trickNumber === 2) return -15
    if (trickNumber === 3) return -20
  }
  
  if (bidType === 'trick' || bidType === 'points') {
    if (trickNumber === 1) return -20
    if (trickNumber === 2) return -25
    if (trickNumber === 3) return -30
  }
  
  return 0
}

/**
 * Determina si un bid está siendo ganado actualmente (parcial o final)
 * @param bid - El bid a evaluar
 * @param playerRoundScore - El score del jugador en el round actual
 * @param isRoundComplete - Si el round ya terminó (para evaluación final)
 * @returns true si está ganando, false si está perdiendo, null si aún no se puede determinar
 */
export function isWinningBid(
  bid: import('../interfaces/Bid').Bid,
  playerRoundScore: import('../interfaces/Round').PlayerRoundScore,
  isRoundComplete: boolean = false
): boolean | null {
  const bidType = bid.bid_type;

  // TRICK BIDS
  if (bidType === 'trick') {
    const condition = bid.win_condition as import('../interfaces/Bid').TrickBidCondition;
    const tricksWon = playerRoundScore.tricksWon;
    const tricksWonCount = tricksWon.length;

    // Verificar lose_trick_position: si ganó un trick que debía perder
    if (condition.lose_trick_position) {
      const wonForbiddenTrick = condition.lose_trick_position.some(
        forbiddenTrick => tricksWon.includes(forbiddenTrick)
      );
      if (wonForbiddenTrick) return false;
    }

    // Verificar win_trick_position: si debía ganar tricks específicos
    if (condition.win_trick_position) {
      const requiredTricks = condition.win_trick_position;
      const wonAllRequired = requiredTricks.every(t => tricksWon.includes(t));
      
      if (isRoundComplete) {
        return wonAllRequired;
      } else {
        const lostRequiredTrick = requiredTricks.some(
          t => !tricksWon.includes(t)
        );
        if (lostRequiredTrick && isRoundComplete) return false;
        if (wonAllRequired) return true;
        return null;
      }
    }

    // Verificar win_min_tricks y win_max_tricks
    if (condition.win_min_tricks !== undefined || condition.win_max_tricks !== undefined) {
      const minTricks = condition.win_min_tricks ?? 0;
      const maxTricks = condition.win_max_tricks ?? 5;

      if (tricksWonCount > maxTricks) return false;
      
      if (isRoundComplete) {
        return tricksWonCount >= minTricks && tricksWonCount <= maxTricks;
      } else {
        const tricksRemaining = 5 - tricksWonCount;
        const maxPossible = tricksWonCount + tricksRemaining;
        
        if (maxPossible < minTricks) return false;
        if (tricksWonCount >= minTricks && tricksWonCount <= maxTricks) return true;
        return null;
      }
    }

    return null;
  }

  // POINTS BIDS
  if (bidType === 'points') {
    const condition = bid.win_condition as import('../interfaces/Bid').PointsBidCondition;
    const points = playerRoundScore.points;

    if (points > condition.max_points) return false;

    if (isRoundComplete) {
      return points >= condition.min_points && points <= condition.max_points;
    } else {
      if (points > condition.max_points) return false;
      if (points >= condition.min_points && points <= condition.max_points) return true;
      return null;
    }
  }

  // SET COLLECTION BIDS
  if (bidType === 'set_collection') {
    const condition = bid.win_condition as import('../interfaces/Bid').SetCollectionBidCondition;
    const winSuitCount = playerRoundScore.setCollection[condition.win_suit];
    const avoidSuitCount = playerRoundScore.setCollection[condition.avoid_suit];

    // Calcular puntos netos: (winSuit * 10) - (avoidSuit * 10)
    const winPoints = winSuitCount * 10;
    const avoidPenalty = avoidSuitCount * 10;
    const netPoints = winPoints - avoidPenalty;

    if (isRoundComplete) {
      // Gana si los puntos netos son >= 10
      return netPoints >= 10;
    } else {
      // Durante el round, evaluamos parcialmente
      if (netPoints < 10 && avoidSuitCount > 0) return false;
      if (netPoints >= 10) return true;
      return null; // Aún no se puede determinar
    }
  }

  return null;
}

/**
 * Calcula el score que obtiene un jugador al final del round
 * basado en sus bids ganados/perdidos y los points del round
 * @param game - El estado completo del juego
 * @param playerId - ID del jugador
 * @returns Score total del round (puede ser negativo)
 */
export function getPlayerScoreFromRound(
  game: Game,
  playerId: PlayerId
): number {
  const playerRoundScore = game.round.roundScore.find(s => s.playerId === playerId);
  if (!playerRoundScore) return 0;

  const playerBids = game.round.roundBids.playerBids[playerId] || [];
  let totalScore = playerRoundScore.points;

  for (const bidEntry of playerBids) {
    const bid = game.round.roundBids.bids.find(b => b.bid_id === bidEntry.bidId);
    if (!bid) continue;

    const isWinning = isWinningBid(bid, playerRoundScore, true);

    if (isWinning === true) {
      if (bid.bid_type === 'set_collection') {
        // Calcular puntos netos: (winSuit * 10) - (avoidSuit * |onLose|)
        const condition = bid.win_condition as import('../interfaces/Bid').SetCollectionBidCondition;
        const winSuitCount = playerRoundScore.setCollection[condition.win_suit];
        const avoidSuitCount = playerRoundScore.setCollection[condition.avoid_suit];
        const penaltyPerCard = Math.abs(bidEntry.onLose); // 10, 15, o 20 según trick
        const netPoints = (winSuitCount * 10) - (avoidSuitCount * penaltyPerCard);
        totalScore += netPoints;
      } else {
        totalScore += bid.bid_score;
      }
    } else if (isWinning === false) {
      if (bid.bid_type === 'set_collection') {
        // Calcular puntos netos
        const condition = bid.win_condition as import('../interfaces/Bid').SetCollectionBidCondition;
        const winSuitCount = playerRoundScore.setCollection[condition.win_suit];
        const avoidSuitCount = playerRoundScore.setCollection[condition.avoid_suit];
        const penaltyPerCard = Math.abs(bidEntry.onLose); // 10, 15, o 20 según trick
        const netPoints = (winSuitCount * 10) - (avoidSuitCount * penaltyPerCard);
        
        // Si está entre -9 y 9: pierde con -10 fijo
        // Si es <= -10: pierde con ese valor
        if (netPoints >= -9 && netPoints <= 9) {
          totalScore += -10;
        } else {
          totalScore += netPoints;
        }
      } else {
        totalScore += bidEntry.onLose;
      }
    }
  }

  return totalScore;
}

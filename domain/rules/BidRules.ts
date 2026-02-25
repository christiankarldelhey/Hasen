import type { Game } from '../interfaces/Game'
import type { PlayerId } from '../interfaces/Player'
import type { BidType } from '../interfaces/Bid'
import type { TrickNumber } from '../interfaces/Trick'

export interface CanMakeBidResult {
  canMakeBid: boolean
  reason?: string
}

/**
 * Valida si un bid específico puede ser hecho por el jugador
 * @param game - Estado del juego
 * @param playerId - ID del jugador
 * @param bid - El bid específico a validar
 * @param trickNumber - Número del trick actual
 * @returns Resultado de la validación con razón específica si no es posible
 */
export function canMakeSpecificBid(
  game: Game,
  playerId: PlayerId,
  bid: import('../interfaces/Bid').Bid,
  trickNumber: TrickNumber
): CanMakeBidResult {
  // Primero validar las reglas generales usando canMakeBid
  const generalValidation = canMakeBid(game, playerId, bid.bid_type, trickNumber)
  if (!generalValidation.canMakeBid) {
    return generalValidation
  }

  // Validaciones específicas del bid individual
  
  // Rule: Máximo 2 jugadores por bid específico
  const biddersCount = Object.values(game.round.roundBids.playerBids)
    .flat()
    .filter(pb => pb.bidId === bid.bid_id)
    .length
  
  if (biddersCount >= 2) {
    return {
      canMakeBid: false,
      reason: 'This bid already has the maximum of 2 players'
    }
  }

  // Validaciones específicas según el progreso del jugador para este bid en particular
  const playerRoundScore = game.round.roundScore.find(score => score.playerId === playerId)
  if (playerRoundScore) {
    // Para trick bids: verificar si este bid específico es todavía posible
    if (bid.bid_type === 'trick') {
      const condition = bid.win_condition as import('../interfaces/Bid').TrickBidCondition
      const tricksWonSoFar = new Set(playerRoundScore.tricksWon).size
      const tricksRemaining = 6 - (game.round.currentTrick?.trick_number || 1) + 1
      const maxPossibleTricks = tricksWonSoFar + tricksRemaining
      
      // Verificar win_trick_position: si debíamos ganar un trick específico y ya lo perdimos
      if (condition.win_trick_position) {
        const lostRequiredTrick = condition.win_trick_position.some(
          requiredTrick => requiredTrick < trickNumber && !playerRoundScore.tricksWon.includes(requiredTrick)
        )
        if (lostRequiredTrick) {
          return {
            canMakeBid: false,
            reason: 'You already lost a trick you needed to win'
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
            reason: 'You already won a trick you needed to lose'
          }
        }
      }
      
      // Verificar win_min_tricks: si ya es imposible alcanzar el mínimo
      if (condition.win_min_tricks) {
        if (maxPossibleTricks < condition.win_min_tricks) {
          return {
            canMakeBid: false,
            reason: 'You can no longer reach the minimum required tricks'
          }
        }
      }
      
      // Verificar win_max_tricks: si ya superamos el máximo
      if (condition.win_max_tricks !== undefined) {
        if (tricksWonSoFar > condition.win_max_tricks) {
          return {
            canMakeBid: false,
            reason: 'You already exceeded the maximum allowed tricks'
          }
        }
      }
    }
    
    // Para points bids: verificar si ya superamos el max_points de este bid específico
    if (bid.bid_type === 'points') {
      const condition = bid.win_condition as import('../interfaces/Bid').PointsBidCondition
      
      if (playerRoundScore.points > condition.max_points) {
        return {
          canMakeBid: false,
          reason: 'You have exceeded the maximum points for this bid'
        }
      }
    }
    
    // Para set_collection: no hay validaciones (siempre hay posibilidad de revertir)
  }

  return {
    canMakeBid: true
  }
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
      reason: 'Not your turn'
    }
  }

  if (trickNumber > 3) {
    return {
      canMakeBid: false,
      reason: 'You can only make bids in the first 3 tricks'
    }
  }

  const trickState = game.round.currentTrick?.trick_state
  const isBidWindowOpen = trickState === 'in_progress'

  if (!game.round.currentTrick || !isBidWindowOpen) {
    return {
      canMakeBid: false,
      reason: 'Trick must be active to make a bid'
    }
  }

  const availableBids = game.round.roundBids.bids.filter(b => b.bid_type === bidType)
  
  if (availableBids.length === 0) {
    return {
      canMakeBid: false,
      reason: 'No bids available of this type'
    }
  }

  const playerBids = game.round.roundBids.playerBids[playerId] || []
  
  // Rule: Solo un bid por turno (por trick)
  const hasBidInCurrentTrick = playerBids.some(pb => pb.trickNumber === trickNumber)
  if (hasBidInCurrentTrick) {
    return {
      canMakeBid: false,
      reason: 'You can only make one bid per trick'
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
      reason: 'You already have a bid of this type in this round'
    }
  }

  // Rule: Máximo 3 bids por ronda
  if (playerBids.length >= 3) {
    return {
      canMakeBid: false,
      reason: 'You already have the maximum of 3 bids in this round'
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
      reason: 'All bids of this type already have the maximum of 2 players'
    }
  }

  // Rule: Verificar si la apuesta ya está perdida de antemano
  const playerRoundScore = game.round.roundScore.find(score => score.playerId === playerId)
  if (playerRoundScore) {
    // Para trick bids: verificar si al menos un bid disponible es todavía posible
    if (bidType === 'trick') {
      const tricksWonSoFar = new Set(playerRoundScore.tricksWon).size
      const tricksRemaining = 6 - (game.round.currentTrick?.trick_number || 1) + 1
      const maxPossibleTricks = tricksWonSoFar + tricksRemaining
      
      // Verificar si existe al menos un bid que todavía sea posible
      const hasAnyPossibleBid = availableBids.some(bid => {
        const condition = bid.win_condition as import('../interfaces/Bid').TrickBidCondition
        
        // Verificar win_trick_position: si debíamos ganar un trick específico y ya lo perdimos
        if (condition.win_trick_position) {
          const lostRequiredTrick = condition.win_trick_position.some(
            requiredTrick => requiredTrick < trickNumber && !playerRoundScore.tricksWon.includes(requiredTrick)
          )
          if (lostRequiredTrick) return false
        }
        
        // Verificar lose_trick_position: si debíamos perder un trick específico y ya lo ganamos
        if (condition.lose_trick_position) {
          const wonForbiddenTrick = condition.lose_trick_position.some(
            forbiddenTrick => playerRoundScore.tricksWon.includes(forbiddenTrick)
          )
          if (wonForbiddenTrick) return false
        }
        
        // Verificar win_min_tricks: si ya es imposible alcanzar el mínimo
        if (condition.win_min_tricks) {
          if (maxPossibleTricks < condition.win_min_tricks) return false
        }
        
        // Verificar win_max_tricks: si ya superamos el máximo
        if (condition.win_max_tricks !== undefined) {
          if (tricksWonSoFar > condition.win_max_tricks) return false
        }
        
        // Este bid todavía es posible
        return true
      })
      
      if (!hasAnyPossibleBid) {
        return {
          canMakeBid: false,
          reason: 'No trick bids are possible given your current progress'
        }
      }
    }
    
    // Para points bids: verificar si existe al menos un bid que todavía sea posible
    if (bidType === 'points') {
      const hasAnyPossibleBid = availableBids.some(bid => {
        const condition = bid.win_condition as import('../interfaces/Bid').PointsBidCondition
        return playerRoundScore.points <= condition.max_points
      })
      
      if (!hasAnyPossibleBid) {
        return {
          canMakeBid: false,
          reason: 'No points bids are possible given your current points'
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
    const tricksWonCount = new Set(tricksWon).size;

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
        const tricksRemaining = 5 - new Set(tricksWon).size;
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
  // Si el jugador NO hizo apuestas, usar card points como fallback
  // Si hizo apuestas, empezar en 0 y solo sumar bid scores
  let totalScore = playerBids.length === 0 ? playerRoundScore.points : 0;

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

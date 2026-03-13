import type { BidType, Game, PlayerId } from '@domain/interfaces'

export type BotAction =
  | { type: 'skip_replacement' }
  | { type: 'replace_card'; cardId: string; position: number }
  | { type: 'make_bid'; bidType: BidType; bidId: string }
  | { type: 'play_card'; cardId: string }
  | { type: 'finish_trick' }
  | { type: 'select_next_lead'; selectedLeadPlayer: PlayerId }
  | { type: 'select_card_to_steal'; selectedCardId: string }
  | { type: 'ready_next_round' }

export interface AgentDecisionContext {
  game: Game
  playerId: PlayerId
  legalActions: BotAction[]
}

export interface AgentPolicy {
  decide(context: AgentDecisionContext): Promise<BotAction | null> | BotAction | null
}

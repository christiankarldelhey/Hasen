import type { AgentDecisionContext, AgentPolicy, BotAction } from './AgentPolicy.js'
import {
  scoreBidAction,
  scoreNextLeadAction,
  scorePlayCardAction,
  scoreReplacementAction,
  scoreSkipReplacement,
  scoreStealAction,
  shouldMakeBid
} from './heuristicStrategy.js'

function scoreAction(action: BotAction, context: AgentDecisionContext): number {
  switch (action.type) {
    case 'finish_trick':
      return 100
    case 'select_card_to_steal':
      return scoreStealAction(action, context)
    case 'select_next_lead':
      return scoreNextLeadAction(action, context)
    case 'ready_next_round':
      return 80
    case 'skip_replacement':
      return scoreSkipReplacement(context)
    case 'make_bid':
      return scoreBidAction(action, context)
    case 'play_card':
      return scorePlayCardAction(action, context)
    case 'replace_card':
      return scoreReplacementAction(action, context)
    default:
      return 0
  }
}

export class HeuristicAgent implements AgentPolicy {
  async decide(context: AgentDecisionContext): Promise<BotAction | null> {
    if (context.legalActions.length === 0) {
      return null
    }

    const trick = context.game.round.currentTrick
    if (trick?.trick_state === 'in_progress') {
      const bidActions = context.legalActions.filter(
        (action): action is Extract<BotAction, { type: 'make_bid' }> => action.type === 'make_bid'
      )
      const scoredBids = bidActions
        .map(action => ({ action, score: scoreBidAction(action, context) }))
        .sort((a, b) => b.score - a.score)

      if (scoredBids.length > 0 && shouldMakeBid(scoredBids[0].score)) {
        return scoredBids[0].action
      }
    }

    const scoredActions = context.legalActions
      .filter(action => action.type !== 'make_bid')
      .map(action => ({ action, score: scoreAction(action, context) }))
      .sort((a, b) => b.score - a.score)

    return scoredActions[0]?.action ?? null
  }
}

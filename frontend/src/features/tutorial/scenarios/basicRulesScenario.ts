import type { TutorialScenario } from '../core/tutorialTypes'

export const basicRulesScenario: TutorialScenario = {
  id: 'basic-rules',
  title: 'tutorial.scenarios.basicRules.title',
  steps: [
    {
      id: 'deck-zone',
      title: 'tutorial.scenarios.basicRules.steps.deckZone.title',
      description: 'tutorial.scenarios.basicRules.steps.deckZone.description',
      targetId: 'deck-zone'
    },
    {
      id: 'player-hand',
      title: 'tutorial.scenarios.basicRules.steps.playerHand.title',
      description: 'tutorial.scenarios.basicRules.steps.playerHand.description',
      targetId: 'player-hand'
    },
    {
      id: 'other-players-zone',
      title: 'tutorial.scenarios.basicRules.steps.otherPlayersZone.title',
      description: 'tutorial.scenarios.basicRules.steps.otherPlayersZone.description',
      targetId: 'other-players-zone'
    },
    {
      id: 'available-bids',
      title: 'tutorial.scenarios.basicRules.steps.availableBids.title',
      description: 'tutorial.scenarios.basicRules.steps.availableBids.description',
      targetId: 'available-bids'
    },
    {
      id: 'trick-center',
      title: 'tutorial.scenarios.basicRules.steps.trickCenter.title',
      description: 'tutorial.scenarios.basicRules.steps.trickCenter.description',
      targetId: 'trick-center'
    },
    {
      id: 'game-scores',
      title: 'tutorial.scenarios.basicRules.steps.gameScores.title',
      description: 'tutorial.scenarios.basicRules.steps.gameScores.description',
      targetId: 'game-scores'
    },
    {
      id: 'player-round-score',
      title: 'tutorial.scenarios.basicRules.steps.playerRoundScore.title',
      description: 'tutorial.scenarios.basicRules.steps.playerRoundScore.description',
      targetId: 'player-round-score'
    },
    {
      id: 'game-controls',
      title: 'tutorial.scenarios.basicRules.steps.gameControls.title',
      description: 'tutorial.scenarios.basicRules.steps.gameControls.description',
      targetId: 'game-controls'
    }
  ]
}

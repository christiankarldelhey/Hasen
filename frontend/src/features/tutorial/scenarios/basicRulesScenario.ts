import type { TutorialScenario } from '../core/tutorialTypes'

export const basicRulesScenario: TutorialScenario = {
  id: 'basic-rules',
  title: 'Hasen basic tutorial',
  steps: [
    {
      id: 'deck-zone',
      title: 'The deck',
      description: 'This is the main deck, where cards are managed during the round.',
      targetId: 'deck-zone'
    },
    {
      id: 'player-hand',
      title: 'Your play area',
      description: 'Here you can see your hand and your main actions during your turn.',
      targetId: 'player-hand'
    },
    {
      id: 'other-players-zone',
      title: 'Other players area',
      description: 'These are the visible hands and statuses of your opponents.',
      targetId: 'other-players-zone'
    },
    {
      id: 'available-bids',
      title: 'Available bids',
      description: 'Here you can review and plan the bids you can declare in this round.',
      targetId: 'available-bids'
    },
    {
      id: 'trick-center',
      title: 'Trick center',
      description: 'In this area you can see the played cards and which card is currently winning the trick.',
      targetId: 'trick-center'
    },
    {
      id: 'game-scores',
      title: 'Global score',
      description: 'This panel shows the accumulated score of all players in the match.',
      targetId: 'game-scores'
    },
    {
      id: 'player-round-score',
      title: 'Your round score',
      description: 'Here you can track your current round progress: tricks, points, and combinations.',
      targetId: 'player-round-score'
    },
    {
      id: 'game-controls',
      title: 'Game controls',
      description: 'From here you can leave the match and toggle music and sound effects.',
      targetId: 'game-controls'
    }
  ]
}

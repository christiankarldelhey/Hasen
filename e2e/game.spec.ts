import { expect, test } from '@playwright/test'

test.describe('Game view smoke', () => {
  const mockPlayableGameState = {
    success: true,
    data: {
      publicState: {
        gameId: 'game-e2e-live',
        gameName: 'E2E Live',
        hostPlayer: 'player_1',
        activePlayers: [
          { id: 'player_1', name: 'Lenz', color: '#B89B5E', defaultAvatar: 'avatar1.png' },
          { id: 'player_2', name: 'Anna', color: '#5E6F68', defaultAvatar: 'avatar2.png' }
        ],
        gamePhase: 'playing',
        publicCards: {
          op1: {
            id: 'op1',
            suit: 'leaves',
            char: '7',
            rank: { base: 3, onSuit: 8 },
            owner: 'player_2',
            state: 'in_hand_visible',
            points: 0,
            spritePos: { row: 1, col: 2 }
          }
        },
        opponentsPublicInfo: [
          { playerId: 'player_2', publicCardId: 'op1', handCardsCount: 5 }
        ],
        playerTurnOrder: ['player_1', 'player_2'],
        round: {
          round: 1,
          roundPhase: 'playing',
          playerTurn: 'player_1',
          currentTrick: {
            trick_id: 'trick_1',
            trick_state: 'in_progress',
            trick_number: 1,
            lead_player: 'player_1',
            winning_card: null,
            lead_suit: null,
            cards: [],
            score: {
              trick_winner: null,
              trick_points: 0,
              trick_collections: null
            }
          },
          roundBids: {
            bids: [],
            playerBids: {
              player_1: [],
              player_2: []
            }
          },
          roundScore: [
            {
              playerId: 'player_1',
              points: 0,
              tricksWon: [],
              setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
            },
            {
              playerId: 'player_2',
              points: 0,
              tricksWon: [],
              setCollection: { acorns: 0, leaves: 0, berries: 0, flowers: 0 }
            }
          ]
        },
        playerScores: [
          { playerId: 'player_1', score: 0 },
          { playerId: 'player_2', score: 0 }
        ],
        winner: null,
        playerConnectionStatus: {
          player_1: 'connected',
          player_2: 'connected'
        },
        isPaused: false,
        pauseReason: null,
        gameSettings: {
          minPlayers: 2,
          maxPlayers: 2,
          pointsToWin: 300,
          reconnectionTimeoutMinutes: 2
        }
      },
      privateState: {
        playerId: 'player_1',
        hand: [
          {
            id: 'h1',
            suit: 'acorns',
            char: 'A',
            rank: { base: 33, onSuit: 40 },
            owner: 'player_1',
            state: 'in_hand_hidden',
            points: 11,
            spritePos: { row: 0, col: 0 }
          },
          {
            id: 'h2',
            suit: 'berries',
            char: '10',
            rank: { base: 10, onSuit: 10 },
            owner: 'player_1',
            state: 'in_hand_hidden',
            points: 10,
            spritePos: { row: 2, col: 4 }
          }
        ]
      }
    }
  }

  test('shows error state when game cannot be loaded', async ({ page }) => {
    await page.route('**/api/games/game-e2e-smoke**', async route => {
      await route.fulfill({
        status: 404,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: 'Game not found'
        })
      })
    })

    await page.goto('/game/game-e2e-smoke')

    await expect(page.getByTestId('game-error')).toBeVisible()
    await expect(page.getByText('Error')).toBeVisible()
    await expect(page.getByText('Failed to load game')).toBeVisible()
  })

  test('loads simplified real game flow and lets player leave to lobby', async ({ page }) => {
    await page.route('**/api/games/game-e2e-live**', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockPlayableGameState)
      })
    })

    await page.route('**/api/games', async route => {
      if (route.request().method() === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, data: [] })
        })
        return
      }
      await route.continue()
    })

    await page.goto('/game/game-e2e-live')

    await expect(page.getByTestId('game-board')).toBeVisible()
    await expect(page.getByTestId('game-info-panel')).toBeVisible()

    await page.getByTestId('game-logout-btn').click()
    await expect(page.getByText('Leave game?')).toBeVisible()
    await page.getByRole('button', { name: 'Confirm' }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByTestId('lobby-menu')).toBeVisible()
  })
})

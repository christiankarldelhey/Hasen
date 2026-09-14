import type { ScriptedMatch } from '../core/scriptedRound'

// A full scripted 3-round match for the interactive tutorial. Winners, steals
// and scores are derived from the real domain rules in scriptedRound.ts; only
// the cards are authored here.
//
// R1 — general flow (swap, points bet, trick hierarchy, the Owl)
// R2 — collection bets (a leaves-heavy hand + the Sparrow stealing a card)
// R3 — trick bets (the Woodpecker picking the next lead, passing the swap)
export const firstMatchScript: ScriptedMatch = {
  rounds: [
    // ------------------------------------------------------------------ R1
    // Lenz: acorns 9 (vis) · flowers K · berries 10 · leaves 8 · acorns O
    //   swap leaves 8 → berries S (the Owl). Points bet "35+" (+60, window 1).
    // T1 Lenz acorns O wins (6) · T2 Anna flowers 2 wins (0) ·
    // T3 Lenz flowers K wins (11) · T4 Lenz Owl wins (2) · T5 Lenz berries 10 (20)
    // → 39 card points, bet made: +60.
    {
      hands: {
        player_1: {
          visible: { suit: 'acorns', char: '9' },
          hidden: [
            { suit: 'flowers', char: 'K' },
            { suit: 'berries', char: '10' },
            { suit: 'leaves', char: '8' },
            { suit: 'acorns', char: 'O' }
          ]
        },
        player_2: {
          visible: { suit: 'leaves', char: '8' },
          hidden: [
            { suit: 'acorns', char: '7' },
            { suit: 'flowers', char: '2' },
            { suit: 'berries', char: '7' },
            { suit: 'leaves', char: '5' }
          ]
        },
        player_3: {
          visible: { suit: 'berries', char: 'U' },
          hidden: [
            { suit: 'leaves', char: '10' },
            { suit: 'acorns', char: '8' },
            { suit: 'berries', char: '9' },
            { suit: 'leaves', char: '7' }
          ]
        },
        player_4: {
          visible: { suit: 'flowers', char: '3' },
          hidden: [
            { suit: 'acorns', char: 'U' },
            { suit: 'leaves', char: '6' },
            { suit: 'flowers', char: '1' },
            { suit: 'acorns', char: '5' }
          ]
        }
      },
      swap: { discard: { suit: 'leaves', char: '8' }, draw: { suit: 'berries', char: 'S' } },
      swapSkippedBy: ['player_2', 'player_4'],
      tricks: [
        [
          { owner: 'player_1', suit: 'acorns', char: 'O' },
          { owner: 'player_2', suit: 'acorns', char: '7' },
          { owner: 'player_3', suit: 'acorns', char: '8' },
          { owner: 'player_4', suit: 'acorns', char: 'U' }
        ],
        [
          { owner: 'player_1', suit: 'acorns', char: '9' },
          { owner: 'player_2', suit: 'flowers', char: '2' },
          { owner: 'player_3', suit: 'leaves', char: '7' },
          { owner: 'player_4', suit: 'acorns', char: '5' }
        ],
        [
          { owner: 'player_2', suit: 'berries', char: '7' },
          { owner: 'player_3', suit: 'berries', char: '9' },
          { owner: 'player_4', suit: 'flowers', char: '1' },
          { owner: 'player_1', suit: 'flowers', char: 'K' }
        ],
        [
          { owner: 'player_1', suit: 'berries', char: 'S' },
          { owner: 'player_2', suit: 'leaves', char: '5' },
          { owner: 'player_3', suit: 'berries', char: 'U' },
          { owner: 'player_4', suit: 'flowers', char: '3' }
        ],
        [
          { owner: 'player_1', suit: 'berries', char: '10' },
          { owner: 'player_2', suit: 'leaves', char: '8' },
          { owner: 'player_3', suit: 'leaves', char: '10' },
          { owner: 'player_4', suit: 'leaves', char: '6' }
        ]
      ],
      bids: [
        { bid_id: 'trick-1', bid_type: 'trick', bid_score: 40, win_condition: { win_min_tricks: 3, win_max_tricks: 3 } },
        { bid_id: 'trick-2', bid_type: 'trick', bid_score: 50, win_condition: { win_min_tricks: 1, win_max_tricks: 1 } },
        { bid_id: 'points-1', bid_type: 'points', bid_score: 40, win_condition: { min_points: 11, max_points: 30 } },
        { bid_id: 'points-2', bid_type: 'points', bid_score: 60, win_condition: { min_points: 35, max_points: 100 } },
        { bid_id: 'set-1', bid_type: 'set_collection', bid_score: 10, win_condition: { win_suit: 'acorns', avoid_suit: 'leaves' } },
        { bid_id: 'set-2', bid_type: 'set_collection', bid_score: 10, win_condition: { win_suit: 'berries', avoid_suit: 'acorns' } }
      ],
      playerBids: [{ bidId: 'points-2', trickNumber: 1 }]
    },

    // ------------------------------------------------------------------ R2
    // Collection bets: Lenz gets a leaves-heavy hand + the Sparrow.
    // Bet: collect leaves / avoid flowers (window 1, −10 per forbidden card).
    // T1 Anna leads leaves — Magda's Unter (major color) wins the trick, but
    // Lenz's Sparrow steals the 10 of leaves. T2–T4 Lenz wins; T5 Magda's
    // 4 of flowers takes it. Pile: 3 wanted leaves, 0 flowers → net 30 → +30.
    {
      hands: {
        player_1: {
          visible: { suit: 'leaves', char: '6' },
          hidden: [
            { suit: 'leaves', char: '7' },
            { suit: 'leaves', char: 'S' },
            { suit: 'berries', char: '9' },
            { suit: 'acorns', char: '10' }
          ]
        },
        player_2: {
          visible: { suit: 'berries', char: '8' },
          hidden: [
            { suit: 'leaves', char: '10' },
            { suit: 'acorns', char: '6' },
            { suit: 'berries', char: 'U' },
            { suit: 'acorns', char: '9' }
          ]
        },
        player_3: {
          visible: { suit: 'flowers', char: '2' },
          hidden: [
            { suit: 'leaves', char: '8' },
            { suit: 'berries', char: '10' },
            { suit: 'acorns', char: '5' },
            { suit: 'berries', char: '6' }
          ]
        },
        player_4: {
          visible: { suit: 'acorns', char: '7' },
          hidden: [
            { suit: 'leaves', char: 'U' },
            { suit: 'berries', char: '7' },
            { suit: 'flowers', char: '4' },
            { suit: 'acorns', char: '8' }
          ]
        }
      },
      swap: { discard: { suit: 'berries', char: '9' }, draw: { suit: 'leaves', char: '9' } },
      swapSkippedBy: ['player_3'],
      tricks: [
        [
          { owner: 'player_2', suit: 'leaves', char: '10' },
          { owner: 'player_3', suit: 'leaves', char: '8' },
          { owner: 'player_4', suit: 'leaves', char: 'U' },
          { owner: 'player_1', suit: 'leaves', char: 'S' }
        ],
        [
          { owner: 'player_4', suit: 'acorns', char: '8' },
          { owner: 'player_1', suit: 'acorns', char: '10' },
          { owner: 'player_2', suit: 'acorns', char: '6' },
          { owner: 'player_3', suit: 'acorns', char: '5' }
        ],
        [
          { owner: 'player_1', suit: 'leaves', char: '9' },
          { owner: 'player_2', suit: 'berries', char: '8' },
          { owner: 'player_3', suit: 'berries', char: '10' },
          { owner: 'player_4', suit: 'berries', char: '7' }
        ],
        [
          { owner: 'player_1', suit: 'leaves', char: '6' },
          { owner: 'player_2', suit: 'acorns', char: '9' },
          { owner: 'player_3', suit: 'berries', char: '6' },
          { owner: 'player_4', suit: 'acorns', char: '7' }
        ],
        [
          { owner: 'player_1', suit: 'leaves', char: '7' },
          { owner: 'player_2', suit: 'berries', char: 'U' },
          { owner: 'player_3', suit: 'flowers', char: '2' },
          { owner: 'player_4', suit: 'flowers', char: '4' }
        ]
      ],
      steals: [{ trick: 1, by: 'player_1', card: { suit: 'leaves', char: '10' } }],
      bids: [
        { bid_id: 'trick-1', bid_type: 'trick', bid_score: 50, win_condition: { win_min_tricks: 2, win_max_tricks: 2 } },
        { bid_id: 'trick-2', bid_type: 'trick', bid_score: 70, win_condition: { win_min_tricks: 4, win_max_tricks: 5 } },
        { bid_id: 'points-1', bid_type: 'points', bid_score: 45, win_condition: { min_points: 16, max_points: 35 } },
        { bid_id: 'points-2', bid_type: 'points', bid_score: 65, win_condition: { min_points: 36, max_points: 100 } },
        { bid_id: 'set-1', bid_type: 'set_collection', bid_score: 10, win_condition: { win_suit: 'leaves', avoid_suit: 'flowers' } },
        { bid_id: 'set-2', bid_type: 'set_collection', bid_score: 10, win_condition: { win_suit: 'berries', avoid_suit: 'leaves' } }
      ],
      playerBids: [{ bidId: 'set-1', trickNumber: 1 }]
    },

    // ------------------------------------------------------------------ R3
    // Trick bets: "win exactly 2" (+55, window 1). Lenz passes the swap (+3),
    // wins T2 with the 10 of acorns, drops the Woodpecker in T4 (Anna's flower
    // wins the trick, but Lenz picks the next lead: himself), then wins T5
    // with the 5 of flowers → exactly 2 tricks.
    {
      hands: {
        player_1: {
          visible: { suit: 'berries', char: '9' },
          hidden: [
            { suit: 'acorns', char: '10' },
            { suit: 'flowers', char: '5' },
            { suit: 'acorns', char: 'S' },
            { suit: 'berries', char: 'O' }
          ]
        },
        player_2: {
          visible: { suit: 'leaves', char: '9' },
          hidden: [
            { suit: 'flowers', char: '1' },
            { suit: 'acorns', char: '9' },
            { suit: 'berries', char: '8' },
            { suit: 'leaves', char: '10' }
          ]
        },
        player_3: {
          visible: { suit: 'acorns', char: '7' },
          hidden: [
            { suit: 'berries', char: '10' },
            { suit: 'flowers', char: 'Q' },
            { suit: 'acorns', char: '8' },
            { suit: 'leaves', char: '7' }
          ]
        },
        player_4: {
          visible: { suit: 'acorns', char: '6' },
          hidden: [
            { suit: 'berries', char: 'O' },
            { suit: 'leaves', char: '8' },
            { suit: 'berries', char: 'U' },
            { suit: 'leaves', char: '6' }
          ]
        }
      },
      swap: null,
      swapSkippedBy: ['player_1', 'player_2'],
      tricks: [
        [
          { owner: 'player_3', suit: 'berries', char: '10' },
          { owner: 'player_4', suit: 'berries', char: 'O' },
          { owner: 'player_1', suit: 'berries', char: '9' },
          { owner: 'player_2', suit: 'leaves', char: '10' }
        ],
        [
          { owner: 'player_4', suit: 'acorns', char: '6' },
          { owner: 'player_1', suit: 'acorns', char: '10' },
          { owner: 'player_2', suit: 'acorns', char: '9' },
          { owner: 'player_3', suit: 'acorns', char: '7' }
        ],
        [
          { owner: 'player_1', suit: 'berries', char: 'O' },
          { owner: 'player_2', suit: 'leaves', char: '9' },
          { owner: 'player_3', suit: 'flowers', char: 'Q' },
          { owner: 'player_4', suit: 'leaves', char: '8' }
        ],
        [
          { owner: 'player_3', suit: 'acorns', char: '8' },
          { owner: 'player_4', suit: 'berries', char: 'U' },
          { owner: 'player_1', suit: 'acorns', char: 'S' },
          { owner: 'player_2', suit: 'flowers', char: '1' }
        ],
        [
          { owner: 'player_1', suit: 'flowers', char: '5' },
          { owner: 'player_2', suit: 'berries', char: '8' },
          { owner: 'player_3', suit: 'leaves', char: '7' },
          { owner: 'player_4', suit: 'leaves', char: '6' }
        ]
      ],
      bids: [
        { bid_id: 'trick-1', bid_type: 'trick', bid_score: 55, win_condition: { win_min_tricks: 2, win_max_tricks: 2 } },
        { bid_id: 'trick-2', bid_type: 'trick', bid_score: 50, win_condition: { win_min_tricks: 1, win_max_tricks: 1 } },
        { bid_id: 'points-1', bid_type: 'points', bid_score: 40, win_condition: { min_points: 11, max_points: 30 } },
        { bid_id: 'points-2', bid_type: 'points', bid_score: 60, win_condition: { min_points: 35, max_points: 100 } },
        { bid_id: 'set-1', bid_type: 'set_collection', bid_score: 10, win_condition: { win_suit: 'acorns', avoid_suit: 'berries' } },
        { bid_id: 'set-2', bid_type: 'set_collection', bid_score: 10, win_condition: { win_suit: 'flowers', avoid_suit: 'acorns' } }
      ],
      playerBids: [{ bidId: 'trick-1', trickNumber: 1 }]
    }
  ]
}

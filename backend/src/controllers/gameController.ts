import { Request, Response } from 'express'
import { GameModel } from '../models/Game.js'
import { createDeck } from '../../../domain/rules/DeckRules.js'
import { createBidDeck } from '../../../domain/rules/BidDeckRules.js'
import { v4 as uuidv4 } from 'uuid'

export const createGame = async (req: Request, res: Response) => {
  try {
    // Generar gameId único
    const gameId = uuidv4()
    
    // Crear deck y bid decks
    const deck = createDeck()
    const bidDecks = createBidDeck()
    
    // Crear el juego con estado inicial
    const newGame = new GameModel({
    gameId,
    activePlayers: [],
    deck,
    bidDecks: {
        setCollectionBidDeck: bidDecks.setCollectionBidDeck,
        pointsBidDeck: bidDecks.pointsBidDeck,
        tricksBidDeck: bidDecks.tricksBidDeck
    },
    // gamePhase: 'setup' <- omitir, usa el default del schema
    round: {
        round: 0,
        playerTurn: null,
        roundBids: {
        points: [null, null],
        set_collection: [null, null],
        trick: [null, null]
        },
        roundPhase: 'shuffle',
        currentTrick: null
    },
    playerTurnOrder: [],
    tricksHistory: [],
    bidsHistory: [],
    playerScores: []
    // gameSettings <- omitir, usa los defaults del schema
    })
    
    await newGame.save()
    
    res.status(201).json({
      success: true,
      data: {
        gameId: newGame.gameId,
        gamePhase: newGame.gamePhase,
        deckSize: newGame.deck.length,
        bidDecks: {
          setCollection: bidDecks.setCollectionBidDeck.length,
          points: bidDecks.pointsBidDeck.length,
          tricks: bidDecks.tricksBidDeck.length
        }
      }
    })
  } catch (error) {
    console.error('Error creating game:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to create game'
    })
  }
}

export const getGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params
    
    const game = await GameModel.findOne({ gameId })
    
    if (!game) {
      return res.status(404).json({
        success: false,
        error: 'Game not found'
      })
    }
    
    res.status(200).json({
      success: true,
      data: game
    })
  } catch (error) {
    console.error('Error fetching game:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to fetch game'
    })
  }
}
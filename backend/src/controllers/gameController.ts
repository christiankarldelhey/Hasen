import { Request, Response } from 'express'
import { PlayerId } from '../../../domain/interfaces/Player'
import type { CompositionRoot } from '../app/composition-root.js'

export const createGame = async (req: Request, res: Response) => {
  try {
    const { gameName, hostPlayerId, userId, maxPlayers, pointsToWin, hostName, hostColor } = req.body

    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    const { responseData } = await compositionRoot.lobby.createGameUseCase.execute({
      gameName,
      hostPlayerId: hostPlayerId as PlayerId | undefined,
      userId,
      maxPlayers,
      pointsToWin,
      hostName,
      hostColor
    })

    res.status(201).json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    console.error('Error creating game:', error)
    const status = error.message === 'userId is required' ? 400 : 500
    res.status(status).json({ success: false, error: error.message || 'Failed to create game' })
  }
}

export const getGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params
    const { userId } = req.query
    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    
    const { responseData } = await compositionRoot.connectionLifecycle.getPlayerGameStateUseCase.execute({
      gameId,
      userId: userId as string | undefined
    })
    
    res.status(200).json({ success: true, data: responseData })
  } catch (error: any) {
    console.error('Error fetching game:', error)
    const status = error.message === 'Game not found' ? 404 : 500
    res.status(status).json({ 
      success: false, 
      error: error.message || 'Failed to fetch game' 
    })
  }
}

export const getGames = async (req: Request, res: Response) => {
  try {
    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    const { responseData } = await compositionRoot.lobby.getOpenGamesUseCase.execute()
    
    res.status(200).json({ success: true, data: responseData })
  } catch (error) {
    console.error('Error fetching games:', error)
    res.status(500).json({ success: false, error: 'Failed to fetch games' })
  }
}

export const joinGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params
    const { userId } = req.body
    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    const { responseData } = await compositionRoot.lobby.joinGameUseCase.execute({ gameId, userId })
    
    res.status(200).json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    console.error('Error joining game:', error)
    const status = error.message === 'Game not found' ? 404 : error.message === 'userId is required' ? 400 : 400
    res.status(status).json({ success: false, error: error.message })
  }
}

export const updatePlayerProfile = async (req: Request, res: Response) => {
  try {
    const { gameId, playerId } = req.params
    const { userId, name, color } = req.body

    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    const { responseData } = await compositionRoot.lobby.updatePlayerProfileUseCase.execute({
      gameId,
      playerId: playerId as PlayerId,
      userId,
      name,
      color
    })

    res.status(200).json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    console.error('Error updating player profile:', error)
    const status =
      error.message === 'Game not found'
        ? 404
        : error.message === 'Cannot update another player profile'
          ? 403
          : 400
    res.status(status).json({ success: false, error: error.message })
  }
}

export const updateGameSettings = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params
    const { userId, pointsToWin } = req.body

    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    const { responseData } = await compositionRoot.lobby.updateGameSettingsUseCase.execute({
      gameId,
      userId,
      pointsToWin
    })

    res.status(200).json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    console.error('Error updating game settings:', error)
    const status =
      error.message === 'Game not found'
        ? 404
        : error.message === 'User is not assigned to this game'
          ? 403
          : 400
    res.status(status).json({ success: false, error: error.message })
  }
}

export const startGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params
    const { hostPlayerId } = req.body

    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    const { responseData } = await compositionRoot.lobby.startGameUseCase.execute({
      gameId,
      hostPlayerId: hostPlayerId as PlayerId
    })

    res.status(200).json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    console.error('Error starting game:', error)
    const status =
      error.message === 'Game not found'
        ? 404
        : error.message === 'Only the host can start the game'
          ? 403
          : 400
    res.status(status).json({ success: false, error: error.message || 'Failed to start game' })
  }
}


export const deleteGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params
    const { hostPlayerId } = req.body

    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    const result = await compositionRoot.lobby.deleteGameUseCase.execute({
      gameId,
      hostPlayerId: hostPlayerId as PlayerId
    })

    res.status(200).json({ success: true, message: result.message })
  } catch (error: any) {
    console.error('Error deleting game:', error)
    const status =
      error.message === 'Game not found'
        ? 404
        : error.message === 'Only the host can delete the game'
          ? 403
          : 400
    res.status(status).json({ success: false, error: error.message })
  }
}

export const endGame = async (req: Request, res: Response) => {
  try {
    const { gameId } = req.params
    const { winnerId } = req.body
    const compositionRoot = req.app.get('compositionRoot') as CompositionRoot
    
    const { responseData } = await compositionRoot.scoringGameEnd.endGameUseCase.execute({
      gameId,
      winnerId: winnerId as PlayerId | undefined
    })
    
    res.status(200).json({
      success: true,
      data: responseData
    })
  } catch (error: any) {
    console.error('Error ending game:', error)
    const status = error.message === 'Game not found' ? 404 : 400
    res.status(status).json({ success: false, error: error.message })
  }
}
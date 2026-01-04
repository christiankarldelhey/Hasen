import { Router } from 'express'
import { createGame, getGame, getGames, joinGame, startGame, deleteGame, endGame } from '../controllers/gameController.js'

const router = Router()

router.post('/games', createGame)
router.get('/games/:gameId', getGame)
router.get('/games', getGames);
router.post('/games/:gameId/join', joinGame);
router.post('/games/:gameId/start', startGame);
router.delete('/games/:gameId', deleteGame);
router.post('/games/:gameId/end', endGame);

export default router
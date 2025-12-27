import { Router } from 'express'
import { createGame, getGame } from '../controllers/gameController.js'

const router = Router()

router.post('/games', createGame)
router.get('/games/:gameId', getGame)

export default router
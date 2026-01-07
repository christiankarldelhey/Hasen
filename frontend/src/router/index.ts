import { createRouter, createWebHistory } from 'vue-router'
import LobbyView from '../views/LobbyView.vue'
import GameView from '../views/GameView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: LobbyView  // Pantalla de inicio/login
    },
    {
      path: '/game/:gameId',
      name: 'game',
      component: GameView  // Partida en curso
    }
  ]
})

export default router
import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import LobbyView from '../views/LobbyView.vue'
import GameView from '../views/GameView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView  // Pantalla de inicio/login
    },
    {
      path: '/lobby/:gameId',
      name: 'lobby',
      component: LobbyView  // Sala de espera
    },
    {
      path: '/game/:gameId',
      name: 'game',
      component: GameView  // Partida en curso
    }
  ]
})

export default router
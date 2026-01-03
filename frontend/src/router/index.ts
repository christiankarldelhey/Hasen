import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
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
      path: '/game/:gameId',
      name: 'game',
      component: GameView  // Partida en curso
    }
  ]
})

export default router
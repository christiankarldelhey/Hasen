import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { gameService, type GameInfo } from '../services/gameService';

export function useGameMenu() {
  const router = useRouter();
  const games = ref<GameInfo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const joiningGameId = ref<string | null>(null);

  const fetchGames = async () => {
    loading.value = true;
    error.value = null;
    try {
      games.value = await gameService.getAvailableGames();
    } catch (err) {
      error.value = 'Error al cargar los juegos';
      console.error(err);
    } finally {
      loading.value = false;
    }
  };

  const joinGame = async (gameId: string) => {
    joiningGameId.value = gameId;
    error.value = null;
    try {
      const result = await gameService.joinGame(gameId);
      console.log('Successfully joined game:', result);
      
      // Navegar al lobby con el gameId
      await router.push({ name: 'lobby', params: { gameId: result.gameId } });
    } catch (err: any) {
      error.value = err.message || 'Error al unirse al juego';
      console.error('Error joining game:', err);
    } finally {
      joiningGameId.value = null;
    }
  };

  onMounted(() => {
    fetchGames();
  });

  return {
    games,
    loading,
    error,
    joiningGameId,
    fetchGames,
    joinGame
  };
}
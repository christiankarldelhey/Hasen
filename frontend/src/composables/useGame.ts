import { ref, onMounted } from 'vue';
import { gameService, type GameInfo } from '../services/gameService';

export function useGame() {
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

  const createGame = async (gameName: string, playerName: string) => {
    loading.value = true;
    error.value = null;
    try {
        const result = await gameService.createNewGame(gameName, playerName);
        console.log('Successfully created game:', result);
        return result;
    } catch (err: any) {
        error.value = err.message || 'Error creating new game';
        console.error('Error creating new game:', err);
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
        
        // Guardar el playerId en sessionStorage para usarlo en el lobby
        sessionStorage.setItem('current_player_id', result.assignedPlayerId);
        sessionStorage.setItem('current_game_id', result.gameId);
        
        return result;
    } catch (err: any) {
        error.value = err.message || 'Error joining game';
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
    createGame,
    joiningGameId,
    fetchGames,
    joinGame
  };
}
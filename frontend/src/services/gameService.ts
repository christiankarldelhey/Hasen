const API_URL = 'http://localhost:3001/api';

import { userIdService } from './userIdService';
import type { LobbyGame } from '@domain/interfaces/Game';
import type { PublicGameState } from '@domain/interfaces/Game';

export interface JoinGameResponse {
  gameId: string;
  assignedPlayerId: string;
  activePlayers: string[];
  currentPlayers: number;
  maxPlayers: number;
}

export interface CreateGameResponse {
  gameId: string;
  gameName: string;
  assignedPlayerId: string;
  hostPlayer: string;
  currentPlayers: number;
  maxPlayers: number;
  minPlayers: number;
  hasSpace: boolean;
  createdAt: string;
}

export const gameService = {
  async getAvailableGames(): Promise<LobbyGame[]> {
    try {
      const response = await fetch(`${API_URL}/games`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch games');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error fetching games:', error);
      throw error;
    }
  },

async getPlayerGameState(gameId: string): Promise<any> {
  try {
    const userId = userIdService.getUserId();
    const url = userId 
      ? `${API_URL}/games/${gameId}?userId=${userId}`
      : `${API_URL}/games/${gameId}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch game');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error fetching game:', error);
    throw error;
  }
},

async createNewGame(gameName: string, hostPlayerId: string): Promise<CreateGameResponse> {
  try {
    const userId = userIdService.getUserId(); // Cambiado de getSessionId
    
    const response = await fetch(`${API_URL}/games/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ gameName, hostPlayerId, userId })
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to create game');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error creating game:', error);
    throw error;
  }
},

async joinGame(gameId: string): Promise<JoinGameResponse> {
  try {
    const userId = userIdService.getUserId();
    
    const response = await fetch(`${API_URL}/games/${gameId}/join`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId })
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to join game');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error joining game:', error);
    throw error;
  }
},

async deleteGame(gameId: string, hostPlayerId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/games/${gameId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostPlayerId })
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete game');
    }
  } catch (error) {
    console.error('Error deleting game:', error);
    throw error;
  }
},

async startGame(gameId: string, hostPlayerId: string): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/games/${gameId}/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ hostPlayerId })
    });
    const data = await response.json();
    
    if (!data.success) {
      throw new Error(data.error || 'Failed to start game');
    }
    
    return data.data;
  } catch (error) {
    console.error('Error starting game:', error);
    throw error;
  }
}
};

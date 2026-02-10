export type PlayerId = 'player_1' | 'player_2' | 'player_3' | 'player_4'
export type ActivePlayers = PlayerId[];

export type PlayerConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

export interface PlayerConnectionInfo {
  playerId: PlayerId
  status: PlayerConnectionStatus
  disconnectedAt?: number
  lastSeenAt: number
}

export interface Player {
  id: PlayerId
  name: string,
  color: string
  defaultAvatar: string
}


export const AVAILABLE_PLAYERS: readonly Player[] = [
{ id: 'player_1', name: 'Lenz', color: '#B89B5E', defaultAvatar: 'avatar1.png' }, // Ocre dorado
{ id: 'player_2', name: 'Anna', color: '#5E6F68', defaultAvatar: 'avatar2.png' }, // Verde pino apagado
{ id: 'player_3', name: 'Hans', color: '#7A8450', defaultAvatar: 'avatar3.png' }, // Verde oliva
{ id: 'player_4', name: 'Magda', color: '#7C4A34', defaultAvatar: 'avatar4.png' }, // Marrón rojizo / lacre

] as const
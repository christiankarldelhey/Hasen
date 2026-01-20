export type PlayerId = 'player_1' | 'player_2' | 'player_3' | 'player_4'
export type ActivePlayers = PlayerId[];

export interface Player {
  id: PlayerId
  color: string
  defaultAvatar: string
}


export const AVAILABLE_PLAYERS: readonly Player[] = [
{ id: 'player_1', color: '#B89B5E', defaultAvatar: 'avatar1.png' }, // Ocre dorado
{ id: 'player_2', color: '#5E6F68', defaultAvatar: 'avatar2.png' }, // Verde pino apagado
{ id: 'player_3', color: '#7A8450', defaultAvatar: 'avatar3.png' }, // Verde oliva
{ id: 'player_4', color: '#7C4A34', defaultAvatar: 'avatar4.png' }, // Marrón rojizo / lacre

] as const
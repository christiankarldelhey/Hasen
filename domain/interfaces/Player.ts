export type PlayerId = 'player_1' | 'player_2' | 'player_3' | 'player_4'
export type ActivePlayers = PlayerId[];

export interface Player {
  id: PlayerId
  color: string
  defaultAvatar: string
}

export const AVAILABLE_PLAYERS: readonly Player[] = [
  { id: 'player_1' as const, color: '#e39b4a' as const, defaultAvatar: 'avatar1.png' },
  { id: 'player_2' as const, color: '#4b7c76' as const, defaultAvatar: 'avatar2.png' },
  { id: 'player_3' as const, color: '#497e1a' as const, defaultAvatar: 'avatar3.png' },
  { id: 'player_4' as const, color: '#8d3718' as const, defaultAvatar: 'avatar4.png' }
] as const
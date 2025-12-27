export type PlayerId = 'player_1' | 'player_2' | 'player_3' | 'player_4'
export type PlayerColor = '#FF5733' | '#3498DB' | '#2ECC71' | '#F39C12'
export type ActivePlayers = PlayerId[];

export const AVAILABLE_PLAYERS = [
  { id: 'player_1' as const, color: '#FF5733' as const, defaultAvatar: 'avatar1.png' },
  { id: 'player_2' as const, color: '#3498DB' as const, defaultAvatar: 'avatar2.png' },
  { id: 'player_3' as const, color: '#2ECC71' as const, defaultAvatar: 'avatar3.png' },
  { id: 'player_4' as const, color: '#F39C12' as const, defaultAvatar: 'avatar4.png' }
] as const
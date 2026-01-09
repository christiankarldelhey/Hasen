import { GameModel } from '../models/Game.js'

export class GameCleanupService {
  private static cleanupInterval: NodeJS.Timeout | null = null;
  private static readonly CLEANUP_INTERVAL_MS = 60 * 1000; // Revisar cada minuto
  private static readonly ROOM_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutos
  private static readonly ABANDONED_GAME_TIMEOUT_MS = 4 * 60 * 60 * 1000; // 4 horas

  static startCleanupService() {
    if (this.cleanupInterval) {
      console.log('⚠️ Cleanup service already running');
      return;
    }

    console.log('🧹 Starting game cleanup service (checking every minute)');
    
    this.cleanupInterval = setInterval(async () => {
      await this.cleanupStaleGames();
      await this.cleanupAbandonedGames();
    }, this.CLEANUP_INTERVAL_MS);
  }

  static stopCleanupService() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
      console.log('🛑 Game cleanup service stopped');
    }
  }

  private static async cleanupStaleGames() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - this.ROOM_TIMEOUT_MS);
      
      const result = await GameModel.deleteMany({
        gamePhase: 'setup',
        updatedAt: { $lt: fiveMinutesAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} stale game(s) in setup phase`);
      }
    } catch (error) {
      console.error('❌ Error during game cleanup:', error);
    }
  }

  private static async cleanupAbandonedGames() {
    try {
      const fourHoursAgo = new Date(Date.now() - this.ABANDONED_GAME_TIMEOUT_MS);
      
      const result = await GameModel.deleteMany({
        gamePhase: 'playing',
        updatedAt: { $lt: fourHoursAgo }
      });

      if (result.deletedCount > 0) {
        console.log(`🧹 Cleaned up ${result.deletedCount} abandoned game(s) in playing phase (>4h inactive)`);
      }
    } catch (error) {
      console.error('❌ Error during abandoned games cleanup:', error);
    }
  }
}
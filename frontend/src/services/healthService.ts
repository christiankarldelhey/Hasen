const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const healthService = {
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${API_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(10000)
      });
      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.warn('Health check failed:', error);
      return false;
    }
  }
};

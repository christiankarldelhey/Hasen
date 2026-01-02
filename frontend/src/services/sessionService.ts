import { v4 as uuidv4 } from 'uuid';

const SESSION_KEY = 'hasen_session_id';

export const sessionService = {
  getSessionId(): string {
    let sessionId = sessionStorage.getItem(SESSION_KEY);
    
    if (!sessionId) {
      sessionId = uuidv4();
      sessionStorage.setItem(SESSION_KEY, sessionId);
    }
    
    return sessionId;
  },

  clearSession(): void {
    sessionStorage.removeItem(SESSION_KEY);
  }
};
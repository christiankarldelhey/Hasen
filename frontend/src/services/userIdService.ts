import { v4 as uuidv4 } from 'uuid';
const USER_ID_KEY = 'hasen_user_id';
export const sessionService = {
  getUserId(): string {
    let userId = localStorage.getItem(USER_ID_KEY);
    
    if (!userId) {
      userId = uuidv4();
      localStorage.setItem(USER_ID_KEY, userId);
    }
    
    return userId;
  },
  clearUserId(): void {
    localStorage.removeItem(USER_ID_KEY);
  }
};
import { store } from '../store';
import { logoutUser } from '../store/slices/authSlice';

/**
 * Utility function to logout user from anywhere in the app
 * This can be called from any component or service
 */
export const performLogout = async () => {
  console.log('🚪 Logout Utility: Starting logout process');
  
  try {
    // Dispatch logout action
    await store.dispatch(logoutUser());
    
    // Clear any additional localStorage items
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('persist:root');
    
    console.log('✅ Logout Utility: Logout completed successfully');
    return true;
  } catch (error) {
    console.error('❌ Logout Utility: Logout error:', error);
    
    // Even if there's an error, clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('persist:root');
    
    return false;
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = () => {
  const state = store.getState();
  return state.auth.isAuthenticated;
};

/**
 * Get current user from store
 */
export const getCurrentUser = () => {
  const state = store.getState();
  return state.auth.user;
};

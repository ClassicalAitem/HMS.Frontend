import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api/authAPI';
import { getErrorMessage } from '../../utils/errorHandler';

// Initial state
const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  loginAttempts: 0,
  lastLoginAttempt: null,
  isDefaultPassword: false,
  needsPasswordChange: false,
};

// Async thunks
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authAPI.login(credentials);
      
      // Handle the API response structure
      if (response.data.success) {
        const { token, ...userData } = response.data.data;
        
        const processedData = {
          token,
          user: {
            id: userData.id,
            firstName: userData.firstName,
            lastName: userData.lastName,
            email: userData.email,
            phoneNumber: userData.phoneNumber,
            role: userData.accountType,
            isDefaultPassword: userData.isDefaultPassword,
            isActive: userData.isActive,
            isDisabled: userData.isDisabled,
            lastLogin: userData.lastLogin,
            loginCount: userData.loginCount,
            createdAt: userData.createdAt,
            updatedAt: userData.updatedAt,
          },
          needsPasswordChange: userData.isDefaultPassword,
        };
        
        return processedData;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      // Handle 403 default password error
      if (error.response?.status === 403 && error.response?.data?.message?.message?.includes('Please change your default password')) {
        const userId = error.response.data.message.data;
        const message = error.response.data.message.message;
        
        // Return special error object for default password
        return rejectWithValue({
          type: 'default_password',
          userId: userId,
          message: message
        });
      }
      
      return rejectWithValue(getErrorMessage(error, 'Login failed'));
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState }) => {
    try {
      const { auth } = getState();
      if (auth.token) {
        try {
          await authAPI.logout();
        } catch {
          // Don't throw error - we'll still clear local state
        }
      }
      return null;
    } catch {
      return null;
    }
  }
);

export const refreshToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.refreshToken) {
        throw new Error('No refresh token available');
      }
      const response = await authAPI.refreshToken(auth.refreshToken);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Token refresh failed'));
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { rejectWithValue }) => {
    try {
      // Get user ID from localStorage (stored during login redirect)
      const userId = localStorage.getItem('changePasswordUserId');
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      const response = await authAPI.changePassword(passwordData, userId);
      
      if (response.data.success) {
        localStorage.removeItem('changePasswordUserId');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Password change failed'));
    }
  }
);

// Auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearAuth: (state) => {
      state.user = null;
      state.token = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.error = null;
      state.isDefaultPassword = false;
      state.needsPasswordChange = false;
    },
    setCredentials: (state, action) => {
      const { user, token, refreshToken } = action.payload;
      state.user = user;
      state.token = token;
      state.refreshToken = refreshToken;
      state.isAuthenticated = true;
    },
    incrementLoginAttempts: (state) => {
      state.loginAttempts += 1;
      state.lastLoginAttempt = new Date().toISOString();
    },
    resetLoginAttempts: (state) => {
      state.loginAttempts = 0;
      state.lastLoginAttempt = null;
    },
    passwordChanged: (state) => {
      state.isDefaultPassword = false;
      state.needsPasswordChange = false;
      if (state.user) {
        state.user.isDefaultPassword = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        state.isDefaultPassword = action.payload.user.isDefaultPassword;
        state.needsPasswordChange = action.payload.needsPasswordChange;
        state.error = null;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        
        // Store tokens in localStorage for API client access
        if (action.payload.token) {
          const cleanToken = action.payload.token.replace(/^["']|["']$/g, '').trim();
          const jwtParts = cleanToken.split('.');
          if (jwtParts.length === 3) {
            localStorage.setItem('token', cleanToken);
          }
        }
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken);
        }
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = typeof action.payload === 'string' ? action.payload : 
                     (action.payload?.message || 'Login failed');
        state.loginAttempts += 1;
        state.lastLoginAttempt = new Date().toISOString();
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isDefaultPassword = false;
        state.needsPasswordChange = false;
        state.error = null;
        state.loginAttempts = 0;
        
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        state.lastLoginAttempt = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isDefaultPassword = false;
        state.needsPasswordChange = false;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      })
      
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken);
        }
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      })
      
      // Change password
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
        state.isDefaultPassword = false;
        state.needsPasswordChange = false;
        if (state.user) {
          state.user.isDefaultPassword = false;
        }
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  clearAuth,
  setCredentials,
  incrementLoginAttempts,
  resetLoginAttempts,
  passwordChanged,
} = authSlice.actions;

export default authSlice.reducer;

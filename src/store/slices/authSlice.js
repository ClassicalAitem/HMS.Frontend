import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { authAPI } from '../../services/api/authAPI';

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
    console.log('🔄 AuthSlice: Starting loginUser thunk');
    console.log('📤 AuthSlice: Credentials received:', credentials);
    
    try {
      const response = await authAPI.login(credentials);
      console.log('✅ AuthSlice: API response received:', response);
      
      // Handle the API response structure
      if (response.data.success) {
        console.log('✅ AuthSlice: Login successful, processing data');
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
        
        console.log('📦 AuthSlice: Processed data:', processedData);
        return processedData;
      } else {
        console.error('❌ AuthSlice: Login failed - success is false');
        console.error('📥 AuthSlice: Response message:', response.data.message);
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      console.error('❌ AuthSlice: Login error caught:', error);
      console.error('📥 AuthSlice: Error response:', error.response);
      console.error('📥 AuthSlice: Error message:', error.message);
      
      // Handle 403 default password error
      if (error.response?.status === 403 && error.response?.data?.message?.message?.includes('Please change your default password')) {
        console.log('🔒 AuthSlice: Default password detected');
        const userId = error.response.data.message.data;
        const message = error.response.data.message.message;
        console.log('🔒 AuthSlice: User ID:', userId);
        console.log('🔒 AuthSlice: Message:', message);
        
        // Return special error object for default password
        return rejectWithValue({
          type: 'default_password',
          userId: userId,
          message: message
        });
      }
      
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      console.log('📤 AuthSlice: Rejecting with message:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logoutUser',
  async (_, { getState }) => {
    console.log('🔄 AuthSlice: Starting logoutUser thunk');
    
    try {
      const { auth } = getState();
      console.log('🔑 AuthSlice: Current auth state:', auth);
      
      if (auth.token) {
        console.log('🌐 AuthSlice: Attempting to call logout API');
        try {
          await authAPI.logout(auth.token);
          console.log('✅ AuthSlice: Logout API call successful');
        } catch (apiError) {
          console.warn('⚠️ AuthSlice: Logout API call failed, but continuing with local logout:', apiError);
          // Don't throw error - we'll still clear local state
        }
      } else {
        console.log('🔑 AuthSlice: No token found, skipping API call');
      }
      
      console.log('✅ AuthSlice: Logout process completed');
      return null;
    } catch (error) {
      console.error('❌ AuthSlice: Logout error:', error);
      // Even if there's an error, we should still clear local state
      console.log('🔄 AuthSlice: Continuing with local logout despite error');
      return null; // Don't reject - we want to clear state anyway
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
      return rejectWithValue(
        error.response?.data?.message || 'Token refresh failed'
      );
    }
  }
);

export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async (passwordData, { getState, rejectWithValue }) => {
    try {
      console.log('🔄 AuthSlice: Starting changePassword thunk');
      console.log('📤 AuthSlice: Password data:', passwordData);
      
      // Get user ID from localStorage (stored during login redirect)
      const userId = localStorage.getItem('changePasswordUserId');
      console.log('🔑 AuthSlice: User ID from localStorage:', userId);
      
      if (!userId) {
        throw new Error('User ID not found. Please log in again.');
      }
      
      const response = await authAPI.changePassword(passwordData, userId);
      console.log('✅ AuthSlice: Change password response:', response);
      
      // Handle the API response structure
      if (response.data.success) {
        console.log('✅ AuthSlice: Password changed successfully');
        // Clear the stored user ID
        localStorage.removeItem('changePasswordUserId');
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error) {
      console.error('❌ AuthSlice: Change password error:', error);
      return rejectWithValue(
        error.response?.data?.message || error.message || 'Password change failed'
      );
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
        console.log('⏳ AuthSlice: Login pending - setting loading to true');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        console.log('✅ AuthSlice: Login fulfilled - updating state');
        console.log('📦 AuthSlice: Action payload:', action.payload);
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
          // Clean the token before storing
          const cleanToken = action.payload.token.replace(/^["']|["']$/g, '').trim();
          
          // Validate JWT format
          const jwtParts = cleanToken.split('.');
          if (jwtParts.length !== 3) {
            console.error('❌ AuthSlice: Invalid JWT format - expected 3 parts, got:', jwtParts.length);
            console.error('❌ AuthSlice: Token parts:', jwtParts);
            console.error('❌ AuthSlice: Raw token:', action.payload.token);
            console.error('❌ AuthSlice: Clean token:', cleanToken);
          } else {
            localStorage.setItem('token', cleanToken);
            console.log('💾 AuthSlice: Token stored in localStorage');
            console.log('💾 AuthSlice: Token preview:', cleanToken.substring(0, 20) + '...');
            console.log('💾 AuthSlice: JWT parts count:', jwtParts.length);
          }
        } else {
          console.log('⚠️ AuthSlice: No token in payload to store');
        }
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken);
          console.log('💾 AuthSlice: Refresh token stored in localStorage');
        } else {
          console.log('⚠️ AuthSlice: No refresh token in payload to store');
        }
        
        console.log('✅ AuthSlice: State updated successfully');
      })
      .addCase(loginUser.rejected, (state, action) => {
        console.log('❌ AuthSlice: Login rejected - setting error');
        console.log('📦 AuthSlice: Rejection payload:', action.payload);
        state.isLoading = false;
        // Only store the message string, not the entire object
        state.error = typeof action.payload === 'string' ? action.payload : 
                     (action.payload?.message || 'Login failed');
        state.loginAttempts += 1;
        state.lastLoginAttempt = new Date().toISOString();
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        console.log('⏳ AuthSlice: Logout pending - setting loading to true');
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        console.log('✅ AuthSlice: Logout fulfilled - clearing auth state');
        state.isLoading = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isDefaultPassword = false;
        state.needsPasswordChange = false;
        state.error = null;
        state.loginAttempts = 0;
        
        // Clear tokens from localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        console.log('🗑️ AuthSlice: Tokens cleared from localStorage');
        state.lastLoginAttempt = null;
        console.log('✅ AuthSlice: Auth state cleared successfully');
      })
      .addCase(logoutUser.rejected, (state, action) => {
        console.log('❌ AuthSlice: Logout rejected - still clearing auth state');
        console.log('📦 AuthSlice: Rejection payload:', action.payload);
        state.isLoading = false;
        state.error = action.payload;
        // Still clear auth state even if logout API fails
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.isDefaultPassword = false;
        state.needsPasswordChange = false;
        state.loginAttempts = 0;
        state.lastLoginAttempt = null;
        
        // Clear tokens from localStorage even if logout API fails
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        console.log('🗑️ AuthSlice: Tokens cleared from localStorage despite rejection');
        console.log('✅ AuthSlice: Auth state cleared despite rejection');
      })
      
      // Refresh token
      .addCase(refreshToken.fulfilled, (state, action) => {
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
        state.isAuthenticated = true;
        
        // Store new tokens in localStorage
        if (action.payload.token) {
          localStorage.setItem('token', action.payload.token);
        }
        if (action.payload.refreshToken) {
          localStorage.setItem('refreshToken', action.payload.refreshToken);
        }
        console.log('🔄 AuthSlice: Tokens refreshed and stored in localStorage');
      })
      .addCase(refreshToken.rejected, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        
        // Clear tokens from localStorage when refresh fails
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        console.log('🗑️ AuthSlice: Tokens cleared from localStorage due to refresh failure');
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


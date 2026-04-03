import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { usersAPI } from '../../services/api/usersAPI';

// Initial state
const initialState = {
  users: [],
  currentUser: null,
  isLoading: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  },
  filters: {
    search: '',
    accountType: '',
    isActive: '',
  },
  sortBy: 'createdAt',
  sortOrder: 'desc',
};

// Async thunks
export const fetchUsers = createAsyncThunk(
  'users/fetchUsers',
  async (params = {}, { rejectWithValue }) => {
    console.log('🔄 UsersSlice: Starting fetchUsers thunk');
    console.log('📤 UsersSlice: Request params:', params);

    try {
      const response = await usersAPI.getUsers(params);
      console.log('✅ UsersSlice: API response received:', response);

      // Handle the API response structure
      if (response.data.success) {
        console.log('✅ UsersSlice: Users fetched successfully');
        const users = response.data.data.map(user => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phoneNumber: user.phoneNumber,
          accountType: user.accountType,
          isDefaultPassword: user.isDefaultPassword,
          departmentId: user.departmentId,
          departmentName: user.department?.name || null,
          isActive: !user.isDisabled,
          isDisabled: user.isDisabled,
          isDeleted: user.isDeleted,
          lastLogin: user.lastLogin,
          loginCount: user.loginCount,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        }));

        console.log('📦 UsersSlice: Processed users data:', users);
        return {
          users,
          pagination: response.data.pagination || {
            page: 1,
            limit: 10,
            total: users.length,
            totalPages: 1,
          }
        };
      } else {
        console.error('❌ UsersSlice: Fetch users failed - success is false');
        throw new Error(response.data.message || 'Failed to fetch users');
      }
    } catch (error) {
      console.error('❌ UsersSlice: Fetch users error caught:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch users';
      console.log('📤 UsersSlice: Rejecting with message:', errorMessage);
      return rejectWithValue(errorMessage);
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchUserById',
  async (userId, { rejectWithValue }) => {
    console.log('🔄 UsersSlice: Starting fetchUserById thunk');
    console.log('📤 UsersSlice: User ID:', userId);

    try {
      const response = await usersAPI.getUserById(userId);
      console.log('✅ UsersSlice: API response received:', response);

      if (response.data.success) {
        const user = response.data.data;
        console.log('📦 UsersSlice: Processed user data:', user);
        return user;
      } else {
        throw new Error(response.data.message || 'Failed to fetch user');
      }
    } catch (error) {
      console.error('❌ UsersSlice: Fetch user by ID error caught:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to fetch user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const createUser = createAsyncThunk(
  'users/createUser',
  async (userData, { rejectWithValue }) => {
    console.log('🔄 UsersSlice: Starting createUser thunk');
    console.log('📤 UsersSlice: User data:', userData);

    try {
      const response = await usersAPI.createUser(userData);
      console.log('✅ UsersSlice: API response received:', response);

      if (response.data.success) {
        const user = response.data.data;
        console.log('📦 UsersSlice: Created user data:', user);
        return user;
      } else {
        throw new Error(response.data.message || 'Failed to create user');
      }
    } catch (error) {
      console.error('❌ UsersSlice: Create user error caught:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/updateUser',
  async ({ userId, userData }, { rejectWithValue }) => {
    console.log('🔄 UsersSlice: Starting updateUser thunk');
    console.log('📤 UsersSlice: User ID:', userId);
    console.log('📤 UsersSlice: User data:', userData);

    try {
      const response = await usersAPI.updateUser(userId, userData);
      console.log('✅ UsersSlice: API response received:', response);

      if (response.data.success) {
        const user = response.data.data;
        console.log('📦 UsersSlice: Updated user data:', user);
        return user;
      } else {
        throw new Error(response.data.message || 'Failed to update user');
      }
    } catch (error) {
      console.error('❌ UsersSlice: Update user error caught:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to update user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/deleteUser',
  async (userId, { rejectWithValue }) => {
    console.log('🔄 UsersSlice: Starting deleteUser thunk');
    console.log('📤 UsersSlice: User ID:', userId);

    try {
      const response = await usersAPI.deleteUser(userId);
      console.log('✅ UsersSlice: API response received:', response);

      if (response.status === 204) {
        console.log('📦 UsersSlice: User deleted successfully');
        return userId;
      } else {
        throw new Error(response?.data?.message || 'Failed to delete user');
      }
    } catch (error) {
      console.error('❌ UsersSlice: Delete user error caught:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to delete user';
      return rejectWithValue(errorMessage);
    }
  }
);

export const toggleUserStatus = createAsyncThunk(
  'users/toggleUserStatus',
  async ({ userId, isDisabled }, { rejectWithValue }) => {
    try {
      const response = await usersAPI.toggleUserStatus(userId, isDisabled);

      const userData = response?.data?.data || response?.data;
      const hasSuccess = response?.data?.success !== false;

      if (hasSuccess && userData) {
        const user = {
          ...userData,
          id: userData.id || userId,
          isDisabled: isDisabled,           // ✅ use the param we passed in
          isActive: !isDisabled,            // ✅ derive from isDisabled, not undefined variable
        };
        return user;
      } else {
        throw new Error(response?.data?.message || 'Failed to toggle user status');
      }
    } catch (error) {
      console.error('❌ UsersSlice: Toggle user status error caught:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to toggle user status';
      return rejectWithValue(errorMessage);
    }
  }
);
// Users slice
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearUsersError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        accountType: '',
        isActive: '',
      };
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearCurrentUser: (state) => {
      state.currentUser = null;
    },
    setSorting: (state, action) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users
      .addCase(fetchUsers.pending, (state) => {
        console.log('⏳ UsersSlice: Fetch users pending - setting loading to true');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        console.log('✅ UsersSlice: Fetch users fulfilled - updating state');
        console.log('📦 UsersSlice: Action payload:', action.payload);
        state.isLoading = false;
        state.users = action.payload.users;
        state.pagination = action.payload.pagination;
        state.error = null;
        console.log('✅ UsersSlice: Users state updated successfully');
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        console.log('❌ UsersSlice: Fetch users rejected - setting error');
        console.log('📦 UsersSlice: Rejection payload:', action.payload);
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch user by ID
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create user
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users.unshift(action.payload);
        state.error = null;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update user
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        state.error = null;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete user
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user.id !== action.payload);
        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Toggle user status
      .addCase(toggleUserStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(toggleUserStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.users.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        state.error = null;
      })
      .addCase(toggleUserStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearUsersError,
  setFilters,
  clearFilters,
  setCurrentUser,
  clearCurrentUser,
  setSorting,
} = usersSlice.actions;

export default usersSlice.reducer;

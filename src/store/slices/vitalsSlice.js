import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import vitalsAPI from '../../services/api/vitalsAPI';

// Async thunk to fetch vitals
export const fetchVitals = createAsyncThunk(
  'vitals/fetchVitals',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🩺 VitalsSlice: Fetching vitals...');
      const response = await vitalsAPI.getVitals();
      console.log('✅ VitalsSlice: Vitals fetched successfully');
      console.log('🩺 VitalsSlice: Response data:', response);
      return response.data;
    } catch (error) {
      console.error('❌ VitalsSlice: Fetch vitals error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vitals');
    }
  }
);

const vitalsSlice = createSlice({
  name: 'vitals',
  initialState: {
    vitals: [],
    isLoading: false,
    error: null,
  },
  reducers: {
    clearVitalsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVitals.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchVitals.fulfilled, (state, action) => {
        state.isLoading = false;
        state.vitals = action.payload;
      })
      .addCase(fetchVitals.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearVitalsError } = vitalsSlice.actions;
export default vitalsSlice.reducer;
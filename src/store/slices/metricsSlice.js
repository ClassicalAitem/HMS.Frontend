import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async thunk to fetch metrics
export const fetchMetrics = createAsyncThunk(
  'metrics/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      };

      // Fetch both metrics endpoints
      const [patientsResponse, staffResponse] = await Promise.all([
        axios.get('/metrics/getOverallPatients', config),
        axios.get('/metrics/getOverallStaff', config)
      ]);

      return {
        totalPatients: patientsResponse.data?.data?.totalPatients || 0,
        totalActiveStaff: staffResponse.data?.data?.totalActiveStaff || 0,
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch metrics');
    }
  }
);

const metricsSlice = createSlice({
  name: 'metrics',
  initialState: {
    metrics: {
      totalPatients: 0,
      totalActiveStaff: 0,
    },
    isLoading: false,
    error: null,
  },
  reducers: {
    clearMetricsError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        state.metrics = action.payload;
      })
      .addCase(fetchMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearMetricsError } = metricsSlice.actions;
export default metricsSlice.reducer;
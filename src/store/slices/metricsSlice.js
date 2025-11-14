import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import metricsAPI from '../../services/api/metricsAPI';

// Async thunk to fetch metrics
export const fetchMetrics = createAsyncThunk(
  'metrics/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      console.log('📊 MetricsSlice: Fetching metrics...');
      
      // Fetch both metrics endpoints
      const [metricsResponse, staffResponse] = await Promise.all([
        metricsAPI.getMetrics(),
        metricsAPI.getStaffMetrics()
      ]);
      
      console.log('📊 MetricsSlice: Main metrics response:', metricsResponse);
      console.log('📊 MetricsSlice: Staff metrics response:', staffResponse);
      
      // Merge both responses
      const mergedData = {
        ...metricsResponse.data,
        ...staffResponse.data,
      };
      
      console.log('📊 MetricsSlice: Merged data:', mergedData);
      return mergedData;
    } catch (error) {
      console.error('❌ MetricsSlice: Fetch metrics error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch metrics');
    }
  }
);

const metricsSlice = createSlice({
  name: 'metrics',
  initialState: {
    metrics: {
      totalPatients: 0,
      totalDependants: 0,
      totalAdmittedPatients: 0,
      totalDischargedPatients: 0,
      totalPassedPatients: 0,
      totalPendingReceipt: 0,
      totalInvestigationRequestsPending: 0,
      totalInStock: 0,
      totalLowStock: 0,
      totalOutOfStock: 0,
      totalLabResultCritical: 0,
      totalLabResultHigh: 0,
      totalLabResultLow: 0,
      totalLabResultNormal: 0,
      totalTodayVital: 0,
      totalPatientsCheckIn: 0,
      totalRevenueToday: 0,
      totalMonthlyRevenue: 0,
      totalTodayAppointment: 0,
      totalDepartments: 0,
      totalActiveStaff: 0,
      totalDoctors: 0,
      totalNurses: 0,
      totalPharmacists: 0,
      totalLabScientists: 0,
      totalCashiers: 0,
      totalAdmin: 0,
      totalFrontDesk: 0,
      totalOtherStaff: 0,
      totalHr: 0,
      totalAccountOfficers: 0,
      totalDefaultPassword: 0,
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
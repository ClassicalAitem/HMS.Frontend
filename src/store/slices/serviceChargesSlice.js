import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import serviceChargesAPI from '../../services/api/serviceChargesAPI';

// Async thunks for service charges CRUD operations
export const fetchServiceCharges = createAsyncThunk(
  'serviceCharges/fetchServiceCharges',
  async (_, { rejectWithValue }) => {
    try {
      console.log('💰 ServiceChargesSlice: Fetching service charges...');
      const response = await serviceChargesAPI.getServiceCharges();
      console.log('✅ ServiceChargesSlice: Service charges fetched successfully');
      console.log('💰 ServiceChargesSlice: Response data:', response);
      return response.data;
    } catch (error) {
      console.error('❌ ServiceChargesSlice: Fetch service charges error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service charges');
    }
  }
);

export const createServiceCharge = createAsyncThunk(
  'serviceCharges/createServiceCharge',
  async (serviceChargeData, { rejectWithValue }) => {
    try {
      console.log('💰 ServiceChargesSlice: Creating service charge...');
      const response = await serviceChargesAPI.createServiceCharge(serviceChargeData);
      console.log('✅ ServiceChargesSlice: Service charge created successfully');
      console.log('💰 ServiceChargesSlice: Create response data:', response);
      return response.data;
    } catch (error) {
      console.error('❌ ServiceChargesSlice: Create service charge error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to create service charge');
    }
  }
);

export const updateServiceCharge = createAsyncThunk(
  'serviceCharges/updateServiceCharge',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      console.log('💰 ServiceChargesSlice: Updating service charge with ID:', id);
      const response = await serviceChargesAPI.updateServiceCharge(id, data);
      console.log('✅ ServiceChargesSlice: Service charge updated successfully');
      console.log('💰 ServiceChargesSlice: Update response data:', response);
      return response.data;
    } catch (error) {
      console.error('❌ ServiceChargesSlice: Update service charge error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to update service charge');
    }
  }
);

export const deleteServiceCharge = createAsyncThunk(
  'serviceCharges/deleteServiceCharge',
  async (id, { rejectWithValue }) => {
    try {
      console.log('💰 ServiceChargesSlice: Deleting service charge with ID:', id);
      const response = await serviceChargesAPI.deleteServiceCharge(id);
      console.log('✅ ServiceChargesSlice: Service charge deleted successfully');
      console.log('💰 ServiceChargesSlice: Delete response data:', response);
      return { id, data: response.data };
    } catch (error) {
      console.error('❌ ServiceChargesSlice: Delete service charge error:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to delete service charge');
    }
  }
);

const serviceChargesSlice = createSlice({
  name: 'serviceCharges',
  initialState: {
    serviceCharges: [],
    isLoading: false,
    error: null,
    creating: false,
    updating: false,
    deleting: false,
  },
  reducers: {
    clearServiceChargesError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch service charges
      .addCase(fetchServiceCharges.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceCharges.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceCharges = action.payload;
      })
      .addCase(fetchServiceCharges.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create service charge
      .addCase(createServiceCharge.pending, (state) => {
        state.creating = true;
        state.error = null;
      })
      .addCase(createServiceCharge.fulfilled, (state, action) => {
        state.creating = false;
        state.serviceCharges.push(action.payload);
      })
      .addCase(createServiceCharge.rejected, (state, action) => {
        state.creating = false;
        state.error = action.payload;
      })
      
      // Update service charge
      .addCase(updateServiceCharge.pending, (state) => {
        state.updating = true;
        state.error = null;
      })
      .addCase(updateServiceCharge.fulfilled, (state, action) => {
        state.updating = false;
        const index = state.serviceCharges.findIndex(charge => charge.id === action.payload.id);
        if (index !== -1) {
          state.serviceCharges[index] = action.payload;
        }
      })
      .addCase(updateServiceCharge.rejected, (state, action) => {
        state.updating = false;
        state.error = action.payload;
      })
      
      // Delete service charge
      .addCase(deleteServiceCharge.pending, (state) => {
        state.deleting = true;
        state.error = null;
      })
      .addCase(deleteServiceCharge.fulfilled, (state, action) => {
        state.deleting = false;
        state.serviceCharges = state.serviceCharges.filter(charge => charge.id !== action.payload.id);
      })
      .addCase(deleteServiceCharge.rejected, (state, action) => {
        state.deleting = false;
        state.error = action.payload;
      });
  },
});

export const { clearServiceChargesError } = serviceChargesSlice.actions;
export default serviceChargesSlice.reducer;
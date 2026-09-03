import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import serviceChargesAPI from '../../services/api/serviceChargesAPI';
import { getErrorMessage } from '../../utils/errorHandler';

// Async thunks for service charges CRUD operations
export const fetchServiceCharges = createAsyncThunk(
  'serviceCharges/fetchServiceCharges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceChargesAPI.getServiceCharges();
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch service charges Refresh the page or try again later.'));
    }
  }
);

export const createServiceCharge = createAsyncThunk(
  'serviceCharges/createServiceCharge',
  async (serviceChargeData, { rejectWithValue }) => {
    try {
      const response = await serviceChargesAPI.createServiceCharge(serviceChargeData);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create service charge Refresh the page or try again later.'));
    }
  }
);

export const updateServiceCharge = createAsyncThunk(
  'serviceCharges/updateServiceCharge',
  async ({ id, data }, { rejectWithValue }) => {
    try {
      const response = await serviceChargesAPI.updateServiceCharge(id, data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update service charge Refresh the page or try again later.'));
    }
  }
);

export const deleteServiceCharge = createAsyncThunk(
  'serviceCharges/deleteServiceCharge',
  async (id, { rejectWithValue }) => {
    try {
      const response = await serviceChargesAPI.deleteServiceCharge(id);
      return { id, data: response.data };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete service charge Refresh the page or try again later.'));
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
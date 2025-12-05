import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Initial state
const initialState = {
  patients: [],
  currentPatient: null,
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
    status: '',
    department: '',
  },
};

// Async thunks
export const fetchPatients = createAsyncThunk(
  'patients/fetchPatients',
  async (params = {}, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      // Simulate API call
      const queryParams = new URLSearchParams(params).toString();
      const response = await fetch(`/api/patients?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patients');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchPatientById = createAsyncThunk(
  'patients/fetchPatientById',
  async (patientId, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      // Simulate API call
      const response = await fetch(`/api/patients/${patientId}`, {
        headers: {
          Authorization: `Bearer ${auth.token}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch patient details');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createPatient = createAsyncThunk(
  'patients/createPatient',
  async (patientData, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      // Simulate API call
      const response = await fetch('/api/patients', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(patientData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to create patient');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updatePatient = createAsyncThunk(
  'patients/updatePatient',
  async ({ patientId, patientData }, { getState, rejectWithValue }) => {
    try {
      const { auth } = getState();
      if (!auth.token) {
        throw new Error('No authentication token');
      }
      
      // Simulate API call
      const response = await fetch(`/api/patients/${patientId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify(patientData),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update patient');
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Patient slice
const patientSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearPatientError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        status: '',
        department: '',
      };
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch patients
      .addCase(fetchPatients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients = action.payload.data;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch patient by ID
      .addCase(fetchPatientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPatient = action.payload;
        state.error = null;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create patient
      .addCase(createPatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createPatient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients.unshift(action.payload);
        state.error = null;
      })
      .addCase(createPatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update patient
      .addCase(updatePatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePatient.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.patients.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.patients[index] = action.payload;
        }
        if (state.currentPatient?.id === action.payload.id) {
          state.currentPatient = action.payload;
        }
        state.error = null;
      })
      .addCase(updatePatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const {
  clearPatientError,
  setFilters,
  clearFilters,
  setCurrentPatient,
  clearCurrentPatient,
} = patientSlice.actions;
export default patientSlice.reducer;


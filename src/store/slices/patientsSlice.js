import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { 
  getPatients, 
  getPatientById, 
  createPatient, 
  updatePatient, 
  deletePatient 
} from '../../services/api/patientsAPI';
import { getErrorMessage } from '../../utils/errorHandler';

// Initial state
const initialState = {
  patients: [],
  currentPatient: null,
  isLoading: false,
  error: null,
  lastFetch: null,
};

// Async thunks
export const fetchPatients = createAsyncThunk(
  'patients/fetchPatients',
  async (_, { rejectWithValue }) => {
    try {
      const response = await getPatients();
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch patients'));
    }
  }
);

export const fetchPatientById = createAsyncThunk(
  'patients/fetchPatientById',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await getPatientById(patientId);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to fetch patient'));
    }
  }
);

export const addPatient = createAsyncThunk(
  'patients/addPatient',
  async (patientData, { rejectWithValue }) => {
    try {
      const response = await createPatient(patientData);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to create patient'));
    }
  }
);

export const editPatient = createAsyncThunk(
  'patients/editPatient',
  async ({ patientId, updateData }, { rejectWithValue }) => {
    try {
      const response = await updatePatient(patientId, updateData);
      return response;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to update patient'));
    }
  }
);

export const removePatient = createAsyncThunk(
  'patients/removePatient',
  async (patientId, { rejectWithValue }) => {
    try {
      const response = await deletePatient(patientId);
      return { patientId, response };
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, 'Failed to delete patient'));
    }
  }
);

// Slice
const patientsSlice = createSlice({
  name: 'patients',
  initialState,
  reducers: {
    clearPatientsError: (state) => {
      state.error = null;
    },
    clearCurrentPatient: (state) => {
      state.currentPatient = null;
    },
    setCurrentPatient: (state, action) => {
      state.currentPatient = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Patients
      .addCase(fetchPatients.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPatients.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients = action.payload.data || [];
        state.lastFetch = Date.now();
      })
      .addCase(fetchPatients.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Patient by ID
      .addCase(fetchPatientById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.currentPatient = null;
      })
      .addCase(fetchPatientById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentPatient = action.payload.data;
      })
      .addCase(fetchPatientById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Add Patient
      .addCase(addPatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(addPatient.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          state.patients.unshift(action.payload.data);
        }
      })
      .addCase(addPatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Edit Patient
      .addCase(editPatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(editPatient.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          const index = state.patients.findIndex(p => p.id === action.payload.data.id);
          if (index !== -1) {
            state.patients[index] = action.payload.data;
          }
          if (state.currentPatient?.id === action.payload.data.id) {
            state.currentPatient = action.payload.data;
          }
        }
      })
      .addCase(editPatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Remove Patient
      .addCase(removePatient.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(removePatient.fulfilled, (state, action) => {
        state.isLoading = false;
        state.patients = state.patients.filter(p => p.id !== action.payload.patientId);
        if (state.currentPatient?.id === action.payload.patientId) {
          state.currentPatient = null;
        }
      })
      .addCase(removePatient.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPatientsError, clearCurrentPatient, setCurrentPatient } = patientsSlice.actions;
export default patientsSlice.reducer;
